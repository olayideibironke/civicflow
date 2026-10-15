-- Draft migration. Not applied to any database.
-- Verified Stripe Connect event inbox. This table deliberately does not
-- require an invoice mapping: Stripe may deliver a signed dispute/refund
-- before its related payment has been reconciled locally.
-- A server worker must verify the webhook signature with the dedicated
-- Connect endpoint secret BEFORE inserting a row, verify event.account
-- against organization_payment_connections, and use Stripe to enrich
-- charge/refund events that lack a payment_intent.
create table if not exists public.client_payment_event_inbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  connected_account_id text not null check (connected_account_id ~ '^acct_[A-Za-z0-9]+$'),
  stripe_event_id text not null check (stripe_event_id ~ '^evt_[A-Za-z0-9]+$'),
  stripe_object_id text not null,
  stripe_payment_intent_id text,
  amount_cents bigint check (amount_cents >= 0),
  currency text check (currency is null or currency ~ '^\x5ba-z\x5d{3}  event_type text not null check (event_type in (
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
-- Service-role-only inbox. No browser-facing policies or RPCs.
-- Processing must be idempotent by (connected_account_id, stripe_event_id).
-- An unknown event must be held for review, never acknowledged as applied
-- to a customer invoice. Do not store raw webhook payloads or client PII.
),
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
-- Service-role-only inbox. No browser-facing policies or RPCs.
-- Processing must be idempotent by (connected_account_id, stripe_event_id).
-- An unknown event must be held for review, never acknowledged as applied
-- to a customer invoice. Do not store raw webhook payloads or client PII.
