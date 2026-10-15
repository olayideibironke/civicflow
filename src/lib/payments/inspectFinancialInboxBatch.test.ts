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
  it("fails closed when inbox query is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .rejects.toThrow("Financial inbox inspection unavailable");
  });
});
