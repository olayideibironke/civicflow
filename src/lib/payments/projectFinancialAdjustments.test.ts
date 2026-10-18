import { describe, expect, it } from "vitest";
import { projectFinancialAdjustments, type FinancialSnapshot } from "./projectFinancialAdjustments";
const row = (eventId: string, objectId: string, type: FinancialSnapshot["type"], amountCents: number, status: string, occurredAt = "2026-10-15T12:00:00Z"): FinancialSnapshot =>
  ({ eventId, objectId, type, amountCents, status, occurredAt });
describe("financial adjustment projection", () => {
  it("does not double-count refund.created then refund.updated", () => {
    const events = [
      row("evt_1", "re_1", "refund.created", 1200, "pending"),
      row("evt_2", "re_1", "refund.updated", 1200, "succeeded", "2026-10-15T13:00:00Z"),
    ];
    expect(projectFinancialAdjustments(events, 5000)).toMatchObject({
      succeededRefundCents: 1200, pendingRefundCents: 0,
    });
    expect(projectFinancialAdjustments([...events, events[0]], 5000).succeededRefundCents).toBe(1200);
    expect(projectFinancialAdjustments([...events].reverse(), 5000).succeededRefundCents).toBe(1200);
  });
  it("tracks open, won and lost disputes without assuming permanent loss", () => {
    const events = [
      row("evt_a", "dp_1", "charge.dispute.created", 3000, "needs_response"),
      row("evt_b", "dp_1", "charge.dispute.closed", 3000, "won", "2026-10-16T12:00:00Z"),
      row("evt_c", "dp_2", "charge.dispute.closed", 500, "lost"),
    ];
    expect(projectFinancialAdjustments(events, 5000)).toMatchObject({
      openDisputeCents: 0, wonDisputeCents: 3000, lostDisputeCents: 500,
    });
  });
  it("does not treat a closed dispute warning as recovered money", () => {
    const result = projectFinancialAdjustments([
      row("evt_warning", "dp_warning", "charge.dispute.closed", 2500, "warning_closed"),
    ], 5000);
    expect(result.wonDisputeCents).toBe(0);
    expect(result.needsReview).toBe(true);
  });
  it("flags over-refunding for investigation", () => {
    const events = [
      row("evt_1", "re_1", "refund.updated", 3500, "succeeded"),
      row("evt_2", "re_2", "refund.updated", 2000, "succeeded"),
    ];
    expect(projectFinancialAdjustments(events, 5000).needsReview).toBe(true);
  });
  it("rejects unsupported event types and mismatched Stripe object identifiers", () => {
    expect(() => projectFinancialAdjustments([
      row("evt_bad1", "dp_1", "refund.created", 100, "pending"),
    ], 5000)).toThrow("Invalid financial adjustment snapshot");
    expect(() => projectFinancialAdjustments([
      row("evt_bad2", "re_1", "charge.dispute.created", 100, "needs_response"),
    ], 5000)).toThrow("Invalid financial adjustment snapshot");
    expect(() => projectFinancialAdjustments([
      { ...row("evt_bad3", "re_1", "refund.created", 100, "pending"), type: "charge.refunded" as FinancialSnapshot["type"] },
    ], 5000)).toThrow("Invalid financial adjustment snapshot");
  });
  it("rejects invalid event metadata before computing totals", () => {
    expect(() => projectFinancialAdjustments([
      { ...row("evt_1", "re_1", "refund.created", 100, "pending"), status: "" },
    ], 5000)).toThrow("Invalid financial adjustment snapshot");
    expect(() => projectFinancialAdjustments([
      { ...row("evt_1", "re_1", "refund.created", 100, "pending"), eventId: "bad" },
    ], 5000)).toThrow("Invalid financial adjustment snapshot");
  });
  it("flags inconsistent amounts for the same Stripe refund or dispute", () => {
    const refundEvents = [
      row("evt_r1", "re_1", "refund.created", 1200, "pending"),
      row("evt_r2", "re_1", "refund.updated", 1300, "succeeded", "2026-10-15T13:00:00Z"),
    ];
    const disputeEvents = [
      row("evt_d1", "dp_1", "charge.dispute.created", 2000, "needs_response"),
      row("evt_d2", "dp_1", "charge.dispute.closed", 2100, "lost", "2026-10-15T13:00:00Z"),
    ];
    expect(projectFinancialAdjustments(refundEvents, 5000).needsReview).toBe(true);
    expect(projectFinancialAdjustments([...refundEvents].reverse(), 5000).needsReview).toBe(true);
    expect(projectFinancialAdjustments(disputeEvents, 5000).needsReview).toBe(true);
  });
  it("flags contradictory same-time lifecycle snapshots without trusting event ID order", () => {
    const snapshots = [
      row("evt_a", "re_same", "refund.created", 1200, "pending"),
      row("evt_b", "re_same", "refund.updated", 1200, "succeeded"),
    ];
    for (const events of [snapshots, [...snapshots].reverse()]) {
      expect(projectFinancialAdjustments(events, 5000).needsReview).toBe(true);
    }
  });
  it("flags later reversal of a terminal refund or dispute outcome", () => {
    const refund = [
      row("evt_terminal1", "re_terminal", "refund.updated", 1200, "succeeded"),
      row("evt_terminal2", "re_terminal", "refund.updated", 1200, "pending", "2026-10-16T12:00:00Z"),
    ];
    const dispute = [
      row("evt_terminal3", "dp_terminal", "charge.dispute.closed", 1200, "won"),
      row("evt_terminal4", "dp_terminal", "charge.dispute.updated", 1200, "under_review", "2026-10-16T12:00:00Z"),
    ];
    for (const events of [refund, [...refund].reverse(), dispute, [...dispute].reverse()]) {
      expect(projectFinancialAdjustments(events, 5000).needsReview).toBe(true);
    }
  });
  it("flags aggregate monetary totals outside the safe integer range", () => {
    const maximum = Number.MAX_SAFE_INTEGER;
    const events = [
      row("evt_large1", "re_large1", "refund.updated", maximum, "succeeded"),
      row("evt_large2", "re_large2", "refund.updated", maximum, "succeeded"),
    ];
    const result = projectFinancialAdjustments(events, maximum);
    expect(result.needsReview).toBe(true);
    expect(Number.isSafeInteger(result.succeededRefundCents)).toBe(false);
  });
  it("accepts identical replayed events regardless of object property order", () => {
    const original = row("evt_replay", "re_replay", "refund.updated", 1200, "succeeded");
    const reordered: FinancialSnapshot = {
      occurredAt: original.occurredAt,
      status: original.status,
      amountCents: original.amountCents,
      type: original.type,
      objectId: original.objectId,
      eventId: original.eventId,
    };
    expect(projectFinancialAdjustments([original, reordered], 5000)).toMatchObject({
      succeededRefundCents: 1200, needsReview: false,
    });
  });
  it("rejects conflicting duplicate event IDs", () => {
    expect(() => projectFinancialAdjustments([
      row("evt_1", "re_1", "refund.created", 100, "pending"),
      row("evt_1", "re_1", "refund.created", 200, "pending"),
    ], 5000)).toThrow();
  });
});
