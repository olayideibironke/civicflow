import type { VerifiedInvoicePayment } from "./authorizeFinancialAdjustment";

/**
 * Server-only lookup for the original reconciled Stripe payment.
 * The connected account and intent MUST originate from a signature-verified
 * Stripe Connect event. Never accept these values from an unauthenticated user.
 * Returns all matches so the caller can reject ambiguous results.
 */
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
  const connection = connections[0] as Record<string, unknown>;
  if (connection.provider !== "stripe" ||
      connection.mode !== (livemode ? "live" : "sandbox") ||
      typeof connection.organization_id !== "string")
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
  if (!Array.isArray(rows)) throw new Error("Unexpected payment lookup result");
  return rows.map((row: Record<string, unknown>) => {
    const invoice = row.billing_invoices as Record<string, unknown> | null;
    if (!invoice || invoice.organization_id !== connection.organization_id ||
        typeof invoice.currency !== "string" ||
        typeof row.id !== "string" || typeof row.invoice_id !== "string" ||
        typeof row.amount_cents !== "number" || !Number.isSafeInteger(row.amount_cents))
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
