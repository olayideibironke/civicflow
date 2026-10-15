"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FirmStripeConnect({ isAdmin }: { isAdmin: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  async function startOnboarding() {
    setBusy(true);
    setMessage("");
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.access_token) throw new Error("Sign in again to continue.");
      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: "{}",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to open Stripe onboarding.");
      if (result.ready === true) {
        setReady(true);
        setMessage("Stripe has verified this firm's payment account.");
      } else if (typeof result.url === "string" && result.url.startsWith("https://connect.stripe.com/")) {
        window.location.assign(result.url);
      } else {
        throw new Error("Stripe did not return a valid onboarding link.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stripe onboarding could not start.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="premium-card">
      <p className="eyebrow">Client Invoice Payments</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">Stripe for your firm</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Connect your law firm's own Stripe account to receive client invoice payments directly.
        CivicFlow subscription fees are billed separately.
      </p>
      <button type="button" disabled={!isAdmin || busy || ready} onClick={startOnboarding}
        className="btn btn-primary mt-5 w-full">
        {busy ? "Checking Stripe..." : ready ? "Payments verified" : "Connect or verify Stripe"}
      </button>
      {!isAdmin && <p className="mt-3 text-sm text-slate-500">Only a firm administrator can configure payments.</p>}
      {message && <p role="status" className="mt-3 text-sm text-slate-700">{message}</p>}
    </section>
  );
}
