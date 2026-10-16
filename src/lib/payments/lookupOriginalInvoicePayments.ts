import type { VerifiedInvoicePayment } from "./authorizeFinancialAdjustment";

/**
 * Server-only lookup for the original reconciled Stripe payment.
 * The connected account and intent MUST originate from a signature-verified
 * Stripe Connect event. Never accept these values from an unauthenticated user.
 * Returns all matches so the caller can reject ambiguous results.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function lookupOriginalInvoicePayments(
  supabaseUrl: string,
  serviceKey: string,
  connectedAccountId: string,
  paymentIntentId: string,
  livemode: boolean
): Promise<VerifiedInvoicePayment[]> {
  if (!/^acct_[A-Za-z0-9]+$/.test(connectedAccountId) ||
      !/^pi_[A-Za-z0-9]+$/.test(paymentIntentId) ||
      !supabaseUrl.startsWith("https://") || !serviceKey)
    throw new Error("Invalid original payment lookup context");

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const connectionQuery = new URLSearchParams({
    select: "organization_id,mode,provider",
    stripe_account_id: `eq.${connectedAccountId}`,
    limit: "2",
  });
  const connectionResponse = await fetch(
    `${supabaseUrl}/rest/v1/organization_payment_connections?${connectionQuery}`,
    { headers, cache: "no-store" }
  );
  if (!connectionResponse.ok) throw new Error("Connected account lookup unavailable");
  const connections: unknown = await connectionResponse.json();
  if (!Array.isArray(connections) || connections.length !== 1)
    throw new Error("Connected account mapping is not unique");
  const connection = connections[0] as Record<string, unknown> | null;
  if (!connection || typeof connection !== "object" || Array.isArray(connection) ||
      connection.provider !== "stripe" ||
      connection.mode !== (livemode ? "live" : "sandbox") ||
      typeof connection.organization_id !== "string" || !UUID.test(connection.organization_id))
    throw new Error("Connected account environment mismatch");

  const paymentQuery = new URLSearchParams({
    select: "id,organization_id,invoice_id,amount_cents,processor_reference,billing_invoices!inner(currency,organization_id)",
    organization_id: `eq.${connection.organization_id}`,
    processor: "eq.stripe",
    status: "eq.succeeded",
    processor_reference: `eq.${paymentIntentId}`,
    limit: "3",
  });
  const paymentResponse = await fetch(
    `${supabaseUrl}/rest/v1/billing_payments?${paymentQuery}`,
    { headers, cache: "no-store" }
  );
  if (!paymentResponse.ok) throw new Error("Original payment lookup unavailable");
  const rows: unknown = await paymentResponse.json();
  if (!Array.isArray(rows) || rows.length > 2) throw new Error("Unexpected payment lookup result");
  return rows.map((raw: unknown) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new Error("Original payment has inconsistent invoice data");
    const row = raw as Record<string, unknown>;
    const invoiceValue = row.billing_invoices;
    const invoice = invoiceValue && typeof invoiceValue === "object" && !Array.isArray(invoiceValue)
      ? invoiceValue as Record<string, unknown> : null;
    if (!invoice || row.organization_id !== connection.organization_id ||
        invoice.organization_id !== connection.organization_id ||
        typeof invoice.currency !== "string" || !/^[a-z]{3}$/.test(invoice.currency) ||
        typeof row.id !== "string" || !UUID.test(row.id) ||
        typeof row.invoice_id !== "string" || !UUID.test(row.invoice_id) ||
        typeof row.amount_cents !== "number" || !Number.isSafeInteger(row.amount_cents) ||
        row.amount_cents <= 0 || row.processor_reference !== paymentIntentId)
      throw new Error("Original payment has inconsistent invoice data");
    return {
      organizationId: connection.organization_id as string,
      invoiceId: row.invoice_id,
      paymentId: row.id,
      stripeAccountId: connectedAccountId,
      stripePaymentIntentId: paymentIntentId,
      currency: invoice.currency,
      originalAmountCents: row.amount_cents,
      livemode,
    };
  });
}
