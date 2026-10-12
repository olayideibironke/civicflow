import "server-only";
import { verifyPlatformSubscription } from "./civicflow-subscription-verification";

// Only call this from a trusted, authenticated organization-owner onboarding workflow.
// Do not expose as a public API or infer organization ownership from email/metadata.
export async function reconcileVerifiedFirmSubscription(input: {
  organizationId: string;
  checkoutSessionId: string;
  subscriptionId: string;
}): Promise<void> {
  const { organizationId, checkoutSessionId, subscriptionId } = input;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId) ||
      !/^cs_(test_|live_)[A-Za-z0-9]+$/.test(checkoutSessionId)) {
    throw new Error("Invalid onboarding reference");
  }
  const secret = process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_SECRET_KEY;
  const mode = process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_MODE;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !supabaseUrl || !serviceKey || (mode !== "test" && mode !== "live") ||
      !secret.startsWith(mode === "live" ? "sk_live_" : "sk_test_")) {
    throw new Error("Subscription reconciliation is not configured");
  }
  const [verified, checkoutResponse] = await Promise.all([
    verifyPlatformSubscription(subscriptionId),
    fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(checkoutSessionId)}`, {
      headers: { Authorization: `Bearer ${secret}` }, cache: "no-store",
    }),
  ]);
  if (!checkoutResponse.ok) throw new Error("Stripe checkout lookup failed");
  const checkout = await checkoutResponse.json() as {
    id?: string; mode?: string; status?: string; payment_status?: string;
    subscription?: string; customer?: string; livemode?: boolean;
    client_reference_id?: string;
  };
  if (checkout.id !== checkoutSessionId || checkout.mode !== "subscription" ||
      checkout.status !== "complete" || checkout.subscription !== verified.subscriptionId ||
      checkout.customer !== verified.customerId || checkout.livemode !== verified.livemode ||
      !checkout.client_reference_id) {
    throw new Error("Stripe checkout does not match the verified subscription");
  }
  if (verified.status !== "active" && verified.status !== "trialing") {
    throw new Error("Subscription is not active");
  }
  if (verified.status === "active" && checkout.payment_status !== "paid") {
    throw new Error("Checkout payment is not confirmed");
  }
  const result = await fetch(`${supabaseUrl}/rest/v1/rpc/reconcile_civicflow_subscription`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_subscription_id: verified.subscriptionId,
      p_customer_id: verified.customerId,
      p_organization_id: organizationId,
      p_plan: verified.plan,
      p_price_id: verified.priceId,
      p_seats: verified.seats,
      p_status: verified.status,
      p_livemode: verified.livemode,
    }),
    cache: "no-store",
  });
  if (!result.ok) throw new Error("Trusted subscription reconciliation failed");
}
