-- Correct CivicFlow sandbox payments to use the dedicated Stripe merchant account directly.
-- This is not a Stripe Connect platform charge. Trust / IOLTA remains excluded.

update public.organization_payment_connections
set stripe_account_id = 'acct_1UPEdsFUVijXk0Be',
    status = 'active',
    operating_payments_enabled = true,
    updated_at = now()
where organization_id = '31829db4-bd41-4c39-b61e-46bf91087af1'
  and provider = 'stripe'
  and mode = 'sandbox';

create or replace function public.process_stripe_checkout_webhook(
  p_payload text,
  p_signature text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_event jsonb;
  v_object jsonb;
  v_event_id text;
  v_event_type text;
  v_account text;
  v_mode text;
  v_session_id text;
  v_payment_status text;
  v_payment_intent text;
  v_invoice_id uuid;
  v_organization_id uuid;
  v_case_id uuid;
  v_amount_total bigint;
  v_registered private.stripe_checkout_sessions%rowtype;
  v_inserted integer;
begin
  begin
    v_event := p_payload::jsonb;
  exception when others then
    raise exception 'Invalid Stripe webhook payload.';
  end;

  v_mode := case when coalesce((v_event ->> 'livemode')::boolean, false) then 'live' else 'sandbox' end;
  if not private.verify_stripe_signature(p_payload, p_signature, v_mode) then
    raise exception 'Invalid Stripe webhook signature.';
  end if;

  v_event_id := v_event ->> 'id';
  v_event_type := v_event ->> 'type';
  v_account := nullif(v_event ->> 'account', '');
  v_object := v_event #> '{data,object}';

  if v_event_id is null or v_event_type is null or v_object is null then
    raise exception 'Incomplete Stripe webhook event.';
  end if;

  insert into private.stripe_webhook_events(event_id, event_type, connected_account_id)
  values (v_event_id, v_event_type, v_account)
  on conflict (event_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return jsonb_build_object('processed', false, 'reason', 'duplicate_event');
  end if;

  if v_event_type not in (
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired'
  ) then
    return jsonb_build_object('processed', false, 'reason', 'ignored_event_type');
  end if;

  v_session_id := v_object ->> 'id';
  select * into v_registered
  from private.stripe_checkout_sessions s
  where s.checkout_session_id = v_session_id
  for update;

  if v_registered.id is null then
    raise exception 'Stripe Checkout session is not registered with CivicFlow.';
  end if;

  if v_account is not null
     and v_registered.connected_account_id is distinct from v_account then
    raise exception 'Stripe account does not match the registered invoice.';
  end if;

  v_account := coalesce(v_account, v_registered.connected_account_id);

  update private.stripe_webhook_events
  set connected_account_id = v_account
  where event_id = v_event_id
    and connected_account_id is null;

  if not exists (
    select 1
    from public.organization_payment_connections c
    where c.organization_id = v_registered.organization_id
      and c.stripe_account_id = v_registered.connected_account_id
      and c.mode = v_mode
      and c.status = 'active'
      and c.operating_payments_enabled = true
  ) then
    raise exception 'Stripe payment connection is not active for this organization.';
  end if;

  if v_event_type in ('checkout.session.async_payment_failed','checkout.session.expired') then
    update private.stripe_checkout_sessions
    set status = case when v_event_type = 'checkout.session.expired' then 'expired' else 'failed' end
    where id = v_registered.id;

    return jsonb_build_object(
      'processed', true,
      'invoice_id', v_registered.invoice_id,
      'status', 'not_paid'
    );
  end if;

  v_payment_status := v_object ->> 'payment_status';

  if v_payment_status = 'unpaid' then
    update private.stripe_checkout_sessions set status = 'pending' where id = v_registered.id;

    return jsonb_build_object(
      'processed', true,
      'invoice_id', v_registered.invoice_id,
      'status', 'pending'
    );
  end if;

  if v_payment_status not in ('paid','no_payment_required') then
    raise exception 'Unexpected Stripe Checkout payment status.';
  end if;

  v_amount_total := coalesce((v_object ->> 'amount_total')::bigint, 0);
  if v_amount_total <> v_registered.expected_amount_cents then
    raise exception 'Stripe payment amount does not match the registered invoice balance.';
  end if;

  v_invoice_id := nullif(v_object #>> '{metadata,invoice_id}', '')::uuid;
  v_organization_id := nullif(v_object #>> '{metadata,organization_id}', '')::uuid;
  v_case_id := nullif(v_object #>> '{metadata,case_id}', '')::uuid;

  if v_invoice_id is distinct from v_registered.invoice_id
     or v_organization_id is distinct from v_registered.organization_id
     or v_case_id is distinct from v_registered.case_id then
    raise exception 'Stripe Checkout metadata does not match the registered CivicFlow invoice.';
  end if;

  v_payment_intent := nullif(v_object ->> 'payment_intent', '');

  insert into public.billing_payments (
    invoice_id, organization_id, case_id, amount_cents, status, payment_method,
    processor, processor_reference, funds_destination, memo, received_at, created_by
  )
  values (
    v_registered.invoice_id, v_registered.organization_id, v_registered.case_id,
    v_registered.expected_amount_cents, 'succeeded', 'stripe_checkout', 'stripe',
    coalesce(v_payment_intent, v_registered.checkout_session_id), 'operating',
    'Stripe Checkout ' || v_registered.checkout_session_id, now(), null
  )
  on conflict (processor, processor_reference)
    where processor_reference is not null
  do nothing;

  update private.stripe_checkout_sessions
  set status = 'completed',
      payment_intent_id = v_payment_intent,
      completed_at = coalesce(completed_at, now())
  where id = v_registered.id;

  return jsonb_build_object(
    'processed', true,
    'invoice_id', v_registered.invoice_id,
    'status', 'paid'
  );
end;
$$;

revoke all on function public.process_stripe_checkout_webhook(text,text) from public, authenticated;
grant execute on function public.process_stripe_checkout_webhook(text,text) to anon, service_role;
