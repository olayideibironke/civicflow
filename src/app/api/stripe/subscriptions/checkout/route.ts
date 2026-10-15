import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PRICES = {
  basic: process.env.CIVICFLOW_STRIPE_PRICE_BASIC,
  pro: process.env.CIVICFLOW_STRIPE_PRICE_PRO,
  advanced: process.env.CIVICFLOW_STRIPE_PRICE_ADVANCED,
} as const;
const STRIPE_URL = "https://api.stripe.com/v1/checkout/sessions";
type Plan = keyof typeof PRICES;

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  // Disabled until the platform subscription webhook and entitlement ledger are deployed.
  if (process.env.CIVICFLOW_SUBSCRIPTIONS_ENABLED !== "true") {
    return error("Subscription checkout is not yet available.", 503);
  }
  const configuredOrigin = process.env.CIVICFLOW_PUBLIC_ORIGIN;
  let origin: string;
  try {
    const parsedOrigin = new URL(configuredOrigin ?? "");
    if (parsedOrigin.protocol !== "https:" || parsedOrigin.username || parsedOrigin.password ||
        parsedOrigin.pathname !== "/" || parsedOrigin.search || parsedOrigin.hash) {
      return error("Public origin is not configured correctly.", 503);
    }
    origin = parsedOrigin.origin;
  } catch {
    return error("Public origin is not configured correctly.", 503);
  }
  const originHeader = request.headers.get("origin");
  if (!originHeader || originHeader !== origin) {
    return error("Cross-origin subscription checkout is not allowed.", 403);
  }
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !dbUrl || !dbKey) return error("Administrator sign-in required.", 401);
  const db = createClient(dbUrl, dbKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity, error: identityError } = await db.auth.getUser(token);
  if (identityError || !identity.user) return error("Invalid session.", 401);
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("organization_id,role").eq("id", identity.user.id).single();
  if (profileError || profile?.role !== "admin" || !profile.organization_id)
    return error("Firm administrator access required.", 403);
  const { data: firm, error: firmError } = await db.from("organizations")
    .select("id,name").eq("id", profile.organization_id).single();
  if (firmError || !firm) return error("Firm not found.", 403);
  // Do not initiate a second paid subscription for an already active firm.
  const { data: entitlement, error: entitlementError } = await db.rpc(
    "get_civicflow_subscription_entitlement", { p_organization_id: firm.id },
  );
  if (entitlementError) return error("Subscription status could not be verified.", 503);
  // Fail closed for any existing subscription record, including unpaid or
  // unverified records. A new purchase requires an explicit recovery/change flow.
  if (entitlement?.active === true || typeof entitlement?.status === "string") {
    return error("This firm already has a subscription record. Contact support before purchasing again.", 409);
  }
  const body = await request.json().catch(() => null) as {
    plan?: unknown; seats?: unknown; email?: unknown; firmName?: unknown
  } | null;
  const plan = typeof body?.plan === "string" ? body.plan.toLowerCase() : "";
  if (!(plan in PRICES)) return error("Select a valid plan.", 400);
  const seats = body?.seats;
  if (!Number.isSafeInteger(seats) || (seats as number) < 1 || (seats as number) > 250) {
    return error("Seats must be a whole number between 1 and 250.", 400);
  }
  const email = identity.user.email || "";
  const firmName = firm.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return error("A valid work email is required.", 400);
  }
  if (!firmName || firmName.length > 160) return error("A valid firm name is required.", 400);
  const price = PRICES[plan as Plan];
  if (!price || !/^price_[a-zA-Z0-9]+$/.test(price)) {
    return error("Subscription pricing is not configured.", 503);
  }
  // Subscription charges always use the CivicFlow platform account, never a firm's Connect account.
  const secret = process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_MODE === "live"
    ? (process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY)
    : process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_SECRET_KEY;
  if (!secret || !/^sk_(test|live)_/.test(secret)) {
    return error("Subscription payments are not configured.", 503);
  }
  // Explicit mode prevents accidental live billing in a preview or sandbox rollout.
  const mode = process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_MODE;
  if (mode !== "test" && mode !== "live") {
    return error("Subscription payment mode is not configured.", 503);
  }
  if (!secret.startsWith(mode === "live" ? "sk_live_" : "sk_test_")) {
    return error("Stripe credential does not match the configured payment mode.", 503);
  }
  if (mode === "live" && process.env.NODE_ENV !== "production") {
    return error("Live subscription checkout is restricted to production.", 503);
  }
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  // Organization identity is taken from the authenticated firm admin profile.
  params.set("client_reference_id", firm.id);
  params.set("line_items[0][price]", price);
  params.set("line_items[0][quantity]", String(seats));
  params.set("customer_email", email);
  params.set("success_url", `${origin}/app/settings?subscription=processing&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/app/settings?subscription=cancelled`);
  params.set("subscription_data[metadata][plan]", plan);
  params.set("subscription_data[metadata][firm_name]", firmName);
  params.set("subscription_data[metadata][seats]", String(seats));
  params.set("metadata[plan]", plan);
  params.set("metadata[firm_name]", firmName);
  params.set("metadata[seats]", String(seats));
  const stripe = await fetch(STRIPE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  }).catch(() => null);
  if (!stripe) return error("Stripe is temporarily unavailable.", 502);
  const session = await stripe.json().catch(() => null) as { id?: string; url?: string; livemode?: boolean } | null;
  if (!stripe.ok || !session?.id || !session.url ||
      session.livemode !== (mode === "live") ||
      !session.id.startsWith(mode === "live" ? "cs_live_" : "cs_test_") ||
      (() => { try { const destination = new URL(session.url); return destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com"; } catch { return true; } })()) {
    return error("Could not create a subscription checkout.", 502);
  }
  return NextResponse.json({ url: session.url, sessionId: session.id });
}
