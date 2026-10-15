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
  it("rejects malformed payment intent identifiers", () => {
    expect(authorizeFinancialAdjustment({ ...event(1200), paymentIntentId: "invalid" }, { ...payment, stripePaymentIntentId: "invalid" })).toBeNull();
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
