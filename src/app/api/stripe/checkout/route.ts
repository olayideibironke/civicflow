import { NextResponse } from "next/server";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_CONNECTOR_SANDBOX = "stripe/civicflow-stripe-sandbox";
const STRIPE_CONNECTOR_LIVE = process.env.CIVICFLOW_STRIPE_LIVE_CONNECTOR;

type CheckoutContext = {
  invoice_id: string;
  organization_id: string;
  case_id: string;
  invoice_number: string;
  balance_cents: number;
  currency: string;
  connected_account_id: string;
  connection_mode: "sandbox" | "live";
  customer_email: string;
};

type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  error?: { message?: string };
};

type ConnectTokenResponse = {
  token?: string;
  error?: { message?: string };
};

function responseError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getStripeCredential(request: Request, mode: "sandbox" | "live") {
  const connector = mode === "live" ? STRIPE_CONNECTOR_LIVE : STRIPE_CONNECTOR_SANDBOX;
  if (!connector || !/^stripe\/[a-z0-9-]+$/.test(connector)) {
    return { token: "", error: "Stripe connector is not configured for this payment mode." };
  }
  const oidc =
    request.headers.get("x-vercel-oidc-token") ??
    process.env.VERCEL_OIDC_TOKEN ??
    "";

  if (!oidc) {
    return {
      token: "",
      error:
        "Stripe Checkout could not obtain the Vercel deployment identity required for the CivicFlow Stripe connector.",
    };
  }

  const response = await fetch(
    `https://api.vercel.com/v1/connect/token/${encodeURIComponent(connector)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${oidc}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: { type: "app" },
        scopes: ["*"],
      }),
      cache: "no-store",
    }
  );

  const result = (await response.json().catch(() => null)) as ConnectTokenResponse | null;
  const token = result?.token ?? "";

  if (!response.ok || !token) {
    return {
      token: "",
      error:
        result?.error?.message ??
        "Vercel Connect could not issue the CivicFlow Stripe credential.",
    };
  }

  return { token, error: "" };
}

async function callSupabaseRpc<T>(
  name: string,
  body: Record<string, unknown>,
  authorization: string
): Promise<{ data: T | null; error: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { data: null, error: "CivicFlow payment services are not configured." };
  }

  const result = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!result.ok) {
    const detail = await result.text();
    return {
      data: null,
      error: detail || "CivicFlow could not validate this invoice.",
    };
  }

  // Supabase RPCs returning void succeed with an empty response body.
  // Parsing that body as JSON would throw after checkout registration succeeds.
  const responseText = await result.text();
  if (!responseText.trim()) {
    return { data: null, error: "" };
  }

  try {
    return { data: JSON.parse(responseText) as T, error: "" };
  } catch {
    return { data: null, error: "CivicFlow received an invalid payment service response." };
  }
}

async function expireStripeSession(
  token: string,
  connectedAccountId: string,
  sessionId: string
) {
  try {
    await fetch(
      `${STRIPE_API_BASE}/checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Stripe-Account": connectedAccountId,
        },
        cache: "no-store",
      }
    );
  } catch {
    // Never mask CivicFlow's session registration error.
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return responseError("Authentication required.", 401);
  }

  const payload = (await request.json().catch(() => null)) as
    | { invoiceId?: string }
    | null;

  if (!payload?.invoiceId) {
    return responseError("Invoice ID is required.", 400);
  }

  const contextResult = await callSupabaseRpc<CheckoutContext[]>(
    "get_client_invoice_checkout_context",
    { p_invoice_id: payload.invoiceId },
    authorization
  );

  const context = contextResult.data?.[0];
  if (!context || contextResult.error) {
    return responseError("This invoice is not available for Stripe Checkout.", 403);
  }

  if (context.connection_mode !== "sandbox" && context.connection_mode !== "live") {
    return responseError("Invalid payment mode.", 503);
  }
  if (context.connection_mode === "live" &&
      (process.env.VERCEL_ENV !== "production" || process.env.CIVICFLOW_LIVE_INVOICES_ENABLED !== "true")) {
    return responseError("Live invoice payments are not enabled.", 503);
  }

  if (context.balance_cents <= 0) {
    return responseError("This invoice has no remaining balance.", 409);
  }

  const credential = await getStripeCredential(request, context.connection_mode);
  if (!credential.token) {
    return responseError(credential.error, 503);
  }

  if (!credential.token.startsWith(context.connection_mode === "live" ? "sk_live_" : "sk_test_")) {
    return responseError("Stripe credential does not match the payment mode.", 503);
  }

  const origin = new URL(request.url).origin;
  const stripeBody = new URLSearchParams();

  stripeBody.set("mode", "payment");
  stripeBody.set(
    "success_url",
    `${origin}/client/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`
  );
  stripeBody.set("cancel_url", `${origin}/client/billing?payment=cancelled`);
  stripeBody.set("client_reference_id", context.invoice_id);
  stripeBody.set("submit_type", "pay");

  if (context.customer_email) {
    stripeBody.set("customer_email", context.customer_email);
  }

  stripeBody.set("line_items[0][price_data][currency]", context.currency);
  stripeBody.set(
    "line_items[0][price_data][product_data][name]",
    `CivicFlow invoice ${context.invoice_number}`
  );
  stripeBody.set(
    "line_items[0][price_data][product_data][description]",
    "Legal services invoice balance"
  );
  stripeBody.set(
    "line_items[0][price_data][unit_amount]",
    String(context.balance_cents)
  );
  stripeBody.set("line_items[0][quantity]", "1");

  const metadata = {
    invoice_id: context.invoice_id,
    organization_id: context.organization_id,
    case_id: context.case_id,
    invoice_number: context.invoice_number,
  };

  for (const [key, value] of Object.entries(metadata)) {
    stripeBody.set(`metadata[${key}]`, value);
    stripeBody.set(`payment_intent_data[metadata][${key}]`, value);
  }

  const stripeResponse = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credential.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Account": context.connected_account_id,
    },
    body: stripeBody.toString(),
    cache: "no-store",
  });

  const stripeSession = (await stripeResponse.json()) as StripeCheckoutSession;

  if (!stripeResponse.ok || !stripeSession.id || !stripeSession.url) {
    return responseError(
      stripeSession.error?.message || "Stripe Checkout could not be started.",
      502
    );
  }

  const registerResult = await callSupabaseRpc<null>(
    "register_stripe_checkout_session",
    {
      p_invoice_id: context.invoice_id,
      p_checkout_session_id: stripeSession.id,
      p_connected_account_id: context.connected_account_id,
      p_expected_amount_cents: context.balance_cents,
      p_currency: context.currency,
    },
    authorization
  );

  if (registerResult.error) {
    await expireStripeSession(
      credential.token,
      context.connected_account_id,
      stripeSession.id
    );
    return responseError(
      "CivicFlow could not register the Stripe Checkout session.",
      500
    );
  }

  return NextResponse.json({
    url: stripeSession.url,
    sessionId: stripeSession.id,
  });
}
