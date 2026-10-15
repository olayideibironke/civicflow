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
export function authorizeFinancialAdjustment(
  event: ClassifiedConnectEvent,
  payment: VerifiedInvoicePayment
): AuthorizedFinancialAdjustment | null {
  if (!event.paymentIntentId || event.paymentIntentId !== payment.stripePaymentIntentId ||
      event.connectedAccountId !== payment.stripeAccountId ||
      event.livemode !== payment.livemode ||
      !event.currency || event.currency !== payment.currency.toLowerCase() ||
      event.amountCents === null || !Number.isSafeInteger(event.amountCents) ||
      event.amountCents < 0 || event.amountCents > payment.originalAmountCents ||
      !Number.isSafeInteger(payment.originalAmountCents) || payment.originalAmountCents <= 0 ||
      !/^[0-9a-f-]{36}$/i.test(payment.organizationId) ||
      !/^[0-9a-f-]{36}$/i.test(payment.invoiceId) ||
      !/^[0-9a-f-]{36}$/i.test(payment.paymentId)) {
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
