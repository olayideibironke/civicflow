import type { ClassifiedConnectEvent } from "./connectFinancialEvents";

/**
 * Decide where a signature-verified Connect event belongs before any database
 * write. The caller must independently resolve and authorize event.account.
 * An event being accepted into the inbox does NOT mean an invoice was adjusted.
 */
export type FinancialEventDisposition =
  | { state: "needs_enrichment"; reason: "missing_payment_intent" }
  | { state: "needs_payment_match"; paymentIntentId: string }
  | { state: "rejected"; reason: "invalid_reference" };

export function routeVerifiedFinancialEvent(
  event: ClassifiedConnectEvent
): FinancialEventDisposition {
  if (!/^acct_[A-Za-z0-9]+$/.test(event.connectedAccountId) ||
      !/^evt_[A-Za-z0-9]+$/.test(event.stripeEventId)) {
    return { state: "rejected", reason: "invalid_reference" };
  }
  if (!event.paymentIntentId) {
    return { state: "needs_enrichment", reason: "missing_payment_intent" };
  }
  if (!/^pi_[A-Za-z0-9]+$/.test(event.paymentIntentId)) {
    return { state: "rejected", reason: "invalid_reference" };
  }
  return { state: "needs_payment_match", paymentIntentId: event.paymentIntentId };
}
