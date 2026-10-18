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
  it("rejects unsafe URLs and credentials before querying the inbox", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const badUrl of ["https://user:password@example.supabase.co/", "https://example.supabase.co/other", "https://example.supabase.co/?token=secret", "https://example.supabase.co/#fragment", "https://"]) {
      await expect(inspectFinancialInboxBatch(badUrl, "service-key")).rejects.toThrow();
    }
    for (const key of ["", "  ", "bad\nkey"]) {
      await expect(inspectFinancialInboxBatch("https://example.supabase.co", key)).rejects.toThrow();
    }
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
        { ...row, id: "00000000-0000-4000-8000-000000000001", stripe_event_id: "evt_case01", connected_account_id: null },
        { ...row, id: "00000000-0000-4000-8000-000000000002", stripe_event_id: "evt_case02", stripe_status: 123 },
        { ...row, id: "00000000-0000-4000-8000-000000000003", stripe_event_id: "evt_case03", processing_state: "processed" },
        { ...row, id: "00000000-0000-4000-8000-000000000004", stripe_event_id: "evt_case04", stripe_object_id: "" },
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
        { ...row, id: "00000000-0000-4000-8000-000000000101", stripe_event_id: "evt_case11", stripe_object_id: "dp_123" },
        { ...row, id: "00000000-0000-4000-8000-000000000102", stripe_event_id: "evt_case12", event_type: "charge.dispute.created", stripe_object_id: "re_123" },
        { ...row, id: "00000000-0000-4000-8000-000000000103", stripe_event_id: "evt_case13", event_type: "payment_intent.canceled", stripe_object_id: "re_123" },
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
        { ...row, id: "00000000-0000-4000-8000-000000000201", stripe_event_id: "evt_case21", event_type: "payment_intent.payment_failed", stripe_object_id: "pi_123", stripe_payment_intent_id: "pi_123" },
        { ...row, id: "00000000-0000-4000-8000-000000000202", stripe_event_id: "evt_case22", event_type: "payment_intent.canceled", stripe_object_id: "pi_456", stripe_payment_intent_id: "pi_456" },
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
        { ...row, id: "00000000-0000-4000-8000-000000000301", stripe_event_id: "evt_case31", stripe_payment_intent_id: "pi_123", amount_cents: null },
        { ...row, id: "00000000-0000-4000-8000-000000000302", stripe_event_id: "evt_case32", stripe_payment_intent_id: "pi_123", currency: null },
        { ...row, id: "00000000-0000-4000-8000-000000000303", stripe_event_id: "evt_case33", stripe_payment_intent_id: "pi_123", stripe_status: null },
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
        { ...row, id: "00000000-0000-4000-8000-000000000401", stripe_event_id: "evt_case41", amount_cents: 0, stripe_payment_intent_id: "pi_123" },
        { ...row, id: "00000000-0000-4000-8000-000000000402", stripe_event_id: "evt_case42", stripe_status: "under_review", stripe_payment_intent_id: "pi_123" },
        { ...row, id: "00000000-0000-4000-8000-000000000403", stripe_event_id: "evt_case43", event_type: "charge.dispute.created", stripe_object_id: "dp_123",
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
  it("quarantines repeated inbox row IDs even with different Stripe event IDs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [
        { ...row, stripe_event_id: "evt_rowone" },
        { ...row, stripe_event_id: "evt_rowtwo" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 2, decisions: [
        { state: "needs_review", errorCode: "duplicate_inbox_row" },
        { state: "needs_review", errorCode: "duplicate_inbox_row" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("quarantines a valid event when its duplicate has malformed row metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [
        { ...row, id: "00000000-0000-4000-8000-000000000921",
          stripe_event_id: "evt_conflict", stripe_payment_intent_id: "pi_conflict" },
        { ...row, id: "invalid-row-id", stripe_event_id: "evt_conflict",
          stripe_payment_intent_id: "pi_conflict" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 2, decisions: [
        { state: "needs_review", errorCode: "duplicate_inbox_event" },
        { state: "needs_review", errorCode: "invalid_inbox_row" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("blocks cross-tenant original payments even when Stripe identifiers match", async () => {
    const foreignTenant = "99999999-9999-4999-8999-999999999999";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{
        ...row, stripe_payment_intent_id: "pi_match", stripe_status: "succeeded",
      }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{
        organization_id: foreignTenant, mode: "sandbox", provider: "stripe",
      }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{
        id: "88888888-8888-4888-8888-888888888888",
        organization_id: foreignTenant,
        invoice_id: "77777777-7777-4777-8777-777777777777",
        amount_cents: 500,
        processor_reference: "pi_match",
        billing_invoices: { id: "77777777-7777-4777-8777-777777777777", organization_id: foreignTenant, currency: "usd" },
      }] });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 1, decisions: [
        { state: "needs_review", errorCode: "tenant_mismatch" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("isolates payment lookup failures and continues inspecting later inbox rows", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [
        { ...row, id: "00000000-0000-4000-8000-000000000901",
          stripe_event_id: "evt_lookupfail", stripe_payment_intent_id: "pi_lookupfail" },
        { ...row, id: "00000000-0000-4000-8000-000000000902",
          stripe_event_id: "evt_following", stripe_payment_intent_id: null },
      ] })
      .mockResolvedValueOnce({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 2, decisions: [
        { state: "needs_review", errorCode: "payment_lookup_unavailable" },
        { state: "needs_enrichment" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("isolates a thrown payment lookup error without skipping later records", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [
        { ...row, id: "00000000-0000-4000-8000-000000000911",
          stripe_event_id: "evt_lookupthrow", stripe_payment_intent_id: "pi_lookupthrow" },
        { ...row, id: "00000000-0000-4000-8000-000000000912",
          stripe_event_id: "evt_afterthrow", stripe_payment_intent_id: null },
      ] })
      .mockRejectedValueOnce(new Error("network unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .toEqual({ examined: 2, decisions: [
        { state: "needs_review", errorCode: "payment_lookup_unavailable" },
        { state: "needs_enrichment" },
      ] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("fails closed on malformed inbox JSON instead of returning empty decisions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ rows: [row] }),
    }));
    await expect(inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .rejects.toThrow("Unexpected financial inbox response");
  });
  it("fails closed on thrown inbox network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    await expect(inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .rejects.toThrow("network unavailable");
  });
  it("fails closed when inbox JSON parsing fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => { throw new SyntaxError("invalid JSON"); },
    }));
    await expect(inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .rejects.toThrow("invalid JSON");
  });
  it("fails closed when inbox query is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(inspectFinancialInboxBatch("https://example.supabase.co", "service-key"))
      .rejects.toThrow("Financial inbox inspection unavailable");
  });
});
