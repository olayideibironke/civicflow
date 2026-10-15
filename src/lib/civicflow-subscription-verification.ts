import "server-only";

// Server-only Stripe subscription verification. Never trust checkout metadata for entitlements.
export type VerifiedSubscription = {
  subscriptionId: string;
  customerId: string;
  plan: "basic" | "pro" | "advanced";
  priceId: string;
  seats: number;
  status: "active" | "trialing" | "past_due" | "unpaid" | "canceled" | "incomplete" | "incomplete_expired" | "paused";
  livemode: boolean;
};

type StripeSubscription = {
  id?: string;
  customer?: string | { id?: string };
  status?: string;
  livemode?: boolean;
  items?: { data?: Array<{ price?: { id?: string; recurring?: { usage_type?: string } }; quantity?: number }> };
};

export async function verifyPlatformSubscription(subscriptionId: string): Promise<VerifiedSubscription> {
  if (!/^sub_[A-Za-z0-9]+$/.test(subscriptionId)) throw new Error("Invalid subscription identifier");
  const secret = process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_MODE === "live" ? (process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY) : process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_SECRET_KEY;
  const mode = process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_MODE;
  if (!secret || (mode !== "test" && mode !== "live") ||
      !secret.startsWith(mode === "live" ? "sk_live_" : "sk_test_")) {
    throw new Error("Platform Stripe verification is not configured");
  }
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Stripe subscription lookup failed");
  const data = await response.json() as StripeSubscription;
  const customerId = typeof data.customer === "string" ? data.customer : data.customer?.id;
  const items = data.items?.data;
  if (data.id !== subscriptionId || !customerId || !/^cus_[A-Za-z0-9]+$/.test(customerId) ||
      data.livemode !== (mode === "live") || !items || items.length !== 1) {
    throw new Error("Stripe subscription identity or mode mismatch");
  }
  const item = items[0];
  const seats = item.quantity;
  const priceId = item.price?.id;
  const plans = {
    basic: process.env.CIVICFLOW_STRIPE_PRICE_BASIC,
    pro: process.env.CIVICFLOW_STRIPE_PRICE_PRO,
    advanced: process.env.CIVICFLOW_STRIPE_PRICE_ADVANCED,
  } as const;
  const match = (Object.keys(plans) as Array<keyof typeof plans>).find(p => plans[p] && plans[p] === priceId);
  const allowed = ["active", "trialing", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "paused"];
  if (!match || !priceId || !Number.isSafeInteger(seats) || !seats || seats < 1 || seats > 250 ||
      !allowed.includes(data.status || "") || item.price?.recurring?.usage_type !== "licensed") {
    throw new Error("Stripe subscription price, quantity or status is invalid");
  }
  return {
    subscriptionId, customerId, plan: match, priceId, seats,
    status: data.status as VerifiedSubscription["status"], livemode: data.livemode,
  };
}
