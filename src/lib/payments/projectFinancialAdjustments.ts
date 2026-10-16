/**
 * Pure, order-independent accounting projection of verified Stripe adjustments.
 * Input MUST come from the authenticated, tenant-scoped event ledger, never
 * directly from browser data. This does not write invoice balances.
 *
 * Stripe refund.updated events are snapshots of the SAME refund, not new
 * monetary movements. Dispute lifecycle events are also snapshots.
 */
export type FinancialSnapshot = {
  eventId: string;
  objectId: string;
  type: "refund.created" | "refund.updated" |
    "charge.dispute.created" | "charge.dispute.updated" | "charge.dispute.closed";
  amountCents: number;
  status: string;
  occurredAt: string;
};

export type FinancialProjection = {
  succeededRefundCents: number;
  pendingRefundCents: number;
  openDisputeCents: number;
  lostDisputeCents: number;
  wonDisputeCents: number;
  needsReview: boolean;
};

const settledRefund = new Set(["succeeded"]);
const pendingRefund = new Set(["pending", "requires_action"]);
const lostDispute = new Set(["lost"]);
const wonDispute = new Set(["won"]);
const openDispute = new Set([
  "warning_needs_response", "warning_under_review", "needs_response",
  "under_review",
]);

export function projectFinancialAdjustments(
  snapshots: readonly FinancialSnapshot[],
  originalPaymentCents: number
): FinancialProjection {
  if (!Number.isSafeInteger(originalPaymentCents) || originalPaymentCents < 0) {
    throw new Error("Invalid original payment amount");
  }
  const uniqueEvents = new Map<string, FinancialSnapshot>();
  for (const snapshot of snapshots) {
    if (!snapshot || typeof snapshot !== "object" ||
        typeof snapshot.eventId !== "string" || !/^evt_[A-Za-z0-9]+$/.test(snapshot.eventId) ||
        typeof snapshot.objectId !== "string" ||
        !(/^(re_[A-Za-z0-9]+)$/.test(snapshot.objectId) && (snapshot.type === "refund.created" || snapshot.type === "refund.updated") ||
          /^(dp_[A-Za-z0-9]+)$/.test(snapshot.objectId) && (snapshot.type === "charge.dispute.created" || snapshot.type === "charge.dispute.updated" || snapshot.type === "charge.dispute.closed")) ||
        typeof snapshot.status !== "string" || !snapshot.status ||
        typeof snapshot.occurredAt !== "string" ||
        !Number.isSafeInteger(snapshot.amountCents) ||
        snapshot.amountCents < 0 || snapshot.amountCents > originalPaymentCents ||
        !Number.isFinite(Date.parse(snapshot.occurredAt))) {
      throw new Error("Invalid financial adjustment snapshot");
    }
    const existing = uniqueEvents.get(snapshot.eventId);
    if (existing && (existing.objectId !== snapshot.objectId || existing.type !== snapshot.type || existing.amountCents !== snapshot.amountCents || existing.status !== snapshot.status || existing.occurredAt !== snapshot.occurredAt)) {
      throw new Error("Conflicting duplicate Stripe event");
    }
    uniqueEvents.set(snapshot.eventId, snapshot);
  }

  // Sort deterministically; event IDs break ties. A replay cannot move the
  // accounting projection backward or double-count an individual refund.
  const ordered = [...uniqueEvents.values()].sort((a, b) =>
    Date.parse(a.occurredAt) - Date.parse(b.occurredAt) ||
    a.eventId.localeCompare(b.eventId)
  );
  const refunds = new Map<string, FinancialSnapshot>();
  const disputes = new Map<string, FinancialSnapshot>();
  let conflictingObjectAmounts = false;
  for (const snapshot of ordered) {
    const target = snapshot.type.startsWith("refund.") ? refunds : disputes;
    const previous = target.get(snapshot.objectId);
    // One Stripe object cannot legitimately change its monetary amount between
    // lifecycle snapshots. Keep the latest snapshot but require human review.
    if (previous && previous.amountCents !== snapshot.amountCents) conflictingObjectAmounts = true;
    target.set(snapshot.objectId, snapshot);
  }
  const result: FinancialProjection = {
    succeededRefundCents: 0, pendingRefundCents: 0,
    openDisputeCents: 0, lostDisputeCents: 0,
    wonDisputeCents: 0, needsReview: conflictingObjectAmounts,
  };
  for (const refund of refunds.values()) {
    if (settledRefund.has(refund.status)) result.succeededRefundCents += refund.amountCents;
    else if (pendingRefund.has(refund.status)) result.pendingRefundCents += refund.amountCents;
    else if (refund.status !== "failed" && refund.status !== "canceled") result.needsReview = true;
  }
  for (const dispute of disputes.values()) {
    if (lostDispute.has(dispute.status)) result.lostDisputeCents += dispute.amountCents;
    else if (wonDispute.has(dispute.status)) result.wonDisputeCents += dispute.amountCents;
    else if (dispute.status === "warning_closed") result.needsReview = true;
    else if (openDispute.has(dispute.status)) result.openDisputeCents += dispute.amountCents;
    else result.needsReview = true;
  }
  // Flag totals that exceed JavaScript's safe integer range rather than
  // silently accepting imprecise monetary arithmetic.
  const totals = [result.succeededRefundCents, result.pendingRefundCents,
    result.openDisputeCents, result.lostDisputeCents, result.wonDisputeCents];
  if (totals.some(total => !Number.isSafeInteger(total)) ||
      BigInt(result.succeededRefundCents) + BigInt(result.pendingRefundCents) > BigInt(originalPaymentCents)) {
    result.needsReview = true;
  }
  return result;
}
