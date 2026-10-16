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

alter table public.client_payment_event_inbox enable row level security;
revoke all on public.client_payment_event_inbox from public, anon, authenticated;
-- Service-role only; no browser-facing RLS policies.
-- Event uniqueness prevents retries from overwriting reconciliation state.
