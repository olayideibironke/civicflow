-- Draft only. Do not apply until the client invite, Stripe Connect and
-- verified subscription webhook flows are implemented and tested.
-- Firm staff manage terms; clients can only view plans for cases to which
-- they have been explicitly linked. All mutations are server-authorized.
create table if not exists public.client_payment_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  case_id uuid not null references public.cases(id),
  client_user_id uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  installment_amount_cents bigint not null check (installment_amount_cents > 0),
  interval_unit text not null check (interval_unit in ('week', 'month')),
  interval_count integer not null default 1 check (interval_count between 1 and 12),
  installment_limit integer check (installment_limit between 1 and 120),
  status text not null default 'draft' check (status in (
    'draft', 'awaiting_client_consent', 'active', 'past_due',
    'paused', 'completed', 'cancelled', 'archived'
  )),
  stripe_connected_account_id text,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  client_consented_at timestamptz,
  activated_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_plan_requires_consent check (
    status not in ('active','past_due','paused','completed') or
    (client_consented_at is not null and stripe_subscription_id is not null
      and stripe_connected_account_id is not null)
  ),
  constraint archived_plan_timestamp check (
    status <> 'archived' or archived_at is not null
  )
);
create index if not exists client_payment_plans_firm_idx
  on public.client_payment_plans(organization_id, case_id, created_at desc);
create index if not exists client_payment_plans_client_idx
  on public.client_payment_plans(client_user_id, created_at desc);

create table if not exists public.client_payment_plan_events (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.client_payment_plans(id),
  organization_id uuid not null references public.organizations(id),
  actor_user_id uuid references auth.users(id),
  action text not null,
  previous_status text,
  new_status text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists client_payment_plan_events_plan_idx
  on public.client_payment_plan_events(plan_id, created_at desc);

alter table public.client_payment_plans enable row level security;
alter table public.client_payment_plan_events enable row level security;
revoke all on public.client_payment_plans from public, anon, authenticated;
revoke all on public.client_payment_plan_events from public, anon, authenticated;
-- No direct writes for browser roles. Future RPCs must enforce:
--   * admin/attorney role AND organization/case membership for edits
--   * explicit client consent before any Stripe subscription activation
--   * Stripe-side cancellation confirmed before local cancelled status
--   * immutable audit event on every plan change
--   * no deletion; archive is a soft state transition
--   * read-only client access only after verified client-case membership
