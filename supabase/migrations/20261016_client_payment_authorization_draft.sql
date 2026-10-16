-- Draft only. Run after the inbox and adjustment ledger migrations.
-- This authorization transition is a separate, atomic database operation.
-- It must be called only after server-side signature and event verification.
create or replace function public.authorize_client_payment_adjustment_posting(
  p_inbox_id uuid,
  p_payment_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $authorize_posting$
declare
  incoming public.client_payment_event_inbox%rowtype;
  original record;
  payment_matches integer;
begin
  if p_inbox_id is null or p_payment_id is null then
    raise exception 'Inbox and payment IDs are required' using errcode = '22023';
  end if;

  select * into incoming from public.client_payment_event_inbox
  where id = p_inbox_id for update;
  if not found then
    raise exception 'Financial inbox event unavailable' using errcode = '22023';
  end if;

  if incoming.processing_state not in ('pending', 'needs_enrichment', 'needs_payment_match', 'ready_for_posting')
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
    raise exception 'Financial inbox event cannot be authorized' using errcode = '23514';
  end if;

  select p.organization_id, p.invoice_id, p.amount_cents, p.status,
         p.processor, p.processor_reference, i.currency
  into original
  from public.billing_payments p
  join public.billing_invoices i
    on i.id = p.invoice_id and i.organization_id = p.organization_id
  where p.id = p_payment_id
  for share of p, i;

  if not found
     or original.organization_id is distinct from incoming.organization_id
     or original.status is distinct from 'succeeded'
     or original.processor is distinct from 'stripe'
     or original.processor_reference is distinct from incoming.stripe_payment_intent_id
     or original.currency is distinct from incoming.currency
     or original.amount_cents is null
     or incoming.amount_cents > original.amount_cents
     or not exists (
       select 1 from public.organization_payment_connections c
       where c.organization_id = incoming.organization_id
         and c.stripe_account_id = incoming.connected_account_id
         and c.provider = 'stripe'
         and c.mode = case when incoming.livemode then 'live' else 'sandbox' end
     ) then
    raise exception 'Financial inbox payment verification failed' using errcode = '23514';
  end if;

  -- A PaymentIntent must identify exactly one successful invoice payment
  -- for this organization. Ambiguity requires review, never authorization.
  select count(*) into payment_matches
  from public.billing_payments p
  where p.organization_id = incoming.organization_id
    and p.processor = 'stripe'
    and p.status = 'succeeded'
    and p.processor_reference = incoming.stripe_payment_intent_id;
  if payment_matches <> 1 then
    raise exception 'Financial payment match is ambiguous'
      using errcode = '23514';
  end if;

  if incoming.processing_state = 'ready_for_posting' then
    return false;
  end if;

  update public.client_payment_event_inbox
  set processing_state = 'ready_for_posting',
      matched_payment_id = p_payment_id,
      last_error_code = null,
      updated_at = now()
  where id = p_inbox_id;
  return true;
end;
$authorize_posting$;

revoke all on function public.authorize_client_payment_adjustment_posting(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.authorize_client_payment_adjustment_posting(uuid, uuid)
  to service_role;
-- TODO before activation: bind this transition to an authenticated,
-- signature-verified server reconciliation worker, not a public API.
