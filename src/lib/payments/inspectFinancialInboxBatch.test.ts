import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectFinancialInboxBatch } from "./inspectFinancialInboxBatch";

afterEach(() => vi.unstubAllGlobals());
const id = "11111111-1111-4111-8111-111111111111";
const row = {
  id, organization_id: id, connected_account_id: "acct_123",
  stripe_event_id: "evt_123", stripe_object_id: "re_123",
  stripe_payment_intent_id: null, amount_cents: 100,
  currency: "usd", stripe_status: "pending", event_type: "refund.created",
  livemode: false, occurred_at: "2026-10-15T12:00:00Z",
  processing_state: "pending",
};
describe("read-only financial inbox inspection", () => {
  it("rejects unsafe batch limits before network access", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(inspectFinancialInboxBatch("https://example.supabase.co", "service-key", 101))
      .rejects.toThrow("Invalid financial inbox inspection context");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("holds events without payment intent for enrichment", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [row],
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await inspectFinancialInboxBatch("https://example.supabase.co", "service-key");
    expect(result).toEqual({ examined: 1, decisions: [{ state: "needs_enrichment" }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined();
  });
  it("includes persisted needs_enrichment events without posting or looking up payments", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [{ ...row, processing_state: "needs_enrichment" }],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 1, decisions: [{ state: "needs_enrichment" }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("processing_state")).toContain("needs_enrichment");
  });
  it("holds malformed inbox rows for review without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => [null, { ...row, id: "invalid" }],
    }));
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 2, decisions: [
        { state: "needs_review", errorCode: "invalid_inbox_row" },
        { state: "needs_review", errorCode: "invalid_inbox_row" },
      ] });
  });
  it("rejects unsupported event types before payment lookup", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [{
        ...row, event_type: "charge.refunded",
        stripe_payment_intent_id: "pi_123",
      }],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 1, decisions: [
        { state: "needs_review", errorCode: "invalid_inbox_row" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed fields and unexpected processing states", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [
        { ...row, stripe_event_id: "evt_case01", connected_account_id: null },
        { ...row, stripe_event_id: "evt_case02", stripe_status: 123 },
        { ...row, stripe_event_id: "evt_case03", processing_state: "processed" },
        { ...row, stripe_event_id: "evt_case04", stripe_object_id: "" },
        { ...row, stripe_event_id: null },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 5, decisions: Array.from({ length: 5 }, () => ({
        state: "needs_review", errorCode: "invalid_inbox_row",
      })) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("rejects inbox responses larger than the requested batch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => [row, row],
    }));
    await expect(inspectFinancialInboxBatch("https://example.supabase.co", "service-key", 1))
      .rejects.toThrow("Unexpected financial inbox response");
  });
  it("holds Stripe object identifiers that do not match their event category", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [
        { ...row, stripe_event_id: "evt_case11", stripe_object_id: "dp_123" },
        { ...row, stripe_event_id: "evt_case12", event_type: "charge.dispute.created", stripe_object_id: "re_123" },
        { ...row, stripe_event_id: "evt_case13", event_type: "payment_intent.canceled", stripe_object_id: "re_123" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 3, decisions: Array.from({ length: 3 }, () => ({
        state: "needs_review", errorCode: "invalid_inbox_row",
      })) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("never qualifies failed or canceled payment intents for ledger posting", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [
        { ...row, stripe_event_id: "evt_case21", event_type: "payment_intent.payment_failed", stripe_object_id: "pi_123", stripe_payment_intent_id: "pi_123" },
        { ...row, stripe_event_id: "evt_case22", event_type: "payment_intent.canceled", stripe_object_id: "pi_456", stripe_payment_intent_id: "pi_456" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 2, decisions: [
        { state: "needs_review", errorCode: "non_adjustment_payment_lifecycle" },
        { state: "needs_review", errorCode: "non_adjustment_payment_lifecycle" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("holds missing amount, currency, and status for enrichment even when payment intent exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [
        { ...row, stripe_event_id: "evt_case31", stripe_payment_intent_id: "pi_123", amount_cents: null },
        { ...row, stripe_event_id: "evt_case32", stripe_payment_intent_id: "pi_123", currency: null },
        { ...row, stripe_event_id: "evt_case33", stripe_payment_intent_id: "pi_123", stripe_status: null },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 3, decisions: [
        { state: "needs_enrichment" },
        { state: "needs_enrichment" },
        { state: "needs_enrichment" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("holds zero-dollar and mismatched-status adjustments for review before payment lookup", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [
        { ...row, stripe_event_id: "evt_case41", amount_cents: 0, stripe_payment_intent_id: "pi_123" },
        { ...row, stripe_event_id: "evt_case42", stripe_status: "under_review", stripe_payment_intent_id: "pi_123" },
        { ...row, stripe_event_id: "evt_case43", event_type: "charge.dispute.created", stripe_object_id: "dp_123",
          stripe_status: "succeeded", stripe_payment_intent_id: "pi_123" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 3, decisions: [
        { state: "needs_review", errorCode: "invalid_adjustment_amount" },
        { state: "needs_review", errorCode: "invalid_adjustment_status" },
        { state: "needs_review", errorCode: "invalid_adjustment_status" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("quarantines repeated Stripe event IDs in a batch without duplicate payment lookups", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [
        { ...row },
        { ...row, id: "22222222-2222-4222-8222-222222222222" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 2, decisions: [
        { state: "needs_review", errorCode: "duplicate_inbox_event" },
        { state: "needs_review", errorCode: "duplicate_inbox_event" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("fails closed when inbox query is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .rejects.toThrow("Financial inbox inspection unavailable");
  });
});
