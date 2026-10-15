import { NextResponse } from "next/server";
import { CONNECT_FINANCIAL_EVENTS, classifyConnectFinancialEvent } from "@/lib/payments/connectFinancialEvents";
import { routeVerifiedFinancialEvent } from "@/lib/payments/routeVerifiedFinancialEvent";
import { verifyConnectWebhookSignature } from "@/lib/payments/verifyConnectWebhookSignature";

export const runtime = "nodejs";
const MAX_BYTES = 1024 * 1024;
const respond = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Stripe Connect refund/dispute webhook intake.
 *
 * This endpoint is deliberately DISABLED until the inbox migration and
 * tenant-scoped idempotent inbox ingestion have been independently validated.
 * Never return a success acknowledgement for an event not durably persisted.
 * Do not reuse the CivicFlow subscription webhook signing secret.
 */
export async function POST(request: Request) {
  if (process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_ENABLED !== "true") {
    return respond("Connect financial event ingestion is disabled.", 503);
  }
  const secret = process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_SECRET;
  if (!secret?.startsWith("whsec_")) return respond("Connect webhook is not configured.", 503);

  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES))
    return respond("Event too large.", 413);

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BYTES)
    return respond("Event too large.", 413);

  if (!verifyConnectWebhookSignature(rawBody, request.headers.get("stripe-signature"), secret))
    return respond("Invalid Stripe signature.", 400);

  const payload: unknown = (() => {
    try { return JSON.parse(rawBody) as unknown; } catch { return null; }
  })();
  const event = classifyConnectFinancialEvent(payload);
  if (!event) {
    // Stripe sends many event types to shared Connect destinations. A verified
    // event outside this financial-event allowlist is intentionally ignored.
    const envelope = payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown> : null;
    if (typeof envelope?.id === "string" && /^evt_[A-Za-z0-9]+$/.test(envelope.id) &&
        typeof envelope?.account === "string" && /^acct_[A-Za-z0-9]+$/.test(envelope.account) &&
        typeof envelope?.livemode === "boolean" &&
        typeof envelope?.type === "string" && envelope.type.length > 0 &&
        !CONNECT_FINANCIAL_EVENTS.some(known => known === envelope.type)) {
      return NextResponse.json({ received: true, ignored: true });
    }
    return respond("Malformed Connect financial event.", 400);
  }

  const disposition = routeVerifiedFinancialEvent(event);
  if (disposition.state === "rejected") return respond("Invalid payment reference.", 400);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return respond("Financial event inbox unavailable.", 503);
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  // Resolve tenant ownership from our own registered account mapping.
  // Never trust invoice or organization IDs supplied in Stripe metadata.
  const accountQuery = new URLSearchParams({
    select: "organization_id,mode,provider",
    stripe_account_id: `eq.${event.connectedAccountId}`,
    limit: "2",
  });
  const accountResponse = await fetch(
    `${supabaseUrl}/rest/v1/organization_payment_connections?${accountQuery}`,
    { headers, cache: "no-store" }
  ).catch(() => null);
  if (!accountResponse?.ok) return respond("Account verification unavailable.", 503);
  const accounts: unknown = await accountResponse.json().catch(() => null);
  if (!Array.isArray(accounts) || accounts.length !== 1)
    return respond("Connected account is not uniquely registered.", 403);
  const account = accounts[0] as Record<string, unknown>;
  const mode = event.livemode ? "live" : "sandbox";
  if (account.provider !== "stripe" || account.mode !== mode ||
      typeof account.organization_id !== "string")
    return respond("Connected account environment mismatch.", 403);

  // Insert-only deduplication. On conflict, PostgREST ignores the duplicate
  // without replacing an existing processed or review state.
  const inboxResponse = await fetch(
    `${supabaseUrl}/rest/v1/client_payment_event_inbox?on_conflict=connected_account_id,stripe_event_id`,
    {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        organization_id: account.organization_id,
        connected_account_id: event.connectedAccountId,
        stripe_event_id: event.stripeEventId,
        stripe_object_id: event.objectId,
        stripe_payment_intent_id: event.paymentIntentId,
        amount_cents: event.amountCents,
        currency: event.currency,
        stripe_status: event.status,
        event_type: event.type,
        livemode: event.livemode,
        occurred_at: event.occurredAt,
        processing_state: disposition.state,
      }),
      cache: "no-store",
    }
  ).catch(() => null);
  if (!inboxResponse?.ok) {
    console.error("Connect event inbox persistence failed", { status: inboxResponse?.status });
    return respond("Financial event inbox unavailable.", 503);
  }
  // Accepted means durably queued, NOT applied to the customer's invoice.
  return NextResponse.json({ received: true });
}
