import { describe, expect, it } from "vitest";
import { matchFinancialEventToPayment } from "./matchFinancialEventToPayment";
import type { ClassifiedConnectEvent } from "./connectFinancialEvents";
import type { VerifiedInvoicePayment } from "./authorizeFinancialAdjustment";
const event: ClassifiedConnectEvent = { stripeEventId:"evt_123", connectedAccountId:"acct_123", livemode:false, type:"refund.updated", category:"refund", objectId:"re_123", paymentIntentId:"pi_123", amountCents:1200, currency:"usd", status:"succeeded", occurredAt:"2026-10-15T12:00:00Z" };
const payment: VerifiedInvoicePayment = { organizationId:"11111111-1111-4111-8111-111111111111", invoiceId:"22222222-2222-4222-8222-222222222222", paymentId:"33333333-3333-4333-8333-333333333333", stripeAccountId:"acct_123", stripePaymentIntentId:"pi_123", originalAmountCents:5000, currency:"usd", livemode:false };
describe("verified original payment matching", () => {
  it("authorizes exactly one matching payment", () => { expect(matchFinancialEventToPayment(event,[payment])).toMatchObject({state:"authorized",adjustment:{invoiceId:payment.invoiceId}}); });
  it("holds missing payment intent for enrichment", () => { expect(matchFinancialEventToPayment({...event,paymentIntentId:null},[payment]).state).toBe("needs_enrichment"); });
  it("holds unmatched payments", () => { expect(matchFinancialEventToPayment(event,[]).state).toBe("needs_payment_match"); });
  it("rejects ambiguous matches", () => { expect(matchFinancialEventToPayment(event,[payment,payment]).state).toBe("needs_review"); });
  it("rejects multiple matching payments with distinct payment IDs", () => {
    const second = {
      ...payment,
      paymentId: "44444444-4444-4444-8444-444444444444",
      invoiceId: "55555555-5555-4555-8555-555555555555",
    };
    expect(matchFinancialEventToPayment(event, [payment, second]).state).toBe("needs_review");
    expect(matchFinancialEventToPayment(event, [second, payment]).state).toBe("needs_review");
  });
  it("ignores unrelated candidates but still rejects ambiguity among matches", () => {
    const unrelated = { ...payment, stripePaymentIntentId: "pi_other" };
    const second = { ...payment, paymentId: "66666666-6666-4666-8666-666666666666" };
    expect(matchFinancialEventToPayment(event, [unrelated, payment]).state).toBe("authorized");
    expect(matchFinancialEventToPayment(event, [unrelated, payment, second]).state).toBe("needs_review");
  });
  it("fails closed when the candidate collection contains malformed entries", () => {
    for (const candidates of [
      [payment, null],
      [payment, 42],
      [payment, []],
      null,
    ]) {
      expect(matchFinancialEventToPayment(
        event, candidates as unknown as VerifiedInvoicePayment[]
      ).state).toBe("needs_review");
    }
  });
  it("rejects wrong environment", () => { expect(matchFinancialEventToPayment(event,[{...payment,livemode:true}]).state).toBe("needs_review"); });
  it("never authorizes failed or canceled payment intents as financial adjustments", () => {
    for (const type of ["payment_intent.payment_failed", "payment_intent.canceled"] as const) {
      const lifecycleEvent = { ...event, type, category: type.endsWith("canceled") ? "canceled" as const : "failed" as const, objectId: "pi_123" };
      expect(matchFinancialEventToPayment(lifecycleEvent, [payment]).state).toBe("needs_review");
    }
  });
  it("rejects invalid intent references", () => { expect(matchFinancialEventToPayment({...event,paymentIntentId:"invalid"},[payment]).state).toBe("needs_review"); });
});
