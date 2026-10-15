import { describe, expect, it } from "vitest";
import { authorizePlanAction, type PlanActor, type PlanContext } from "./authorizePlanAction";
const actor: PlanActor = {
  userId: "staff_1", organizationId: "org_a", role: "attorney",
};
const plan: PlanContext = {
  organizationId: "org_a", status: "draft", createdBy: "staff_1",
  stripeSubscriptionId: null, clientConsentedAt: null,
};
describe("attorney payment plan authorization", () => {
  it("permits an attorney to edit a draft", () => {
    expect(authorizePlanAction(actor, plan, "edit_terms").allowed).toBe(true);
  });
  it("rejects clients and cross-firm staff", () => {
    expect(authorizePlanAction({ ...actor, role: "client" }, plan, "edit_terms").allowed).toBe(false);
    expect(authorizePlanAction({ ...actor, organizationId: "org_b" }, plan, "edit_terms").allowed).toBe(false);
  });
  it("blocks editing an activated payment agreement", () => {
    expect(authorizePlanAction(actor, { ...plan, status: "active" }, "edit_terms").allowed).toBe(false);
  });
  it("requires consent, subscription and Stripe verification before activation", () => {
    const waiting: PlanContext = { ...plan, status: "awaiting_client_consent" };
    expect(authorizePlanAction(actor, waiting, "activate_verified", true).allowed).toBe(false);
    const consented = { ...waiting, clientConsentedAt: "2026-10-15T13:00:00Z", stripeSubscriptionId: "sub_123" };
    expect(authorizePlanAction(actor, consented, "activate_verified").allowed).toBe(false);
    expect(authorizePlanAction(actor, consented, "activate_verified", true).allowed).toBe(true);
  });
  it("requires verified Stripe cancellation for active subscriptions", () => {
    const active = { ...plan, status: "active" as const, stripeSubscriptionId: "sub_123" };
    expect(authorizePlanAction(actor, active, "cancel_verified").allowed).toBe(false);
    expect(authorizePlanAction(actor, active, "cancel_verified", true).allowed).toBe(true);
  });
  it("rejects local cancellation of a subscription-free active plan", () => {
    const inconsistent = { ...plan, status: "active" as const };
    expect(authorizePlanAction(actor, inconsistent, "cancel_verified").allowed).toBe(false);
  });
  it("allows draft cancellation without a Stripe call", () => {
    expect(authorizePlanAction(actor, plan, "cancel_verified").allowed).toBe(true);
  });
});
