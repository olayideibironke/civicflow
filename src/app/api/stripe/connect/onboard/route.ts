import { NextResponse } from "next/server";

const stripeApi = "https://api.stripe.com/v1";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function stripeRequest(path: string, key: string, method = "GET", body?: URLSearchParams) {
  const response = await fetch(stripeApi + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body?.toString(),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

export async function POST(request: Request) {
  const origin = process.env.CIVICFLOW_PUBLIC_ORIGIN;
  if (!origin || new URL(request.url).origin !== origin || request.headers.get("origin") !== origin)
    return failure("Invalid origin.", 403);
  if (process.env.VERCEL_ENV !== "production" || process.env.CIVICFLOW_LIVE_INVOICES_ENABLED !== "true")
    return failure("Live Stripe Connect onboarding is disabled.", 503);

  const key = process.env.STRIPE_SECRET_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.startsWith("sk_live_") || !supabaseUrl || !anonKey || !serviceKey)
    return failure("Payment onboarding is not configured.", 503);

  const bearer = request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ")) return failure("Authentication required.", 401);
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: bearer }, cache: "no-store",
  });
  const user = await userResponse.json().catch(() => null);
  if (!userResponse.ok || !user?.id) return failure("Authentication required.", 401);

  const adminHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=organization_id,role&id=eq.${encodeURIComponent(user.id)}&limit=1`,
    { headers: adminHeaders, cache: "no-store" }
  );
  const profiles = await profileResponse.json().catch(() => []);
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (!profileResponse.ok || !profile?.organization_id || profile.role !== "admin")
    return failure("Firm administrator access required.", 403);

  const orgId: string = profile.organization_id;
  const query = `${supabaseUrl}/rest/v1/organization_payment_connections?select=stripe_account_id,mode&organization_id=eq.${encodeURIComponent(orgId)}&limit=1`;
  const existingResponse = await fetch(query, { headers: adminHeaders, cache: "no-store" });
  const existing = await existingResponse.json().catch(() => []);
  if (!existingResponse.ok || !Array.isArray(existing)) return failure("Connection lookup failed.", 503);
  if (existing[0]?.mode && existing[0].mode !== "live")
    return failure("Firm already has a sandbox connection. Migration requires administrator review.", 409);

  let accountId: string = existing[0]?.stripe_account_id ?? "";
  if (!accountId) {
    // Never accept a connected account ID from a browser. Create it on the platform.
    const body = new URLSearchParams({
      type: "express",
      country: "US",
      "capabilities[card_payments][requested]": "true",
      "capabilities[transfers][requested]": "true",
      "metadata[civicflow_organization_id]": orgId,
    });
    const created = await stripeRequest("/accounts", key, "POST", body);
    if (!created.response.ok || !created.data?.id || created.data?.livemode !== true)
      return failure("Stripe could not create a verified firm onboarding account.", 502);
    accountId = created.data.id;
    const inserted = await fetch(`${supabaseUrl}/rest/v1/organization_payment_connections`, {
      method: "POST",
      headers: { ...adminHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        organization_id: orgId, provider: "stripe", mode: "live",
        stripe_account_id: accountId, status: "restricted", operating_payments_enabled: false,
      }),
      cache: "no-store",
    });
    if (!inserted.ok) return failure("Could not register firm Stripe account. Contact support.", 409);
  }

  const account = await stripeRequest(`/accounts/${encodeURIComponent(accountId)}`, key);
  if (!account.response.ok || account.data?.livemode !== true ||
      account.data?.metadata?.civicflow_organization_id !== orgId)
    return failure("Stripe account ownership verification failed.", 403);

  const eligible = account.data.charges_enabled === true &&
    account.data.payouts_enabled === true &&
    account.data.capabilities?.card_payments === "active";
  const updated = await fetch(
    `${supabaseUrl}/rest/v1/organization_payment_connections?organization_id=eq.${encodeURIComponent(orgId)}&stripe_account_id=eq.${encodeURIComponent(accountId)}`,
    {
      method: "PATCH",
      headers: { ...adminHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        status: eligible ? "active" : "restricted",
        operating_payments_enabled: eligible,
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    }
  );
  if (!updated.ok) return failure("Could not update Stripe account eligibility.", 503);
  if (eligible) return NextResponse.json({ ready: true });

  const link = await stripeRequest("/account_links", key, "POST", new URLSearchParams({
    account: accountId,
    refresh_url: `${origin}/app/settings`,
    return_url: `${origin}/app/settings`,
    type: "account_onboarding",
  }));
  if (!link.response.ok || !link.data?.url) return failure("Stripe onboarding link unavailable.", 502);
  return NextResponse.json({ ready: false, url: link.data.url });
}
