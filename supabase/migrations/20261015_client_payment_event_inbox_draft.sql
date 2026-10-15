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
    'pending', 'needs_enrichment', 'needs_payment_match', 'processed', 'rejected'
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

alter table public.client_payment_event_inbox enable row level security;
revoke all on public.client_payment_event_inbox from public, anon, authenticated;
-- Service-role only; no browser-facing RLS policies.
-- Event uniqueness prevents retries from overwriting reconciliation state.
