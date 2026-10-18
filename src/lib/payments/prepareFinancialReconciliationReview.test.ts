import { describe, expect, it, vi, afterEach } from "vitest";
import { prepareFinancialReconciliationReview, summarizeFinancialInspection } from "./prepareFinancialReconciliationReview";

afterEach(() => vi.unstubAllGlobals());
const paymentId = "22222222-2222-4222-8222-222222222222";
describe("read-only financial reconciliation review", () => {
  it("summarizes a mixed inspection without granting posting authority", () => {
    const review = summarizeFinancialInspection({ examined: 5, decisions: [
      { state: "ready_for_posting", matchedPaymentId: paymentId },
      { state: "needs_enrichment" },
      { state: "needs_payment_match" },
      { state: "needs_review", errorCode: "tenant_mismatch" },
      { state: "needs_review", errorCode: "tenant_mismatch" },
    ] });
    expect(review).toEqual({
      examined: 5, readyForPosting: 1, needsEnrichment: 1,
      needsPaymentMatch: 1, needsReview: 2,
      errorsByCode: { tenant_mismatch: 2 }, matchedPaymentIds: [paymentId],
      canAutoPost: false,
    });
  });
  it("handles an empty inspection without changing balances", () => {
    expect(summarizeFinancialInspection({ examined: 0, decisions: [] })).toMatchObject({
      examined: 0, readyForPosting: 0, matchedPaymentIds: [], canAutoPost: false,
    });
  });
  it("rejects inconsistent counts, unknown states, and invalid posting identifiers", () => {
    expect(() => summarizeFinancialInspection({ examined: 2, decisions: [] })).toThrow();
    expect(() => summarizeFinancialInspection({ examined: 1, decisions: [
      { state: "ready_for_posting", matchedPaymentId: "invalid" },
    ] })).toThrow();
    expect(() => summarizeFinancialInspection({ examined: 1, decisions: [
      { state: "surprise" } as never,
    ] })).toThrow();
    expect(() => summarizeFinancialInspection({ examined: 1, decisions: [
      { state: "needs_review", matchedPaymentId: paymentId },
    ] })).toThrow();
  });
  it("does not issue mutation requests while preparing the review", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    const review = await prepareFinancialReconciliationReview("https://example.supabase.co", "service-key");
    expect(review).toMatchObject({ examined: 0, canAutoPost: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined();
  });
});
