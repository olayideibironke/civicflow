-- CivicFlow Stripe Connect sandbox checkout foundation.
-- Direct charges are routed to the law firm's connected Stripe account.
-- Trust / IOLTA funds are intentionally excluded from this flow.

create table if not exists public.organization_payment_connections (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  provider text not null default 'stripe' check (provider = 'stripe'),
  mode text not null check (mode in ('sandbox','live')),
  stripe_account_id text not null unique,
  status text not null default 'active' check (status in ('active','restricted','disconnected')),
  operating_payments_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_payment_connections enable row level security;
revoke all on table public.organization_payment_connections from anon, authenticated;
grant select, insert, update on table public.organization_payment_connections to authenticated;

drop policy if exists "Staff read org payment connection" on public.organization_payment_connections;
create policy "Staff read org payment connection"
on public.organization_payment_connections
for select to authenticated
using (public.is_staff_for_org(organization_id));

drop policy if exists "Staff create org payment connection" on public.organization_payment_connections;
create policy "Staff create org payment connection"
on public.organization_payment_connections
for insert to authenticated
with check (public.is_staff_for_org(organization_id));

drop policy if exists "Staff update org payment connection" on public.organization_payment_connections;
create policy "Staff update org payment connection"
on public.organization_payment_connections
for update to authenticated
using (public.is_staff_for_org(organization_id))
with check (public.is_staff_for_org(organization_id));

drop trigger if exists organization_payment_connections_touch_updated_at on public.organization_payment_connections;
create trigger organization_payment_connections_touch_updated_at
before update on public.organization_payment_connections
for each row execute function private.touch_updated_at();

create table if not exists private.stripe_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.billing_invoices(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  checkout_session_id text not null unique,
  connected_account_id text not null,
  expected_amount_cents bigint not null check (expected_amount_cents > 0),
  currency text not null default 'usd',
  status text not null default 'open' check (status in ('open','pending','completed','failed','expired')),
  payment_intent_id text,
  created_by uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists stripe_checkout_sessions_invoice_idx
  on private.stripe_checkout_sessions(invoice_id, created_at desc);

revoke all on table private.stripe_checkout_sessions from public, anon, authenticated;

create table if not exists private.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  connected_account_id text,
  created_at timestamptz not null default now()
);

revoke all on table private.stripe_webhook_events from public, anon, authenticated;

create unique index if not exists billing_payments_processor_reference_uidx
on public.billing_payments(processor, processor_reference)
where processor_reference is not null;

create or replace function public.register_stripe_checkout_session(
  p_invoice_id uuid,
  p_checkout_session_id text,
  p_connected_account_id text,
  p_expected_amount_cents bigint,
  p_currency text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_invoice public.billing_invoices%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select i.* into v_invoice
  from public.billing_invoices i
  join public.client_case_access cca
    on cca.user_id = auth.uid()
   and cca.case_id = i.case_id
   and cca.organization_id = i.organization_id
  join public.organization_payment_connections c
    on c.organization_id = i.organization_id
   and c.stripe_account_id = p_connected_account_id
   and c.provider = 'stripe'
   and c.status = 'active'
   and c.operating_payments_enabled = true
  where i.id = p_invoice_id
    and i.status in ('sent','partially_paid')
    and i.balance_cents > 0
  limit 1;

  if v_invoice.id is null then
    raise exception 'Invoice is not eligible for Stripe Checkout.';
  end if;
  if p_expected_amount_cents <> v_invoice.balance_cents then
    raise exception 'Checkout amount does not match the invoice balance.';
  end if;
  if lower(coalesce(p_currency,'')) <> lower(v_invoice.currency) then
    raise exception 'Checkout currency does not match the invoice currency.';
  end if;

  insert into private.stripe_checkout_sessions (
    organization_id, invoice_id, case_id, checkout_session_id,
    connected_account_id, expected_amount_cents, currency, status, created_by
  )
  values (
    v_invoice.organization_id, v_invoice.id, v_invoice.case_id, p_checkout_session_id,
    p_connected_account_id, p_expected_amount_cents, lower(p_currency), 'open', auth.uid()
  )
  on conflict (checkout_session_id) do nothing;
end;
$$;

revoke all on function public.register_stripe_checkout_session(uuid,text,text,bigint,text) from public, anon;
grant execute on function public.register_stripe_checkout_session(uuid,text,text,bigint,text) to authenticated;

create or replace function private.stripe_webhook_secret(p_mode text)
returns text
language sql
security definer
set search_path = pg_catalog, vault
as $$
  select ds.decrypted_secret
  from vault.decrypted_secrets ds
  where ds.name = case
    when p_mode = 'live' then 'civicflow_stripe_webhook_live'
    else 'civicflow_stripe_webhook_sandbox'
  end
  order by ds.updated_at desc
  limit 1
$$;

revoke all on function private.stripe_webhook_secret(text) from public, anon, authenticated;

create or replace function private.verify_stripe_signature(
  p_payload text,
  p_signature text,
  p_mode text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, extensions, vault
as $$
declare
  v_secret text;
  v_timestamp_text text;
  v_timestamp bigint;
  v_expected text;
  v_part text;
  v_now bigint := floor(extract(epoch from now()))::bigint;
begin
  v_secret := private.stripe_webhook_secret(p_mode);
  if v_secret is null or length(v_secret) = 0 then return false; end if;

  foreach v_part in array string_to_array(coalesce(p_signature,''), ',') loop
    if split_part(trim(v_part), '=', 1) = 't' then
      v_timestamp_text := split_part(trim(v_part), '=', 2);
      exit;
    end if;
  end loop;

  if v_timestamp_text is null or v_timestamp_text !~ '^[0-9]+$' then return false; end if;
  v_timestamp := v_timestamp_text::bigint;
  if abs(v_now - v_timestamp) > 300 then return false; end if;

  v_expected := encode(
    extensions.hmac(
      convert_to(v_timestamp_text || '.' || p_payload, 'UTF8'),
      convert_to(v_secret, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  foreach v_part in array string_to_array(coalesce(p_signature,''), ',') loop
    if split_part(trim(v_part), '=', 1) = 'v1'
       and lower(split_part(trim(v_part), '=', 2)) = lower(v_expected) then
      return true;
    end if;
  end loop;

  return false;
exception when others then
  return false;
end;
$$;

revoke all on function private.verify_stripe_signature(text,text,text) from public, anon, authenticated;

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
  v_account := v_event ->> 'account';
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
  if v_registered.connected_account_id is distinct from v_account then
    raise exception 'Stripe connected account does not match the registered invoice.';
  end if;

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

insert into public.organization_payment_connections (
  organization_id, provider, mode, stripe_account_id, status, operating_payments_enabled
)
values (
  '31829db4-bd41-4c39-b61e-46bf91087af1',
  'stripe',
  'sandbox',
  'acct_1UPEluFUViLSfdsa',
  'active',
  true
)
on conflict (organization_id) do update set
  provider = excluded.provider,
  mode = excluded.mode,
  stripe_account_id = excluded.stripe_account_id,
  status = excluded.status,
  operating_payments_enabled = excluded.operating_payments_enabled,
  updated_at = now();
