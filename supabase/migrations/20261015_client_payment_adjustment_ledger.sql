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
-- No browser-facing RLS policies. Ledger posting must use a separately reviewed
-- atomic, idempotent database transaction with verified tenant/payment ownership.
