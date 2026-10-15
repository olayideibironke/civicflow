import type { ClassifiedConnectEvent } from "./connectFinancialEvents";
import { authorizeFinancialAdjustment, type VerifiedInvoicePayment } from "./authorizeFinancialAdjustment";

/** Only a uniquely matched, server-verified original payment may be adjusted. */
export function matchFinancialEventToPayment(event: ClassifiedConnectEvent, candidates: readonly VerifiedInvoicePayment[]) {
  if (!event.paymentIntentId) return { state: "needs_enrichment" } as const;
  if (!/^pi_[A-Za-z0-9]+$/.test(event.paymentIntentId)) return { state: "needs_review" } as const;
  const matches = candidates.filter(p => p.stripeAccountId === event.connectedAccountId && p.stripePaymentIntentId === event.paymentIntentId);
  if (matches.length === 0) return { state: "needs_payment_match" } as const;
  if (matches.length !== 1) return { state: "needs_review" } as const;
  const adjustment = authorizeFinancialAdjustment(event, matches[0]);
  return adjustment ? { state: "authorized", adjustment } as const : { state: "needs_review" } as const;
}
