-- Draft only. Requires the event inbox and adjustment ledger draft tables.
-- Do not apply to production before staging validation.
-- Draft posting transaction. A single row lock serializes concurrent attempts
-- for the same inbox event. The ledger insert and inbox completion commit together.
-- This function is NOT exposed to anon/authenticated roles.
create or replace function public.post_verified_client_payment_adjustment(
  p_inbox_id uuid,
  p_payment_id uuid
)
returns uuid
language plpgsql
security definer
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
       or existing.stripe_object_id is distinct from incoming.stripe_object_id then
      raise exception 'Conflicting processed financial event' using errcode = '23505';
    end if;
    return existing.id;
  end if;

  if incoming.processing_state not in ('pending', 'needs_payment_match', 'needs_enrichment')
     or incoming.event_type not in (
       'refund.created', 'refund.updated', 'charge.dispute.created',
       'charge.dispute.updated', 'charge.dispute.closed'
     )
     or incoming.stripe_payment_intent_id is null
     or incoming.amount_cents is null
     or incoming.currency is null
     or incoming.stripe_status is null
     or incoming.stripe_status = ''
     or incoming.matched_payment_id is not null
        and incoming.matched_payment_id <> p_payment_id then
    raise exception 'Financial event not eligible for posting' using errcode = '23514';
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
-- Service-role execution only. The server MUST reauthorize signed Stripe
-- events and matched payments before calling this RPC; do not expose to clients.

