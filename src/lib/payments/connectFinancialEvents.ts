/**
 * Classify Stripe Connect financial lifecycle events without changing accounting state.
 * This is deliberately a pure parser: a caller MUST verify the Stripe signature,
 * livemode, connected account ownership and original payment mapping before using it.
 * Never mark an invoice paid from this classifier.
 */
export const CONNECT_FINANCIAL_EVENTS = [
  "refund.created",
  "refund.updated",
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
] as const;

export type ConnectFinancialEvent = (typeof CONNECT_FINANCIAL_EVENTS)[number];
export type FinancialEventCategory = "refund" | "dispute" | "failed" | "canceled";

export type ClassifiedConnectEvent = {
  stripeEventId: string;
  connectedAccountId: string;
  livemode: boolean;
  type: ConnectFinancialEvent;
  category: FinancialEventCategory;
  objectId: string;
  paymentIntentId: string | null;
  amountCents: number | null;
  currency: string | null;
  status: string | null;
  occurredAt: string;
};

type RecordValue = Record<string, unknown>;
const asRecord = (value: unknown): RecordValue | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue : null;
const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;
const asAmount = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;

export function classifyConnectFinancialEvent(payload: unknown): ClassifiedConnectEvent | null {
  const event = asRecord(payload);
  if (!event) return null;
  const type = asString(event.type);
  if (!type || !CONNECT_FINANCIAL_EVENTS.some(known => known === type)) return null;
  const eventId = asString(event.id);
  const account = asString(event.account);
  const livemode = event.livemode;
  const created = event.created;
  const data = asRecord(event.data);
  const object = asRecord(data?.object);
  const objectId = asString(object?.id);
  if (!eventId || !/^evt_[A-Za-z0-9]+$/.test(eventId) ||
      !account || !/^acct_[A-Za-z0-9]+$/.test(account) ||
      typeof livemode !== "boolean" ||
      typeof created !== "number" || !Number.isSafeInteger(created) || created <= 0 ||
      !object || !objectId || created > 8640000000000) return null;

  const category: FinancialEventCategory = type.startsWith("refund.")
    ? "refund" : type.startsWith("charge.dispute.") ? "dispute"
    : type.endsWith(".canceled") ? "canceled" : "failed";

  // A charge.refunded event's amount_refunded is cumulative, not the incremental
  // amount for this event. The ledger must reconcile the refund objects by ID.
  const amount = asAmount(object.amount);
  const paymentIntentId = asString(object.payment_intent) ??
    (type.startsWith("payment_intent.") ? objectId : null);
  const currency = asString(object.currency)?.toLowerCase() ?? null;
  const status = asString(object.status);

  if (currency && !/^[a-z]{3}$/.test(currency)) return null;
  // Unmatched events may enter the verified inbox for Stripe enrichment.
  // They must not be applied to invoice accounting without a payment match.
  return {
    stripeEventId: eventId,
    connectedAccountId: account,
    livemode,
    type: type as ConnectFinancialEvent,
    category,
    objectId,
    paymentIntentId,
    amountCents: amount,
    currency,
    status,
    occurredAt: new Date(created * 1000).toISOString(),
  };
}
