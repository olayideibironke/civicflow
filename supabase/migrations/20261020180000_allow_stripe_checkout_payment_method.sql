-- Allow the Stripe Checkout method already used by process_stripe_checkout_webhook.
-- Preserve every previously accepted method. This migration changes no payment rows.
ALTER TABLE public.billing_payments
  DROP CONSTRAINT billing_payments_payment_method_check;

ALTER TABLE public.billing_payments
  ADD CONSTRAINT billing_payments_payment_method_check
  CHECK (payment_method IN (
    'manual', 'card', 'ach', 'check', 'cash', 'other', 'stripe_checkout'
  ));
