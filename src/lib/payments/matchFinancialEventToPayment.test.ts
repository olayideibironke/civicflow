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
  it("rejects wrong environment", () => { expect(matchFinancialEventToPayment(event,[{...payment,livemode:true}]).state).toBe("needs_review"); });
  it("never authorizes failed or canceled payment intents as financial adjustments", () => {
    for (const type of ["payment_intent.payment_failed", "payment_intent.canceled"] as const) {
      const lifecycleEvent = { ...event, type, category: type.endsWith("canceled") ? "canceled" as const : "failed" as const, objectId: "pi_123" };
      expect(matchFinancialEventToPayment(lifecycleEvent, [payment]).state).toBe("needs_review");
    }
  });
  it("rejects invalid intent references", () => { expect(matchFinancialEventToPayment({...event,paymentIntentId:"invalid"},[payment]).state).toBe("needs_review"); });
});
