import { describe, expect, it } from "vitest";
import { classifyConnectFinancialEvent } from "./connectFinancialEvents";

const base = {
  id: "evt_123", account: "acct_firm", livemode: false,
  created: 1792000000,
};

describe("Connect financial event classifier", () => {
  it("rejects unsigned/unscoped payload shapes", () => {
    expect(classifyConnectFinancialEvent({ ...base, type: "refund.created", data: { object: { id: "re_1" } }, account: undefined })).toBeNull();
    expect(classifyConnectFinancialEvent({ ...base, type: "refund.created", data: { object: { id: "re_1" } }, livemode: "false" })).toBeNull();
    expect(classifyConnectFinancialEvent({ ...base, type: "checkout.session.completed", data: { object: { id: "cs_1" } } })).toBeNull();
  });
  it("classifies unmatched refund and dispute events for enrichment only", () => {
    for (const type of ["refund.created", "charge.dispute.created"]) {
      expect(classifyConnectFinancialEvent({
        ...base, type,
        data: { object: { id: "re_or_dp_1", amount: 500, currency: "usd" } },
      })).toMatchObject({ paymentIntentId: null });
    }
  });
  it("rejects timestamps outside JavaScript Date range without throwing", () => {
    const payload = {
      ...base, type: "refund.created",
      data: { object: { id: "re_1", amount: 100, currency: "usd" } },
    };
    expect(classifyConnectFinancialEvent({ ...payload, created: 8640000000001 })).toBeNull();
    expect(classifyConnectFinancialEvent({ ...payload, created: Number.MAX_SAFE_INTEGER })).toBeNull();
    expect(classifyConnectFinancialEvent({ ...payload, created: 0 })).toBeNull();
  });
  it("rejects event object IDs from the wrong Stripe category", () => {
    for (const [type, objectId] of [
      ["refund.created", "dp_wrong"],
      ["charge.dispute.created", "re_wrong"],
      ["payment_intent.canceled", "re_wrong"],
      ["refund.updated", "re_bad-id"],
    ]) {
      expect(classifyConnectFinancialEvent({
        ...base, type, data: { object: { id: objectId, amount: 100, currency: "usd" } },
      })).toBeNull();
    }
  });
  it("captures a partial refund without treating it as an invoice payment", () => {
    const result = classifyConnectFinancialEvent({
      ...base, type: "refund.created",
      data: { object: { id: "re_partial", amount: 1250, currency: "usd", status: "pending", payment_intent: "pi_123" } },
    });
    expect(result).toMatchObject({
      category: "refund", objectId: "re_partial", amountCents: 1250,
      paymentIntentId: "pi_123", status: "pending", connectedAccountId: "acct_firm",
    });
  });
  it("does not treat cumulative charge refund amounts as deltas", () => {
    const result = classifyConnectFinancialEvent({
      ...base, type: "charge.refunded",
      data: { object: { id: "ch_1", amount: 10000, amount_refunded: 3500, currency: "usd", payment_intent: "pi_123" } },
    });
    expect(result).toBeNull();
  });
  it("captures dispute transitions for separate accounting reconciliation", () => {
    for (const type of ["charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed"]) {
      expect(classifyConnectFinancialEvent({
        ...base, type, data: { object: { id: "dp_1", amount: 4500, currency: "usd", status: "won", payment_intent: "pi_123" } },
      })?.category).toBe("dispute");
    }
  });
  it("distinguishes failed from canceled payment intents", () => {
    for (const [type, category] of [
      ["payment_intent.payment_failed", "failed"],
      ["payment_intent.canceled", "canceled"],
    ]) {
      expect(classifyConnectFinancialEvent({
        ...base, type, data: { object: { id: "pi_123", amount: 4500, currency: "usd" } },
      })?.category).toBe(category);
    }
  });
});
