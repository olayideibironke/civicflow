"use client";

import { useState } from "react";
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
  const price = plans.find((item) => item.id === plan)?.price ?? 80;

  async function startCheckout() {
    if (!isAdmin || busy) return;
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
      <button type="button" className="btn btn-primary mt-5" disabled={!isAdmin || busy || !Number.isSafeInteger(seats) || seats < 1 || seats > 250}
        onClick={startCheckout}>{busy ? "Opening secure checkout…" : "Continue to secure checkout"}</button>
      {!isAdmin && <p className="mt-3 text-sm text-slate-600">Only firm administrators can purchase seats.</p>}
      {message && <p role="alert" className="mt-3 text-sm text-rose-700">{message}</p>}
    </section>
  );
}
