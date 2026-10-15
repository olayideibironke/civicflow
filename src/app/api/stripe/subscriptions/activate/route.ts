import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { reconcileVerifiedFirmSubscription } from "@/lib/civicflow-subscription-reconciliation";

export async function POST(request: Request) {
  if (process.env.CIVICFLOW_SUBSCRIPTIONS_ENABLED !== "true") {
    return NextResponse.json({ error: "Subscription activation is unavailable." }, { status: 503 });
  }
  const publicOrigin = process.env.CIVICFLOW_PUBLIC_ORIGIN;
  if (!publicOrigin || request.headers.get("origin") !== new URL(publicOrigin).origin) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity } = await db.auth.getUser(token);
  if (!identity.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const { data: profile } = await db.from("profiles").select("organization_id,role")
    .eq("id", identity.user.id).single();
  if (!profile || profile.role !== "admin" || !profile.organization_id)
    return NextResponse.json({ error: "Firm administrator required." }, { status: 403 });
  const body = await request.json().catch(() => null) as { sessionId?: unknown } | null;
  const sessionId = body?.sessionId;
  if (typeof sessionId !== "string" || !/^cs_(test_|live_)[A-Za-z0-9]+$/.test(sessionId))
    return NextResponse.json({ error: "Invalid Checkout session." }, { status: 400 });
  const secret = process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_MODE === "live"
    ? (process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY)
    : process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_SECRET_KEY;
  const mode = process.env.CIVICFLOW_STRIPE_SUBSCRIPTION_MODE;
  if (!secret || (mode !== "test" && mode !== "live") ||
      !secret.startsWith(mode === "live" ? "sk_live_" : "sk_test_"))
    return NextResponse.json({ error: "Stripe verification unavailable." }, { status: 503 });
  try {
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" },
    );
    if (!stripeResponse.ok) throw new Error("Checkout lookup failed");
    const checkout = await stripeResponse.json() as { subscription?: string; client_reference_id?: string };
    if (checkout.client_reference_id !== profile.organization_id ||
        !checkout.subscription || !/^sub_[A-Za-z0-9]+$/.test(checkout.subscription))
      throw new Error("Checkout does not belong to this firm");
    await reconcileVerifiedFirmSubscription({
      organizationId: profile.organization_id,
      checkoutSessionId: sessionId,
      subscriptionId: checkout.subscription,
    });
    return NextResponse.json({ activated: true });
  } catch {
    return NextResponse.json({ error: "Payment verification is pending. Retry shortly." }, { status: 409 });
  }
}
