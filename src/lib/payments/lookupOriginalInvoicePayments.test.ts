import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupOriginalInvoicePayments } from "./lookupOriginalInvoicePayments";

afterEach(() => vi.unstubAllGlobals());

const url = "https://example.supabase.co";
const organizationId = "11111111-1111-4111-8111-111111111111";
const connection = { organization_id: organizationId, mode: "sandbox", provider: "stripe" };
const payment = {
  id: "22222222-2222-4222-8222-222222222222",
  organization_id: organizationId,
  invoice_id: "33333333-3333-4333-8333-333333333333",
  amount_cents: 5000,
  processor_reference: "pi_payment1",
  billing_invoices: { currency: "usd", organization_id: organizationId },
};

function stubLookup(connections: unknown, payments: unknown) {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => connections })
    .mockResolvedValueOnce({ ok: true, json: async () => payments });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("original Stripe invoice payment lookup", () => {
  it("returns a tenant-scoped reconciled payment", async () => {
    const fetchMock = stubLookup([connection], [payment]);
    await expect(lookupOriginalInvoicePayments(url, "service-key", "acct_firm1", "pi_payment1", false))
      .resolves.toEqual([{
        organizationId, invoiceId: payment.invoice_id, paymentId: payment.id,
        stripeAccountId: "acct_firm1", stripePaymentIntentId: "pi_payment1",
        currency: "usd", originalAmountCents: 5000, livemode: false,
      }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("organization_id=eq.");
  });

  it("rejects null and malformed connected-account records before payment lookup", async () => {
    for (const connections of [[null], [42], [[]]]) {
      const fetchMock = stubLookup(connections, [payment]);
      await expect(lookupOriginalInvoicePayments(url, "service-key", "acct_firm1", "pi_payment1", false))
        .rejects.toThrow("Connected account environment mismatch");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("rejects null, array, and inconsistent invoice payment records", async () => {
    for (const payments of [[null], [[]], [{ ...payment, billing_invoices: [] }],
      [{ ...payment, billing_invoices: { currency: "usd", organization_id: "other" } }]]) {
      stubLookup([connection], payments);
      await expect(lookupOriginalInvoicePayments(url, "service-key", "acct_firm1", "pi_payment1", false))
        .rejects.toThrow("Original payment has inconsistent invoice data");
    }
  });

  it("rejects malformed invoice currency codes", async () => {
    for (const currency of ["", "US", "US D", "usd1", "USD"]) {
      stubLookup([connection], [{ ...payment, billing_invoices: { ...payment.billing_invoices, currency } }]);
      await expect(lookupOriginalInvoicePayments(url, "service-key", "acct_firm1", "pi_payment1", false))
        .rejects.toThrow("Original payment has inconsistent invoice data");
    }
  });

  it("rejects invalid organization and invoice identifiers", async () => {
    stubLookup([{ ...connection, organization_id: "invalid" }], [payment]);
    await expect(lookupOriginalInvoicePayments(url, "service-key", "acct_firm1", "pi_payment1", false))
      .rejects.toThrow("Connected account environment mismatch");

    for (const badPayment of [
      { ...payment, id: "invalid" },
      { ...payment, invoice_id: "invalid" },
    ]) {
      stubLookup([connection], [badPayment]);
      await expect(lookupOriginalInvoicePayments(url, "service-key", "acct_firm1", "pi_payment1", false))
        .rejects.toThrow("Original payment has inconsistent invoice data");
    }
  });
  it("rejects oversized payment lookup responses", async () => {
    stubLookup([connection], [payment, payment, payment]);
    await expect(lookupOriginalInvoicePayments(url, "service-key", "acct_firm1", "pi_payment1", false))
      .rejects.toThrow("Unexpected payment lookup result");
  });

  it("rejects ambiguous connected-account mappings", async () => {
    const fetchMock = stubLookup([connection, connection], [payment]);
    await expect(lookupOriginalInvoicePayments(url, "service-key", "acct_firm1", "pi_payment1", false))
      .rejects.toThrow("Connected account mapping is not unique");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
