import type { ClassifiedConnectEvent } from "./connectFinancialEvents";

/**
 * The caller must retrieve this context server-side from an already reconciled
 * invoice payment. Never populate it from webhook metadata or browser input.
 */
export type VerifiedInvoicePayment = {
  organizationId: string;
  invoiceId: string;
  paymentId: string;
  stripeAccountId: string;
  stripePaymentIntentId: string;
  currency: string;
  originalAmountCents: number;
  livemode: boolean;
};

export type AuthorizedFinancialAdjustment = {
  organizationId: string;
  invoiceId: string;
  paymentId: string;
  connectedAccountId: string;
  stripeEventId: string;
  stripeObjectId: string;
  stripePaymentIntentId: string;
  eventType: ClassifiedConnectEvent["type"];
  amountCents: number;
  currency: string;
  status: string;
  occurredAt: string;
  livemode: boolean;
};

/**
 * Reject mismatched tenant, account, payment, environment or amount before
 * recording any financial event. This function does not mutate balances.
 *
 * A refund amount is one refund object's amount, NOT the cumulative amount
 * refunded on a charge. A dispute is a reversible state transition, NOT an
 * additional payment or automatic permanent debit.
 */
const REFUND_STATUSES = new Set(["pending", "requires_action", "succeeded", "failed", "canceled"]);
const DISPUTE_STATUSES = new Set([
  "warning_needs_response", "warning_under_review", "needs_response",
  "under_review", "warning_closed", "won", "lost",
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function authorizeFinancialAdjustment(
  event: ClassifiedConnectEvent,
  payment: VerifiedInvoicePayment
): AuthorizedFinancialAdjustment | null {
  if (!/^evt_[A-Za-z0-9]+$/.test(event.stripeEventId) ||
      !/^acct_[A-Za-z0-9]+$/.test(event.connectedAccountId) ||
      !/^acct_[A-Za-z0-9]+$/.test(payment.stripeAccountId) ||
      !(event.type === "refund.created" || event.type === "refund.updated" ||
        event.type === "charge.dispute.created" || event.type === "charge.dispute.updated" ||
        event.type === "charge.dispute.closed") ||
      !(event.type.startsWith("refund.") ? /^re_[A-Za-z0-9]+$/.test(event.objectId) :
        event.type.startsWith("charge.dispute.") ? /^dp_[A-Za-z0-9]+$/.test(event.objectId) :
        /^pi_[A-Za-z0-9]+$/.test(event.objectId)) ||
      typeof event.occurredAt !== "string" || !Number.isFinite(Date.parse(event.occurredAt))) {
    return null;
  }
  if (!event.paymentIntentId || event.paymentIntentId !== payment.stripePaymentIntentId ||
      !/^pi_[A-Za-z0-9]+$/.test(event.paymentIntentId) ||
      event.connectedAccountId !== payment.stripeAccountId ||
      event.livemode !== payment.livemode ||
      typeof payment.currency !== "string" || !/^[a-z]{3}$/.test(payment.currency) ||
      !event.currency || event.currency !== payment.currency ||
      event.amountCents === null || !Number.isSafeInteger(event.amountCents) ||
      (event.type.startsWith("refund.") ?
        !REFUND_STATUSES.has(event.status ?? "") :
        !DISPUTE_STATUSES.has(event.status ?? "")) ||
      event.amountCents <= 0 || event.amountCents > payment.originalAmountCents ||
      !Number.isSafeInteger(payment.originalAmountCents) || payment.originalAmountCents <= 0 ||
      !UUID.test(payment.organizationId) ||
      !UUID.test(payment.invoiceId) ||
      !UUID.test(payment.paymentId)) {
    return null;
  }

  return {
    organizationId: payment.organizationId,
    invoiceId: payment.invoiceId,
    paymentId: payment.paymentId,
    connectedAccountId: event.connectedAccountId,
    stripeEventId: event.stripeEventId,
    stripeObjectId: event.objectId,
    stripePaymentIntentId: event.paymentIntentId,
    eventType: event.type,
    amountCents: event.amountCents,
    currency: event.currency,
    status: event.status ?? "unknown",
    occurredAt: event.occurredAt,
    livemode: event.livemode,
  };
}
