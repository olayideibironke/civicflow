-- Draft only. Do not apply until staging verification and atomic posting are complete.
-- Immutable, service-role-only history of verified Stripe Connect financial adjustments.
-- Original invoice payments remain intact; this table does not alter invoice balances.
create table if not exists public.client_payment_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  invoice_id uuid not null references public.billing_invoices(id),
  payment_id uuid not null references public.billing_payments(id),
  connected_account_id text not null check (connected_account_id ~ '^acct_[A-Za-z0-9]+$'),
  stripe_event_id text not null check (stripe_event_id ~ '^evt_[A-Za-z0-9]+$'),
  stripe_object_id text not null,
  stripe_payment_intent_id text not null check (stripe_payment_intent_id ~ '^pi_[A-Za-z0-9]+$'),
  event_type text not null check (event_type in (
    'refund.created', 'refund.updated',
    'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed'
  )),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  status text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  livemode boolean not null,
  unique (connected_account_id, stripe_event_id),
  constraint adjustment_object_type_check check (
    (event_type like 'refund.%' and stripe_object_id ~ '^re_[A-Za-z0-9]+$') or
    (event_type like 'charge.dispute.%' and stripe_object_id ~ '^dp_[A-Za-z0-9]+$')
  )
);
create index if not exists client_payment_adjustments_invoice_idx
  on public.client_payment_adjustments (organization_id, invoice_id, occurred_at desc);
create index if not exists client_payment_adjustments_intent_idx
  on public.client_payment_adjustments (connected_account_id, stripe_payment_intent_id);

-- Recheck tenant and original-payment ownership inside the database.
-- Application-side authorization alone cannot protect a future direct RPC caller.
create or replace function public.validate_client_payment_adjustment_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $validate_adjustment$
declare
  original record;
begin
  select p.organization_id, p.invoice_id, p.amount_cents, p.status,
         p.processor, p.processor_reference, i.currency
    into original
  from public.billing_payments p
  join public.billing_invoices i
    on i.id = p.invoice_id and i.organization_id = p.organization_id
  where p.id = new.payment_id
  for share of p, i;

  if not found or original.organization_id is distinct from new.organization_id
     or original.invoice_id is distinct from new.invoice_id
     or original.status is distinct from 'succeeded'
     or original.processor is distinct from 'stripe'
     or original.processor_reference is distinct from new.stripe_payment_intent_id
     or original.currency is distinct from new.currency
     or original.amount_cents is null
     or new.amount_cents > original.amount_cents then
    raise exception 'Financial adjustment original payment verification failed'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.organization_payment_connections c
    where c.organization_id = new.organization_id
      and c.stripe_account_id = new.connected_account_id
      and c.provider = 'stripe'
      and c.mode = case when new.livemode then 'live' else 'sandbox' end
  ) then
    raise exception 'Financial adjustment connected account verification failed'
      using errcode = '23514';
  end if;
  return new;
end;
$validate_adjustment$;

drop trigger if exists client_payment_adjustments_validate_insert
  on public.client_payment_adjustments;
create trigger client_payment_adjustments_validate_insert
before insert on public.client_payment_adjustments
for each row execute function public.validate_client_payment_adjustment_insert();

-- Historical financial records are append-only, including for service-role
-- callers. The future posting transaction may INSERT, but must not rewrite
-- or delete previously recorded events.
create or replace function public.reject_client_payment_adjustment_mutation()
returns trigger
language plpgsql
set search_path = ''
as $immutable_adjustment$
begin
  raise exception 'Financial adjustment history is append-only'
    using errcode = '23514';
end;
$immutable_adjustment$;

drop trigger if exists client_payment_adjustments_immutable
  on public.client_payment_adjustments;
create trigger client_payment_adjustments_immutable
before update or delete on public.client_payment_adjustments
for each row execute function public.reject_client_payment_adjustment_mutation();

alter table public.client_payment_adjustments enable row level security;
revoke all on public.client_payment_adjustments from public, anon, authenticated;
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

