-- Stripe Connect financial-event ledger (NOT applied automatically).
-- Events are recorded separately from payments to preserve the original accounting trail.
-- Only the server's service role may read/write; clients and firm users receive no direct table access.
-- Webhook signature, connected-account ownership, event replay, and money reconciliation
-- MUST be verified by the ingestion service before writing here.
create table if not exists public.client_payment_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  invoice_id uuid not null references public.billing_invoices(id),
  payment_id uuid references public.billing_payments(id),
  connected_account_id text not null check (connected_account_id ~ '^acct_[A-Za-z0-9]+
  stripe_event_id text not null check (stripe_event_id ~ '^evt_[A-Za-z0-9]+
  stripe_object_id text not null,
  stripe_payment_intent_id text,
  event_type text not null check (event_type in (
    'refund.created', 'refund.updated',
    'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed',
    'payment_intent.payment_failed', 'payment_intent.canceled'
  )),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  status text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  livemode boolean not null,
  unique (connected_account_id, stripe_event_id)
);
create index if not exists client_payment_adjustments_invoice_idx
  on public.client_payment_adjustments (organization_id, invoice_id, occurred_at desc);
create index if not exists client_payment_adjustments_intent_idx
  on public.client_payment_adjustments (connected_account_id, stripe_payment_intent_id);

alter table public.client_payment_adjustments enable row level security;
revoke all on public.client_payment_adjustments from public, anon, authenticated;
-- No user-facing policies: reads go through separately audited, authorization-scoped RPCs.
-- Do not add direct INSERT/UPDATE/DELETE policies for clients or attorneys.
),
  stripe_event_id text not null,
  stripe_object_id text not null,
  stripe_payment_intent_id text,
  event_type text not null check (event_type in (
    'refund.created', 'refund.updated',
    'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed',
    'payment_intent.payment_failed', 'payment_intent.canceled'
  )),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  status text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  unique (connected_account_id, stripe_event_id, stripe_object_id, event_type)
);
create index if not exists client_payment_adjustments_invoice_idx
  on public.client_payment_adjustments (organization_id, invoice_id, occurred_at desc);
create index if not exists client_payment_adjustments_intent_idx
  on public.client_payment_adjustments (connected_account_id, stripe_payment_intent_id);

alter table public.client_payment_adjustments enable row level security;
revoke all on public.client_payment_adjustments from public, anon, authenticated;
-- No user-facing policies: reads go through separately audited, authorization-scoped RPCs.
-- Do not add direct INSERT/UPDATE/DELETE policies for clients or attorneys.
),
  stripe_object_id text not null,
  stripe_payment_intent_id text,
  event_type text not null check (event_type in (
    'refund.created', 'refund.updated',
    'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed',
    'payment_intent.payment_failed', 'payment_intent.canceled'
  )),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  status text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  unique (connected_account_id, stripe_event_id, stripe_object_id, event_type)
);
create index if not exists client_payment_adjustments_invoice_idx
  on public.client_payment_adjustments (organization_id, invoice_id, occurred_at desc);
create index if not exists client_payment_adjustments_intent_idx
  on public.client_payment_adjustments (connected_account_id, stripe_payment_intent_id);

alter table public.client_payment_adjustments enable row level security;
revoke all on public.client_payment_adjustments from public, anon, authenticated;
-- No user-facing policies: reads go through separately audited, authorization-scoped RPCs.
-- Do not add direct INSERT/UPDATE/DELETE policies for clients or attorneys.
),
  stripe_event_id text not null,
  stripe_object_id text not null,
  stripe_payment_intent_id text,
  event_type text not null check (event_type in (
    'refund.created', 'refund.updated',
    'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed',
    'payment_intent.payment_failed', 'payment_intent.canceled'
  )),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  status text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  unique (connected_account_id, stripe_event_id, stripe_object_id, event_type)
);
create index if not exists client_payment_adjustments_invoice_idx
  on public.client_payment_adjustments (organization_id, invoice_id, occurred_at desc);
create index if not exists client_payment_adjustments_intent_idx
  on public.client_payment_adjustments (connected_account_id, stripe_payment_intent_id);

alter table public.client_payment_adjustments enable row level security;
revoke all on public.client_payment_adjustments from public, anon, authenticated;
-- No user-facing policies: reads go through separately audited, authorization-scoped RPCs.
-- Do not add direct INSERT/UPDATE/DELETE policies for clients or attorneys.
