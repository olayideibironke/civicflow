/**
 * Client payment-plan permissions and lifecycle rules.
 *
 * This is a defense-in-depth policy for API handlers. Database RPCs must
 * independently verify authenticated user, tenant and case membership.
 * Never trust the actor object supplied by a browser.
 */
export type PlanStatus =
  | "draft" | "awaiting_client_consent" | "active" | "past_due"
  | "paused" | "completed" | "cancelled" | "archived";

export type PlanAction =
  | "edit_terms" | "send_for_consent" | "activate_verified"
  | "mark_past_due_verified" | "pause_verified" | "resume_verified"
  | "complete_verified" | "cancel_verified" | "archive";

export type PlanActor = {
  userId: string;
  organizationId: string;
  role: "admin" | "attorney" | "staff" | "billing" | "paralegal" | "intake" | "client";
};

export type PlanContext = {
  organizationId: string;
  status: PlanStatus;
  createdBy: string;
  stripeSubscriptionId: string | null;
  clientConsentedAt: string | null;
};

export type PlanAuthorization = {
  allowed: boolean;
  reason: string;
};

const transitions: Record<PlanAction, readonly PlanStatus[]> = {
  edit_terms: ["draft"],
  send_for_consent: ["draft"],
  activate_verified: ["awaiting_client_consent"],
  mark_past_due_verified: ["active"],
  pause_verified: ["active", "past_due"],
  resume_verified: ["paused", "past_due"],
  complete_verified: ["active", "past_due", "paused"],
  cancel_verified: ["draft", "awaiting_client_consent", "active", "past_due", "paused"],
  archive: ["completed", "cancelled"],
};

const requiresStripeConfirmation = new Set<PlanAction>([
  "activate_verified", "mark_past_due_verified", "pause_verified",
  "resume_verified", "complete_verified", "cancel_verified",
]);

export function authorizePlanAction(
  actor: PlanActor,
  plan: PlanContext,
  action: PlanAction,
  verifiedStripeTransition = false
): PlanAuthorization {
  if (!actor.userId || !actor.organizationId || !plan.organizationId ||
      actor.organizationId !== plan.organizationId) {
    return { allowed: false, reason: "Firm access denied" };
  }
  if (actor.role !== "admin" && actor.role !== "attorney") {
    return { allowed: false, reason: "Attorney or firm administrator required" };
  }
  if (!transitions[action]?.includes(plan.status)) {
    return { allowed: false, reason: "Invalid payment plan transition" };
  }
  if (action === "activate_verified" &&
      (!plan.clientConsentedAt || !plan.stripeSubscriptionId)) {
    return { allowed: false, reason: "Verified client consent and subscription required" };
  }
  // Any subscription-bearing cancellation requires confirmation from Stripe.
  // Only a local draft or unaccepted offer without a subscription can be
  // cancelled without a Stripe call.
  if (requiresStripeConfirmation.has(action) &&
      !(action === "cancel_verified" && !plan.stripeSubscriptionId &&
        (plan.status === "draft" || plan.status === "awaiting_client_consent")) &&
      !verifiedStripeTransition) {
    return { allowed: false, reason: "Stripe confirmation required" };
  }
  if (action === "archive" && plan.stripeSubscriptionId &&
      plan.status !== "cancelled" && plan.status !== "completed") {
    return { allowed: false, reason: "Subscription must be closed first" };
  }
  return { allowed: true, reason: "" };
}
