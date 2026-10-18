import { describe, expect, it } from "vitest";
import { authorizeFinancialAdjustment, type VerifiedInvoicePayment } from "./authorizeFinancialAdjustment";
import { classifyConnectFinancialEvent } from "./connectFinancialEvents";

const payment: VerifiedInvoicePayment = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  invoiceId: "22222222-2222-4222-8222-222222222222",
  paymentId: "33333333-3333-4333-8333-333333333333",
  stripeAccountId: "acct_firm1",
  stripePaymentIntentId: "pi_payment1",
  currency: "usd",
  originalAmountCents: 5000,
  livemode: false,
};
function event(amount: number) {
  const classified = classifyConnectFinancialEvent({
    id: "evt_refund1", account: "acct_firm1", livemode: false,
    created: 1792000000, type: "refund.created",
    data: { object: { id: "re_1", payment_intent: "pi_payment1", amount, currency: "usd", status: "succeeded" } },
  });
  if (!classified) throw new Error("Fixture did not classify");
  return classified;
}
describe("verified invoice adjustment authorization", () => {
  it("maps a verified partial refund to the original tenant and invoice", () => {
    expect(authorizeFinancialAdjustment(event(1200), payment)).toMatchObject({
      organizationId: payment.organizationId, invoiceId: payment.invoiceId,
      amountCents: 1200, eventType: "refund.created", livemode: false,
    });
  });
  it("rejects malformed runtime Stripe environment values on either side", () => {
    const valid = event(1200);
    expect(authorizeFinancialAdjustment(
      { ...valid, livemode: "false" as unknown as boolean }, payment
    )).toBeNull();
    expect(authorizeFinancialAdjustment(
      valid, { ...payment, livemode: "false" as unknown as boolean }
    )).toBeNull();
    expect(authorizeFinancialAdjustment(
      { ...valid, livemode: "false" as unknown as boolean },
      { ...payment, livemode: "false" as unknown as boolean }
    )).toBeNull();
  });
  it("rejects malformed payment intent identifiers", () => {
    expect(authorizeFinancialAdjustment({ ...event(1200), paymentIntentId: "invalid" }, { ...payment, stripePaymentIntentId: "invalid" })).toBeNull();
  });
  it("rejects malformed UUIDs and currency in reconciled payment context", () => {
    for (const field of ["organizationId", "invoiceId", "paymentId"] as const) {
      expect(authorizeFinancialAdjustment(event(1200), { ...payment, [field]: "11111111-1111-1111-1111-11111111111z" })).toBeNull();
    }
    expect(authorizeFinancialAdjustment(event(1200), { ...payment, currency: "USD" })).toBeNull();
    expect(authorizeFinancialAdjustment(event(1200), { ...payment, currency: "us" })).toBeNull();
  });
  it("rejects malformed Stripe event identity and lifecycle fields", () => {
    const valid = event(1200);
    expect(authorizeFinancialAdjustment({ ...valid, stripeEventId: "bad" }, payment)).toBeNull();
    expect(authorizeFinancialAdjustment({ ...valid, connectedAccountId: "bad" }, { ...payment, stripeAccountId: "bad" })).toBeNull();
    expect(authorizeFinancialAdjustment({ ...valid, objectId: "dp_wrong" }, payment)).toBeNull();
    expect(authorizeFinancialAdjustment({ ...valid, type: "charge.refunded" as typeof valid.type }, payment)).toBeNull();
    expect(authorizeFinancialAdjustment({ ...valid, occurredAt: "not-a-date" }, payment)).toBeNull();
  });
  it("requires recognized refund statuses", () => {
    expect(authorizeFinancialAdjustment({ ...event(1200), status: "unknown" }, payment)).toBeNull();
    expect(authorizeFinancialAdjustment({ ...event(1200), status: null }, payment)).toBeNull();
    expect(authorizeFinancialAdjustment({ ...event(1200), status: "under_review" }, payment)).toBeNull();
    expect(authorizeFinancialAdjustment({
      ...event(1200), type: "charge.dispute.created", objectId: "dp_test1",
      status: "succeeded",
    }, payment)).toBeNull();
    expect(authorizeFinancialAdjustment({
      ...event(1200), type: "charge.dispute.created", objectId: "dp_test1",
      status: "under_review",
    }, payment)).not.toBeNull();
    expect(authorizeFinancialAdjustment({ ...event(1200), status: "pending" }, payment)).not.toBeNull();
    expect(authorizeFinancialAdjustment({ ...event(1200), status: "succeeded" }, payment)).not.toBeNull();
  });
  it("rejects zero-value financial adjustments before accounting", () => {
    expect(authorizeFinancialAdjustment(event(0), payment)).toBeNull();
    expect(authorizeFinancialAdjustment(event(1), payment)).not.toBeNull();
  });
  it("rejects a refund larger than the original payment", () => {
    expect(authorizeFinancialAdjustment(event(5001), payment)).toBeNull();
  });
  it("rejects wrong account, payment intent, environment and currency", () => {
    expect(authorizeFinancialAdjustment(event(1200), { ...payment, stripeAccountId: "acct_other" })).toBeNull();
    expect(authorizeFinancialAdjustment(event(1200), { ...payment, stripePaymentIntentId: "pi_other" })).toBeNull();
    expect(authorizeFinancialAdjustment(event(1200), { ...payment, livemode: true })).toBeNull();
    expect(authorizeFinancialAdjustment(event(1200), { ...payment, currency: "eur" })).toBeNull();
  });
});
