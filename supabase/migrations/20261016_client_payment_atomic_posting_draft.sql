-- Draft only. Requires the event inbox and adjustment ledger draft tables.
-- Do not apply to production before staging validation.
-- Draft posting transaction. A single row lock serializes concurrent attempts
-- for the same inbox event. The ledger insert and inbox completion commit together.
-- Only service_role may execute this function; it does not bypass RLS.
create or replace function public.post_verified_client_payment_adjustment(
  p_inbox_id uuid,
  p_payment_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $post_adjustment$
declare
  incoming public.client_payment_event_inbox%rowtype;
  existing public.client_payment_adjustments%rowtype;
  posted_id uuid;
begin
  if p_inbox_id is null or p_payment_id is null then
    raise exception 'Posting requires inbox and payment IDs' using errcode = '22023';
  end if;

  select * into incoming
  from public.client_payment_event_inbox
  where id = p_inbox_id
  for update;
  if not found then
    raise exception 'Financial event inbox row not found' using errcode = '22023';
  end if;

  if incoming.processing_state = 'processed' then
    select * into existing from public.client_payment_adjustments
    where connected_account_id = incoming.connected_account_id
      and stripe_event_id = incoming.stripe_event_id;
    if not found or existing.payment_id is distinct from p_payment_id
       or existing.organization_id is distinct from incoming.organization_id
       or existing.stripe_object_id is distinct from incoming.stripe_object_id
       or existing.stripe_payment_intent_id is distinct from incoming.stripe_payment_intent_id
       or existing.event_type is distinct from incoming.event_type
       or existing.amount_cents is distinct from incoming.amount_cents
       or existing.currency is distinct from incoming.currency
       or existing.status is distinct from incoming.stripe_status
       or existing.occurred_at is distinct from incoming.occurred_at
       or existing.livemode is distinct from incoming.livemode then
      raise exception 'Conflicting processed financial event' using errcode = '23505';
    end if;
    return existing.id;
  end if;

  if incoming.processing_state <> 'ready_for_posting'
     or incoming.event_type not in (
       'refund.created', 'refund.updated', 'charge.dispute.created',
       'charge.dispute.updated', 'charge.dispute.closed'
     )
     or incoming.stripe_payment_intent_id is null
     or incoming.amount_cents is null
     or incoming.currency is null
     or incoming.stripe_status is null
     or incoming.stripe_status = ''
     or incoming.matched_payment_id is distinct from p_payment_id then
    raise exception 'Financial event not eligible for posting' using errcode = '23514';
  end if;

  -- Acquire the strongest required payment lock first, before reading
  -- dependent evidence. A later SHARE-to-UPDATE upgrade can deadlock
  -- when independent workers post refunds for the same payment.
  perform 1 from public.billing_payments p
  where p.id = p_payment_id and p.organization_id = incoming.organization_id
  for update;
  if not found then
    raise exception 'Original invoice payment unavailable' using errcode = '23514';
  end if;

  -- Revalidate the original payment at posting time. Authorization may
  -- precede posting, so the original payment must still be trustworthy.
  perform 1
  from public.billing_payments p
  join public.billing_invoices i
    on i.id = p.invoice_id and i.organization_id = p.organization_id
  where p.id = p_payment_id
    and p.organization_id = incoming.organization_id
    and p.status = 'succeeded'
    and p.processor = 'stripe'
    and p.processor_reference = incoming.stripe_payment_intent_id
    and i.currency = incoming.currency
    and p.amount_cents >= incoming.amount_cents
    and exists (
      select 1 from public.organization_payment_connections c
      where c.organization_id = incoming.organization_id
        and c.stripe_account_id = incoming.connected_account_id
        and c.provider = 'stripe'
        and c.mode = case when incoming.livemode then 'live' else 'sandbox' end
    )
  for share of p, i;
  if not found then
    raise exception 'Original payment no longer valid for posting'
      using errcode = '23514';
  end if;

  -- Serialize adjustments across different inbox events for the same payment.
  -- Refund updates for the same Stripe refund object are snapshots, not
  -- additional refunds. Count each distinct refund at its maximum recorded
  -- amount, including pending states, to fail closed.
  if incoming.event_type like 'refund.%' then
    if (
      select coalesce(sum(refund_amount), 0)
      from (
        select max(a.amount_cents) as refund_amount
        from public.client_payment_adjustments a
        where a.payment_id = p_payment_id
          and a.event_type like 'refund.%'
          and a.stripe_object_id <> incoming.stripe_object_id
        group by a.stripe_object_id
      ) previous_refunds
    ) + greatest(incoming.amount_cents, coalesce((
      select max(a.amount_cents)
      from public.client_payment_adjustments a
      where a.payment_id = p_payment_id
        and a.event_type like 'refund.%'
        and a.stripe_object_id = incoming.stripe_object_id
    ), 0)) > (
      select p.amount_cents from public.billing_payments p where p.id = p_payment_id
    ) then
      raise exception 'Aggregate refunds exceed original payment'
        using errcode = '23514';
    end if;
  end if;

  -- A later snapshot for one refund object must never report a smaller
  -- amount than an already-posted snapshot of that same refund.
  if incoming.event_type like 'refund.%'
     and exists (
       select 1 from public.client_payment_adjustments a
       where a.payment_id = p_payment_id
         and a.event_type like 'refund.%'
         and a.stripe_object_id = incoming.stripe_object_id
         and a.amount_cents > incoming.amount_cents
     ) then
    raise exception 'Refund amount regressed from recorded snapshot'
      using errcode = '23514';
  end if;

  insert into public.client_payment_adjustments (
    organization_id, invoice_id, payment_id, connected_account_id,
    stripe_event_id, stripe_object_id, stripe_payment_intent_id,
    event_type, amount_cents, currency, status, occurred_at, livemode
  )
  select incoming.organization_id, p.invoice_id, p.id,
         incoming.connected_account_id, incoming.stripe_event_id,
         incoming.stripe_object_id, incoming.stripe_payment_intent_id,
         incoming.event_type, incoming.amount_cents, incoming.currency,
         incoming.stripe_status, incoming.occurred_at, incoming.livemode
  from public.billing_payments p
  where p.id = p_payment_id
    and p.organization_id = incoming.organization_id
  on conflict (connected_account_id, stripe_event_id) do nothing
  returning id into posted_id;

  if posted_id is null then
    select * into existing from public.client_payment_adjustments
    where connected_account_id = incoming.connected_account_id
      and stripe_event_id = incoming.stripe_event_id;
    if not found or existing.payment_id is distinct from p_payment_id
       or existing.organization_id is distinct from incoming.organization_id
       or existing.stripe_object_id is distinct from incoming.stripe_object_id
       or existing.stripe_payment_intent_id is distinct from incoming.stripe_payment_intent_id
       or existing.event_type is distinct from incoming.event_type
       or existing.amount_cents is distinct from incoming.amount_cents
       or existing.currency is distinct from incoming.currency
       or existing.status is distinct from incoming.stripe_status
       or existing.occurred_at is distinct from incoming.occurred_at
       or existing.livemode is distinct from incoming.livemode then
      raise exception 'Conflicting financial event replay' using errcode = '23505';
    end if;
    posted_id := existing.id;
  end if;
  if posted_id is null then
    raise exception 'Original invoice payment unavailable' using errcode = '23514';
  end if;

  update public.client_payment_event_inbox
  set processing_state = 'processed',
      matched_payment_id = p_payment_id,
      processed_at = now(),
      last_error_code = null,
      updated_at = now()
  where id = p_inbox_id;
  return posted_id;
end;
$post_adjustment$;

revoke all on function public.post_verified_client_payment_adjustment(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.post_verified_client_payment_adjustment(uuid, uuid)
  to service_role;
-- Service-role execution only. The server MUST reauthorize signed Stripe
-- events and matched payments before calling this RPC; do not expose to clients.

