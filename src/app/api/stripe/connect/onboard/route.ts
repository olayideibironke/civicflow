import { NextResponse } from "next/server";

const stripeApi = "https://api.stripe.com/v1";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function stripeRequest(path: string, key: string, method = "GET", body?: URLSearchParams, idempotencyKey?: string) {
  const response = await fetch(stripeApi + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body?.toString(),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

export async function POST(request: Request) {
  // Only CivicFlow's configured production apex and www domains may start
  // Stripe onboarding. Preserve the canonical origin for Stripe return URLs.
  const origin = process.env.CIVICFLOW_PUBLIC_ORIGIN;
  if (!origin) return failure("Payment origin unavailable.", 503);
  let trustedOrigins: Set<string>;
  try {
    const canonical = new URL(origin);
    if (canonical.protocol !== "https:") return failure("Payment origin unavailable.", 503);
    const apexHost = canonical.hostname.startsWith("www.") ? canonical.hostname.slice(4) : canonical.hostname;
    trustedOrigins = new Set([
      canonical.origin,
      `${canonical.protocol}//${apexHost}${canonical.port ? ":" + canonical.port : ""}`,
      `${canonical.protocol}//www.${apexHost}${canonical.port ? ":" + canonical.port : ""}`,
    ]);
  } catch {
    return failure("Payment origin unavailable.", 503);
  }
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin || !trustedOrigins.has(requestOrigin) ||
      !trustedOrigins.has(new URL(request.url).origin))
    return failure("Invalid origin.", 403);
  if (process.env.VERCEL_ENV !== "production")
    return failure("Live Stripe Connect onboarding is unavailable outside production.", 503);

  const key = process.env.STRIPE_SECRET_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Report only the missing configuration *name*, never secret values.
  // This helps administrators resolve deployment drift without weakening the gate.
  if (!key || !/^(sk|rk)_live_/.test(key))
    return failure("Payment onboarding is not configured (Stripe live credential).", 503);
  if (!supabaseUrl)
    return failure("Payment onboarding is not configured (Supabase URL).", 503);
  if (!anonKey)
    return failure("Payment onboarding is not configured (Supabase public key).", 503);
  if (!serviceKey)
    return failure("Payment onboarding is not configured (Supabase server credential).", 503);

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
  const query = `${supabaseUrl}/rest/v1/organization_payment_connections?select=stripe_account_id,mode&organization_id=eq.${encodeURIComponent(orgId)}&mode=eq.live&limit=1`;
  const existingResponse = await fetch(query, { headers: adminHeaders, cache: "no-store" });
  const existing = await existingResponse.json().catch(() => []);
  if (!existingResponse.ok || !Array.isArray(existing)) return failure("Connection lookup failed.", 503);

  let accountId: string = existing[0]?.stripe_account_id ?? "";
  if (!accountId) {
    // Reconcile an account already created by this platform before attempting creation.
    // This avoids duplicates when an earlier successful Stripe response was not saved.
    const listed = await stripeRequest("/accounts?limit=100", key);
    if (!listed.response.ok || !Array.isArray(listed.data?.data) || listed.data?.has_more)
      return failure("Unable to safely reconcile existing Stripe accounts.", 503);
    const matches = listed.data.data.filter((item: any) =>
      item?.type === "standard" &&
      item?.metadata?.civicflow_organization_id === orgId &&
      typeof item.id === "string" && /^acct_[A-Za-z0-9]+$/.test(item.id)
    );
    if (matches.length > 1)
      return failure("Multiple Stripe accounts match this firm. Contact support.", 409);
    if (matches.length === 1) {
      const candidate = matches[0].id as string;
      const verified = await stripeRequest(`/accounts/${encodeURIComponent(candidate)}`, key);
      if (!verified.response.ok || verified.data?.livemode !== true ||
          verified.data?.type !== "standard" ||
          verified.data?.metadata?.civicflow_organization_id !== orgId)
        return failure("Existing Stripe account verification failed.", 503);
      const registered = await fetch(`${supabaseUrl}/rest/v1/organization_payment_connections`, {
        method: "POST",
        headers: { ...adminHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({
          organization_id: orgId, provider: "stripe", mode: "live",
          stripe_account_id: candidate, status: "restricted",
          operating_payments_enabled: false,
        }),
        cache: "no-store",
      });
      if (!registered.ok) return failure("Could not register existing Stripe account.", 409);
      accountId = candidate;
    }
  }
  if (!accountId) {
    // Never accept a connected account ID from a browser. Create it on the platform.
    // Standard accounts align with Stripe-managed risk and Stripe Dashboard access.
    const body = new URLSearchParams({
      type: "standard",
      country: "US",
      "capabilities[card_payments][requested]": "true",
      "capabilities[transfers][requested]": "true",
      "metadata[civicflow_organization_id]": orgId,
    });
    const created = await stripeRequest("/accounts", key, "POST", body, `civicflow-live-standard-${orgId}-v1`);
    if (!created.response.ok || typeof created.data?.id !== "string" || !/^acct_[A-Za-z0-9]+$/.test(created.data.id)) {
      const stripeCode = typeof created.data?.error?.code === "string" ? created.data.error.code : "";
      const stripeParam = typeof created.data?.error?.param === "string" ? created.data.error.param.replace(/[^a-z0-9_\[\].]/gi, "").slice(0, 80) : "";
      const stripeMessage = typeof created.data?.error?.message === "string" ? created.data.error.message.replace(/[\r\n]/g, " ").slice(0, 180) : "";
      const stripeType = typeof created.data?.error?.type === "string" ? created.data.error.type : "";
      const permissionFailure = created.response.status === 403 ||
        stripeCode === "permission_error" || stripeType === "permission_error";
      const authFailure = created.response.status === 401;
      return failure(
        permissionFailure
          ? "Stripe rejected account creation: restricted key lacks Connect account creation permission."
          : authFailure
            ? "Stripe rejected the configured live API credential."
            : `Stripe account creation failed (HTTP ${created.response.status}${stripeCode ? ", code " + stripeCode.replace(/[^a-z0-9_]/gi, "").slice(0, 48) : ""}${stripeParam ? ", parameter " + stripeParam : ""}${stripeMessage ? ": " + stripeMessage : ""}).`,
        502
      );
    }
    // Stripe can return HTTP 200 without a livemode field in the creation payload.
    // Retrieve the account and verify its live mode and organization ownership before saving.
    const verifiedCreation = await stripeRequest(`/accounts/${encodeURIComponent(created.data.id)}`, key);
    if (!verifiedCreation.response.ok || verifiedCreation.data?.livemode !== true ||
        verifiedCreation.data?.metadata?.civicflow_organization_id !== orgId)
      return failure("Stripe created an account but live ownership verification is incomplete. No database connection was registered.", 502);
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
    `${supabaseUrl}/rest/v1/organization_payment_connections?organization_id=eq.${encodeURIComponent(orgId)}&mode=eq.live&stripe_account_id=eq.${encodeURIComponent(accountId)}`,
    {
      method: "PATCH",
      headers: { ...adminHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        status: eligible ? "active" : "restricted",
        operating_payments_enabled: false, // Live invoice activation is a separate controlled release.
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
