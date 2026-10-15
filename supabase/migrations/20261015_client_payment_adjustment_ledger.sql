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
  connected_account_id text not null,
  stripe_event_id text not null,
  stripe_object_id text not null,
  stripe_payment_intent_id text,
  event_type text not null check (event_type in (
    'refund_created', 'refund_updated', 'refund_failed',
    'dispute_created', 'dispute_updated', 'dispute_closed',
    'payment_failed', 'payment_canceled'
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
