import { CONNECT_FINANCIAL_EVENTS, type ClassifiedConnectEvent } from "./connectFinancialEvents";
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
    processing_state: "in.(pending,needs_enrichment,needs_payment_match)",
    order: "created_at.asc",
    limit: String(limit),
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/client_payment_event_inbox?${query}`, {
    headers: headers(serviceKey), cache: "no-store",
  });
  if (!response.ok) throw new Error("Financial inbox inspection unavailable");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length > limit) throw new Error("Unexpected financial inbox response");
  const decisions: Decision[] = [];
  // Quarantine every occurrence of a duplicate ID, including the first.
  // Otherwise the first record could qualify for posting before its conflicting
  // counterpart is encountered later in the same batch.
  const eventCounts = new Map<string, number>();
  const rowCounts = new Map<string, number>();
  for (const raw of rows) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const fields = raw as Record<string, unknown>;
    const rowId = fields.id;
    if (typeof rowId === "string" && UUID.test(rowId))
      rowCounts.set(rowId, (rowCounts.get(rowId) ?? 0) + 1);
    const eventId = fields.stripe_event_id;
    if (typeof eventId === "string" && /^evt_[A-Za-z0-9]+$/.test(eventId))
      eventCounts.set(eventId, (eventCounts.get(eventId) ?? 0) + 1);
  }
  for (const raw of rows) {
    const row = raw as InboxRow | null;
    if (!row || typeof row !== "object" ||
        typeof row.id !== "string" || !UUID.test(row.id) ||
        typeof row.organization_id !== "string" || !UUID.test(row.organization_id) ||
        typeof row.connected_account_id !== "string" || !/^acct_[A-Za-z0-9]+$/.test(row.connected_account_id) ||
        typeof row.stripe_event_id !== "string" || !/^evt_[A-Za-z0-9]+$/.test(row.stripe_event_id)) {
      decisions.push({ state: "needs_review", errorCode: "invalid_inbox_row" });
      continue;
    }
    if ((rowCounts.get(row.id) ?? 0) > 1) {
      decisions.push({ state: "needs_review", errorCode: "duplicate_inbox_row" });
      continue;
    }
    // A repeated event ID in one batch is ambiguous evidence, even if the
    // payloads look identical. Never perform multiple lookups for that event.
    if ((eventCounts.get(row.stripe_event_id) ?? 0) > 1) {
      decisions.push({ state: "needs_review", errorCode: "duplicate_inbox_event" });
      continue;
    }
    if (typeof row.event_type !== "string" ||
        !CONNECT_FINANCIAL_EVENTS.some(known => known === row.event_type) ||
        (row.processing_state !== "pending" && row.processing_state !== "needs_enrichment" && row.processing_state !== "needs_payment_match") ||
        typeof row.livemode !== "boolean" ||
        typeof row.stripe_object_id !== "string" ||
        !(row.event_type.startsWith("refund.") ? /^re_[A-Za-z0-9]+$/.test(row.stripe_object_id) :
          row.event_type.startsWith("charge.dispute.") ? /^dp_[A-Za-z0-9]+$/.test(row.stripe_object_id) :
          /^pi_[A-Za-z0-9]+$/.test(row.stripe_object_id)) ||
        (row.stripe_status !== null && typeof row.stripe_status !== "string") ||
        typeof row.occurred_at !== "string" ||
        !Number.isFinite(Date.parse(row.occurred_at)) ||
        (row.amount_cents !== null && (!Number.isSafeInteger(row.amount_cents) || row.amount_cents < 0)) ||
        (row.currency !== null && (typeof row.currency !== "string" || !/^[a-z]{3}$/.test(row.currency))) ||
        (row.stripe_payment_intent_id !== null && (typeof row.stripe_payment_intent_id !== "string" || !/^pi_[A-Za-z0-9]+$/.test(row.stripe_payment_intent_id)))) {
      decisions.push({ state: "needs_review", errorCode: "invalid_inbox_row" });
      continue;
    }
    // A failed or canceled PaymentIntent is not a refund or dispute against
    // an already succeeded invoice payment. Never qualify it for ledger posting.
    if (row.event_type === "payment_intent.payment_failed" ||
        row.event_type === "payment_intent.canceled") {
      decisions.push({ state: "needs_review", errorCode: "non_adjustment_payment_lifecycle" });
      continue;
    }
    // Do not classify malformed monetary evidence as merely incomplete.
    // Missing fields may be enriched; zero or negative amounts and unsupported
    // statuses require review before any payment matching.
    if (row.amount_cents !== null && row.amount_cents <= 0) {
      decisions.push({ state: "needs_review", errorCode: "invalid_adjustment_amount" });
      continue;
    }
    const allowedStatuses = row.event_type.startsWith("refund.") ?
      ["pending", "requires_action", "succeeded", "failed", "canceled"] :
      ["warning_needs_response", "warning_under_review", "needs_response",
        "under_review", "warning_closed", "won", "lost"];
    if (row.stripe_status !== null && !allowedStatuses.includes(row.stripe_status)) {
      decisions.push({ state: "needs_review", errorCode: "invalid_adjustment_status" });
      continue;
    }
    // An absent amount, currency, or lifecycle status is incomplete evidence,
    // not a verified adjustment. Keep it in enrichment without payment lookup.
    if (row.amount_cents === null || row.currency === null || row.stripe_status === null) {
      decisions.push({ state: "needs_enrichment" });
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
