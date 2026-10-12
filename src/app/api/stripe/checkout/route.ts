import { NextResponse } from "next/server";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_CONNECTOR = "stripe/civicflow-stripe-sandbox";
const CIVICFLOW_STRIPE_SANDBOX_ACCOUNT_ID = "acct_1UPEdsFUVijXk0Be";

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

async function getStripeCredential(request: Request) {
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

  try {
    const response = await fetch(
      `https://api.vercel.com/v1/connect/token/${encodeURIComponent(STRIPE_CONNECTOR)}`,
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

    const raw = await response.text();
    let result: ConnectTokenResponse | null = null;
    try {
      result = raw ? (JSON.parse(raw) as ConnectTokenResponse) : null;
    } catch {
      return {
        token: "",
        error: `Vercel Connect returned an unreadable response (HTTP ${response.status}).`,
      };
    }

    const token = result?.token ?? "";

    if (!response.ok || !token) {
      return {
        token: "",
        error:
          result?.error?.message ??
          `Vercel Connect could not issue the CivicFlow Stripe sandbox credential (HTTP ${response.status}).`,
      };
    }

    return { token, error: "" };
  } catch {
    return {
      token: "",
      error: "CivicFlow could not obtain the Stripe sandbox credential from Vercel Connect.",
    };
  }
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

  // Supabase RPCs that perform writes may return 204 No Content.
  // Do not parse an empty successful response as JSON.
  const raw = await result.text();
  if (!raw.trim()) {
    return { data: null, error: "" };
  }

  try {
    return { data: JSON.parse(raw) as T, error: "" };
  } catch {
    return { data: null, error: "CivicFlow received an invalid invoice service response." };
  }
}

async function expireStripeSession(
  token: string,
  sessionId: string
) {
  try {
    await fetch(
      `${STRIPE_API_BASE}/checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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

  // Production invoices must never be charged through the platform's Stripe account.
  // Live firm-specific Stripe Connect checkout is not enabled until the firm's
  // connected account is verified and the webhook supports Connect events.
  if (context.connection_mode === "live") {
    return responseError(
      "Live invoice payments require the law firm's verified Stripe connection. No payment has been initiated.",
      503
    );
  }

  if (context.connection_mode !== "sandbox") {
    return responseError(
      "This CivicFlow build is configured for sandbox payments only.",
      503
    );
  }

  if (context.balance_cents <= 0) {
    return responseError("This invoice has no remaining balance.", 409);
  }

  if (context.connected_account_id !== CIVICFLOW_STRIPE_SANDBOX_ACCOUNT_ID) {
    return responseError(
      "CivicFlow Stripe sandbox account configuration does not match the authorized sandbox merchant account.",
      503
    );
  }

  const credential = await getStripeCredential(request);
  if (!credential.token) {
    return responseError(credential.error, 503);
  }

  if (!credential.token.startsWith("sk_test_")) {
    return responseError(
      "CivicFlow refused a non-sandbox Stripe credential in the sandbox payment flow.",
      503
    );
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

  let stripeResponse: Response;
  try {
    stripeResponse = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody.toString(),
      cache: "no-store",
    });
  } catch {
    return responseError("CivicFlow could not reach Stripe Checkout.", 502);
  }

  const stripeRaw = await stripeResponse.text();
  let stripeSession: StripeCheckoutSession | null = null;
  try {
    stripeSession = stripeRaw
      ? (JSON.parse(stripeRaw) as StripeCheckoutSession)
      : null;
  } catch {
    return responseError(
      `Stripe Checkout returned an unreadable response (HTTP ${stripeResponse.status}).`,
      502
    );
  }

  if (!stripeResponse.ok || !stripeSession?.id || !stripeSession.url) {
    return responseError(
      stripeSession?.error?.message ||
        `Stripe Checkout could not be started (HTTP ${stripeResponse.status}).`,
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
