-- DRAFT ONLY. Do not apply to production before auditing existing records.
-- A Stripe PaymentIntent must not identify two succeeded payments in one tenant.
-- Historical duplicates must be investigated, not silently deleted.
--
-- Preflight: this query MUST return zero rows before applying the index:
-- select organization_id, processor_reference, count(*) as duplicate_count
-- from public.billing_payments
-- where processor = 'stripe' and status = 'succeeded'
--   and processor_reference is not null
-- group by organization_id, processor_reference
-- having count(*) > 1;
--
-- This intentionally excludes pending/failed payments and non-Stripe records.
-- The index is scoped by tenant because connected accounts can have distinct
-- PaymentIntent namespaces. No automatic cleanup or payment mutation occurs.
create unique index if not exists
  billing_payments_unique_succeeded_stripe_intent_per_org
on public.billing_payments (organization_id, processor_reference)
where processor = 'stripe'
  and status = 'succeeded'
  and processor_reference is not null;
