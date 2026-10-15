import { NextResponse } from "next/server";
import { classifyConnectFinancialEvent } from "@/lib/payments/connectFinancialEvents";
import { routeVerifiedFinancialEvent } from "@/lib/payments/routeVerifiedFinancialEvent";
import { verifyConnectWebhookSignature } from "@/lib/payments/verifyConnectWebhookSignature";

export const runtime = "nodejs";
const MAX_BYTES = 1024 * 1024;
const respond = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Stripe Connect refund/dispute webhook intake.
 *
 * This endpoint is deliberately DISABLED until the inbox migration and
 * tenant-scoped idempotent ingestion RPC have been independently validated.
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
  if (!event) return respond("Unsupported or malformed Connect event.", 400);

  const disposition = routeVerifiedFinancialEvent(event);
  if (disposition.state === "rejected") return respond("Invalid payment reference.", 400);

  // The remaining work must resolve event.connectedAccountId to exactly one
  // firm, confirm live/test mode, and durably enqueue the event with a
  // conflict-safe unique key. Acknowledging before this is unsafe.
  return respond("Verified event ingestion is not yet available.", 503);
}
