import type { ClassifiedConnectEvent } from "./connectFinancialEvents";
import { matchFinancialEventToPayment } from "./matchFinancialEventToPayment";
import { lookupOriginalInvoicePayments } from "./lookupOriginalInvoicePayments";

type InboxRow = {
  id: string; organization_id: string; connected_account_id: string;
  stripe_event_id: string; stripe_object_id: string; stripe_payment_intent_id: string | null;
  amount_cents: number | null; currency: string | null; stripe_status: string | null;
  event_type: ClassifiedConnectEvent["type"]; livemode: boolean; occurred_at: string;
  processing_state: string;
};
type Decision = { state: "needs_enrichment" | "needs_payment_match" | "needs_review" | "ready_for_posting"; matchedPaymentId?: string; errorCode?: string };
const headers = (key: string) => ({
  apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json",
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One read-and-classify reconciliation pass. Does not adjust invoice balances.
 * This is not a background job scheduler; caller controls invocation and access.
 */
export async function inspectFinancialInboxBatch(
  supabaseUrl: string, serviceKey: string, limit = 25
): Promise<{ examined: number; decisions: Decision[] }> {
  if (!supabaseUrl.startsWith("https://") || !serviceKey ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw new Error("Invalid financial inbox inspection context");
  const query = new URLSearchParams({
    select: "id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at,processing_state",
    processing_state: "in.(pending,needs_payment_match)",
    order: "created_at.asc",
    limit: String(limit),
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/client_payment_event_inbox?${query}`, {
    headers: headers(serviceKey), cache: "no-store",
  });
  if (!response.ok) throw new Error("Financial inbox inspection unavailable");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("Unexpected financial inbox response");
  const decisions: Decision[] = [];
  for (const raw of rows) {
    const row = raw as InboxRow | null;
    if (!row || typeof row !== "object" || !UUID.test(row.id) || !UUID.test(row.organization_id) ||
        !/^acct_[A-Za-z0-9]+$/.test(row.connected_account_id) ||
        !/^evt_[A-Za-z0-9]+$/.test(row.stripe_event_id)) {
      decisions.push({ state: "needs_review", errorCode: "invalid_inbox_row" });
      continue;
    }
    if (typeof row.event_type !== "string" ||
        typeof row.livemode !== "boolean" ||
        typeof row.stripe_object_id !== "string" ||
        typeof row.occurred_at !== "string" ||
        !Number.isFinite(Date.parse(row.occurred_at)) ||
        (row.amount_cents !== null && (!Number.isSafeInteger(row.amount_cents) || row.amount_cents < 0)) ||
        (row.currency !== null && (typeof row.currency !== "string" || !/^[a-z]{3}$/.test(row.currency))) ||
        (row.stripe_payment_intent_id !== null && (typeof row.stripe_payment_intent_id !== "string" || !/^pi_[A-Za-z0-9]+$/.test(row.stripe_payment_intent_id)))) {
      decisions.push({ state: "needs_review", errorCode: "invalid_inbox_row" });
      continue;
    }
    if (!row.stripe_payment_intent_id) {
      decisions.push({ state: "needs_enrichment" });
      continue;
    }
    const event: ClassifiedConnectEvent = {
      stripeEventId: row.stripe_event_id, connectedAccountId: row.connected_account_id,
      objectId: row.stripe_object_id, paymentIntentId: row.stripe_payment_intent_id,
      amountCents: row.amount_cents, currency: row.currency, status: row.stripe_status,
      type: row.event_type,
      category: row.event_type.startsWith("refund.") ? "refund" :
        row.event_type.startsWith("charge.dispute.") ? "dispute" :
        row.event_type.endsWith(".canceled") ? "canceled" : "failed",
      livemode: row.livemode, occurredAt: row.occurred_at,
    };
    const candidates = await lookupOriginalInvoicePayments(
      supabaseUrl, serviceKey, row.connected_account_id,
      row.stripe_payment_intent_id, row.livemode
    );
    const decision = matchFinancialEventToPayment(event, candidates);
    if (decision.state === "authorized") {
      if (decision.adjustment.organizationId !== row.organization_id) {
        decisions.push({ state: "needs_review", errorCode: "tenant_mismatch" });
      } else {
        // Read-only eligibility is NOT a ledger posting or completed event.
        decisions.push({ state: "ready_for_posting", matchedPaymentId: decision.adjustment.paymentId });
      }
    } else if (decision.state === "needs_review") {
      decisions.push({ state: "needs_review", errorCode: "verification_failed" });
    } else {
      decisions.push({ state: decision.state });
    }
  }
  return { examined: rows.length, decisions };
}
