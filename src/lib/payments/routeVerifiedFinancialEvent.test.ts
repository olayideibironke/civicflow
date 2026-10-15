import { describe, expect, it } from "vitest";
import { routeVerifiedFinancialEvent } from "./routeVerifiedFinancialEvent";
import type { ClassifiedConnectEvent } from "./connectFinancialEvents";
const event: ClassifiedConnectEvent = {
  stripeEventId: "evt_123", connectedAccountId: "acct_123",
  livemode: false, type: "refund.created", category: "refund",
  objectId: "re_123", paymentIntentId: "pi_123", amountCents: 100,
  currency: "usd", status: "pending", occurredAt: "2026-10-15T12:00:00Z",
};
describe("verified Connect event routing", () => {
  it("queues a mapped payment for reconciliation", () => {
    expect(routeVerifiedFinancialEvent(event)).toEqual({
      state: "needs_payment_match", paymentIntentId: "pi_123",
    });
  });
  it("holds events without payment intent for Stripe enrichment", () => {
    expect(routeVerifiedFinancialEvent({ ...event, paymentIntentId: null })).toEqual({
      state: "needs_enrichment", reason: "missing_payment_intent",
    });
  });
  it("rejects malformed connected account and intent references", () => {
    expect(routeVerifiedFinancialEvent({ ...event, connectedAccountId: "acct_wrong!" }).state).toBe("rejected");
    expect(routeVerifiedFinancialEvent({ ...event, paymentIntentId: "not_a_pi" }).state).toBe("rejected");
  });
});
