-- Draft only. Do not apply until staging verification is complete.
-- Signed Stripe Connect financial events are stored without altering invoices.
-- The webhook must verify signature, account ownership and environment first.
create table if not exists public.client_payment_event_inbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  connected_account_id text not null check (connected_account_id ~ '^acct_[A-Za-z0-9]+$'),
  stripe_event_id text not null check (stripe_event_id ~ '^evt_[A-Za-z0-9]+$'),
  stripe_object_id text not null,
  stripe_payment_intent_id text check (
    stripe_payment_intent_id is null or stripe_payment_intent_id ~ '^pi_[A-Za-z0-9]+$'
  ),
  amount_cents bigint check (amount_cents >= 0),
  currency text check (currency is null or currency ~ '^[a-z]{3}$'),
  stripe_status text,
  event_type text not null check (event_type in (
    'refund.created', 'refund.updated',
    'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed',
    'payment_intent.payment_failed', 'payment_intent.canceled'
  )),
  livemode boolean not null,
  occurred_at timestamptz not null,
  processing_state text not null default 'pending' check (processing_state in (
    'pending', 'needs_enrichment', 'needs_payment_match', 'needs_review', 'ready_for_posting', 'processed', 'rejected'
  )),
  attempts integer not null default 0 check (attempts >= 0),
  last_error_code text,
  matched_payment_id uuid references public.billing_payments(id),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connected_account_id, stripe_event_id),
  constraint processed_requires_payment check (
    processing_state <> 'processed' or
    (matched_payment_id is not null and processed_at is not null)
  )
);
create index if not exists client_payment_event_inbox_pending_idx
  on public.client_payment_event_inbox(processing_state, created_at)
  where processing_state <> 'processed';
create index if not exists client_payment_event_inbox_intent_idx
  on public.client_payment_event_inbox(connected_account_id, stripe_payment_intent_id);

-- Once authorization has selected a payment, event evidence must be
-- immutable. Only the state machine may advance ready_for_posting to processed.
create or replace function public.guard_client_payment_event_inbox_update()
returns trigger
language plpgsql
set search_path = ''
as $guard_financial_inbox$
begin
  if old.processing_state in ('ready_for_posting', 'processed', 'rejected') then
    if row(
      new.organization_id, new.connected_account_id, new.stripe_event_id,
      new.stripe_object_id, new.stripe_payment_intent_id, new.amount_cents,
      new.currency, new.stripe_status, new.event_type, new.livemode,
      new.occurred_at, new.created_at, new.matched_payment_id
    ) is distinct from row(
      old.organization_id, old.connected_account_id, old.stripe_event_id,
      old.stripe_object_id, old.stripe_payment_intent_id, old.amount_cents,
      old.currency, old.stripe_status, old.event_type, old.livemode,
      old.occurred_at, old.created_at, old.matched_payment_id
    ) then
      raise exception 'Authorized financial event evidence cannot be changed'
        using errcode = '23514';
    end if;
    if old.processing_state = 'processed' or old.processing_state = 'rejected' then
      raise exception 'Terminal financial inbox events cannot be changed'
        using errcode = '23514';
    end if;
    if new.processing_state <> 'processed' or new.processed_at is null then
      raise exception 'Authorized financial event may only complete posting'
        using errcode = '23514';
    end if;
  end if;
  -- Authorization must not silently modify the event it is approving.
  -- Enrichment is a separate step while the record is still pending.
  if new.processing_state = 'ready_for_posting'
     and row(
       new.organization_id, new.connected_account_id, new.stripe_event_id,
       new.stripe_object_id, new.stripe_payment_intent_id, new.amount_cents,
       new.currency, new.stripe_status, new.event_type, new.livemode,
       new.occurred_at, new.created_at
     ) is distinct from row(
       old.organization_id, old.connected_account_id, old.stripe_event_id,
       old.stripe_object_id, old.stripe_payment_intent_id, old.amount_cents,
       old.currency, old.stripe_status, old.event_type, old.livemode,
       old.occurred_at, old.created_at
     ) then
    raise exception 'Financial event authorization cannot alter evidence'
      using errcode = '23514';
  end if;
  -- Only an authorized, already-matched event can be completed. Neither
  -- the completion timestamp nor the matched payment may be prepopulated.
  if old.processing_state = 'ready_for_posting' then
    if old.processed_at is not null
       or new.attempts is distinct from old.attempts
       or new.last_error_code is not null
       or new.created_at is distinct from old.created_at
       or new.updated_at < old.updated_at then
      raise exception 'Invalid financial posting metadata transition'
        using errcode = '23514';
    end if;
  end if;
  if new.processing_state = 'ready_for_posting' then
    if old.processing_state not in ('pending', 'needs_enrichment', 'needs_payment_match')
       or new.matched_payment_id is null
       or new.processed_at is not null then
      raise exception 'Invalid financial inbox authorization transition'
        using errcode = '23514';
    end if;
  end if;
  if new.processing_state = 'processed' and
     (old.processing_state <> 'ready_for_posting'
      or new.matched_payment_id is null or new.processed_at is null) then
    raise exception 'Financial inbox posting requires authorization'
      using errcode = '23514';
  end if;
  return new;
end;
$guard_financial_inbox$;

drop trigger if exists client_payment_event_inbox_update_guard
  on public.client_payment_event_inbox;
create trigger client_payment_event_inbox_update_guard
before update on public.client_payment_event_inbox
for each row execute function public.guard_client_payment_event_inbox_update();

-- A financial event cannot enter the inbox already authorized or processed.
-- Prevent deletion of evidence even by a service-role worker.
create or replace function public.guard_client_payment_event_inbox_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $guard_inbox_lifecycle$
begin
  if tg_op = 'DELETE' then
    raise exception 'Financial inbox history cannot be deleted'
      using errcode = '23514';
  end if;
  if new.processing_state <> 'pending'
     or new.matched_payment_id is not null
     or new.processed_at is not null then
    raise exception 'New financial events must enter as pending'
      using errcode = '23514';
  end if;
  return new;
end;
$guard_inbox_lifecycle$;

drop trigger if exists client_payment_event_inbox_insert_guard
  on public.client_payment_event_inbox;
create trigger client_payment_event_inbox_insert_guard
before insert on public.client_payment_event_inbox
for each row execute function public.guard_client_payment_event_inbox_lifecycle();

drop trigger if exists client_payment_event_inbox_delete_guard
  on public.client_payment_event_inbox;
create trigger client_payment_event_inbox_delete_guard
before delete on public.client_payment_event_inbox
for each row execute function public.guard_client_payment_event_inbox_lifecycle();

alter table public.client_payment_event_inbox enable row level security;
revoke all on public.client_payment_event_inbox from public, anon, authenticated;
-- Service-role only; no browser-facing RLS policies.
-- Event uniqueness prevents retries from overwriting reconciliation state.
