import { inspectFinancialInboxBatch } from "./inspectFinancialInboxBatch";

type Inspection = Awaited<ReturnType<typeof inspectFinancialInboxBatch>>;
type Decision = Inspection["decisions"][number];

export type FinancialReconciliationReview = {
  examined: number;
  readyForPosting: number;
  needsEnrichment: number;
  needsPaymentMatch: number;
  needsReview: number;
  errorsByCode: Record<string, number>;
  /** Advisory only. These IDs are not posting authorizations. */
  matchedPaymentIds: string[];
  canAutoPost: false;
};

/**
 * Read-only operator preview. Never changes inbox state, creates ledger rows,
 * or authorizes a Stripe refund/dispute. Each decision is advisory until the
 * database's service-role authorization and atomic posting RPCs revalidate it.
 */
export function summarizeFinancialInspection(inspection: Inspection): FinancialReconciliationReview {
  if (!inspection || !Number.isSafeInteger(inspection.examined) ||
      inspection.examined < 0 || !Array.isArray(inspection.decisions) ||
      inspection.decisions.length !== inspection.examined)
    throw new Error("Invalid financial inspection result");

  const summary: FinancialReconciliationReview = {
    examined: inspection.examined, readyForPosting: 0, needsEnrichment: 0,
    needsPaymentMatch: 0, needsReview: 0, errorsByCode: {},
    matchedPaymentIds: [], canAutoPost: false,
  };
  const ids = new Set<string>();
  for (const decision of inspection.decisions as Decision[]) {
    if (!decision || typeof decision !== "object" || Array.isArray(decision))
      throw new Error("Invalid financial inspection decision");
    switch (decision.state) {
      case "ready_for_posting":
        if (typeof decision.matchedPaymentId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decision.matchedPaymentId) ||
            decision.errorCode !== undefined)
          throw new Error("Invalid posting preview");
        summary.readyForPosting++;
        ids.add(decision.matchedPaymentId);
        break;
      case "needs_enrichment":
        if (decision.matchedPaymentId !== undefined || decision.errorCode !== undefined)
          throw new Error("Invalid enrichment decision");
        summary.needsEnrichment++;
        break;
      case "needs_payment_match":
        if (decision.matchedPaymentId !== undefined || decision.errorCode !== undefined)
          throw new Error("Invalid matching decision");
        summary.needsPaymentMatch++;
        break;
      case "needs_review":
        if (decision.matchedPaymentId !== undefined ||
            (decision.errorCode !== undefined && (typeof decision.errorCode !== "string" ||
              !/^[a-z][a-z0-9_]{0,63}$/.test(decision.errorCode))))
          throw new Error("Invalid review decision");
        summary.needsReview++;
        if (decision.errorCode)
          summary.errorsByCode[decision.errorCode] = (summary.errorsByCode[decision.errorCode] ?? 0) + 1;
        break;
      default:
        throw new Error("Unknown financial inspection state");
    }
  }
  summary.matchedPaymentIds = [...ids].sort();
  return summary;
}

export async function prepareFinancialReconciliationReview(
  supabaseUrl: string, serviceKey: string, limit = 25
): Promise<FinancialReconciliationReview> {
  return summarizeFinancialInspection(
    await inspectFinancialInboxBatch(supabaseUrl, serviceKey, limit)
  );
}
