"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const plans = [
  { id: "basic", name: "Basic", price: 30 },
  { id: "pro", name: "Pro", price: 80 },
  { id: "advanced", name: "Advanced", price: 100 },
] as const;

export default function FirmSubscriptionBilling({ isAdmin }: { isAdmin: boolean }) {
  const [plan, setPlan] = useState<"basic" | "pro" | "advanced">("pro");
  const [seats, setSeats] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [existingSubscription, setExistingSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [subscriptionCheckFailed, setSubscriptionCheckFailed] = useState(false);
  useEffect(() => {
    if (!isAdmin) { setCheckingSubscription(false); return; }
    let cancelled = false;
    async function checkSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (!cancelled) setSubscriptionCheckFailed(true); return; }
        const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
        if (!profile?.organization_id) { if (!cancelled) setSubscriptionCheckFailed(true); return; }
        const { data, error } = await supabase.rpc("get_civicflow_subscription_entitlement", {
          p_organization_id: profile.organization_id,
        });
        if (!cancelled) {
          if (error || !data) setSubscriptionCheckFailed(true);
          else setExistingSubscription(data.active === true || typeof data.status === "string");
        }
      } finally {
        if (!cancelled) setCheckingSubscription(false);
      }
    }
    void checkSubscription().catch(() => { if (!cancelled) { setSubscriptionCheckFailed(true); setCheckingSubscription(false); } });
    return () => { cancelled = true; };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const params = new URLSearchParams(window.location.search);
    const state = params.get("subscription");
    const sessionId = params.get("session_id");
    if (state === "cancelled") {
      setMessage("Checkout cancelled. Your subscription has not changed.");
      return;
    }
    if (state !== "processing" || !sessionId || !/^cs_(test_|live_)[A-Za-z0-9]+$/.test(sessionId)) return;
    let cancelled = false;
    async function activate() {
      setBusy(true);
      setMessage("Verifying your Stripe payment and activating your subscription...");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Please sign in to verify your payment.");
        const response = await fetch("/api/stripe/subscriptions/activate", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const result = await response.json();
        if (!response.ok || !result.activated) throw new Error(result.error || "Activation pending.");
        if (!cancelled) {
          setExistingSubscription(true);
          setMessage("Subscription verified and activated successfully.");
          window.history.replaceState({}, "", "/app/settings");
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Activation pending. Reload to retry.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void activate();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const price = plans.find((item) => item.id === plan)?.price ?? 80;

  async function startCheckout() {
    if (!isAdmin || busy || checkingSubscription || subscriptionCheckFailed || existingSubscription) return;
    setBusy(true);
    setMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/stripe/subscriptions/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, seats }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout unavailable.");
      const destination = new URL(result.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com")
        throw new Error("Unexpected checkout destination.");
      window.location.assign(destination.toString());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open checkout.");
      setBusy(false);
    }
  }

  return (
    <section className="premium-card">
      <p className="eyebrow">Platform subscription</p>
      <h2 className="mt-3 text-xl font-semibold text-slate-900">Firm billing</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Subscription charges cover CivicFlow staff seats only. Client invoice and trust payments are separate.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="input-label">Plan
          <select className="input-field" value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)}>
            {plans.map((item) => <option key={item.id} value={item.id}>{item.name} · ${item.price}/seat/month</option>)}
          </select>
        </label>
        <label className="input-label">Staff seats
          <input className="input-field" type="number" min={1} max={250} step={1} value={seats}
            onChange={(e) => setSeats(Number(e.target.value))} />
        </label>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-800">
        Estimated monthly subscription: ${Number.isSafeInteger(seats) && seats >= 1 && seats <= 250 ? price * seats : "—"}
      </p>
      <button type="button" className="btn btn-primary mt-5" disabled={!isAdmin || busy || checkingSubscription || subscriptionCheckFailed || existingSubscription || !Number.isSafeInteger(seats) || seats < 1 || seats > 250}
        onClick={startCheckout}>{busy ? "Opening secure checkout…" : existingSubscription ? "Subscription already registered" : subscriptionCheckFailed ? "Billing status unavailable" : checkingSubscription ? "Checking subscription…" : "Continue to secure checkout"}</button>
      {subscriptionCheckFailed && <p role="alert" className="mt-3 text-sm text-rose-700">Unable to verify this firm’s subscription status. Please reload or contact support before purchasing.</p>}
      {existingSubscription && <p className="mt-3 text-sm text-slate-600">This firm already has a subscription record. Contact support for plan changes or billing recovery.</p>}
      {!isAdmin && <p className="mt-3 text-sm text-slate-600">Only firm administrators can purchase seats.</p>}
      {message && <p role="alert" className="mt-3 text-sm text-rose-700">{message}</p>}
    </section>
  );
}
