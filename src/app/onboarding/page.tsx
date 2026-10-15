"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MarketingHeader from "@/components/MarketingHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

type Pending = { firmName: string; firstName: string; lastName: string; email: string; plan: "basic" | "pro" | "advanced"; seats: number };
const key = "civicflow_pending_registration_v1";

export default function OnboardingPage() {
  const [status, setStatus] = useState("Checking your verified account…");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  useEffect(() => {
    let active = true;
    async function check() {
      const raw = window.localStorage.getItem(key);
      let draft: Pending | null = null;
      try { draft = raw ? JSON.parse(raw) as Pending : null; } catch { /* no valid draft */ }
      if (!draft || !["basic","pro","advanced"].includes(draft.plan) || !Number.isSafeInteger(draft.seats) || draft.seats < 1 || draft.seats > 250) {
        if (active) setStatus("Your registration details are missing. Start registration again on this device.");
        return;
      }
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !user) { setStatus("Verify your email, then sign in to continue your setup."); return; }
      if (!user.email_confirmed_at) { setStatus("Verify your email before continuing."); return; }
      if (user.email?.toLowerCase() !== draft.email.toLowerCase()) { setStatus("The signed-in account does not match this registration."); return; }
      setPending(draft);
      setReady(true);
      setStatus("");
    }
    void check();
    return () => { active = false; };
  }, []);

  async function continueSetup() {
    if (!pending || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const { data: provisioned, error: provisionError } = await supabase.rpc("provision_civicflow_firm", {
        p_firm_name: pending.firmName, p_first_name: pending.firstName, p_last_name: pending.lastName,
      });
      if (provisionError || !provisioned) throw new Error(provisionError?.message || "Firm setup is unavailable.");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to complete payment.");
      const response = await fetch("/api/stripe/subscriptions/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ plan: pending.plan, seats: pending.seats }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Secure checkout is unavailable.");
      const destination = new URL(result.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") throw new Error("Invalid checkout destination.");
      window.localStorage.removeItem(key);
      window.location.assign(destination.toString());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to continue setup.");
      setBusy(false);
    }
  }

  return <main className="mk min-h-screen">
    <MarketingHeader activePage="get-started"/>
    <section className="mk-container mx-auto max-w-3xl py-20">
      <div className="rounded-[18px] border border-line bg-white p-8 sm:p-12">
        <p className="mk-eyebrow">Firm onboarding</p>
        <h1 className="mk-h2 mt-5 text-ink">Complete your firm setup.</h1>
        <p className="mt-5 text-slate-600">Your account must be verified before your firm can be created. Payment activation happens after secure checkout verification.</p>
        {ready && pending && <div className="mt-7 rounded-xl border border-line p-5">
          <p className="font-semibold text-ink">{pending.firmName}</p>
          <p className="mt-2 text-sm text-slate-600">{pending.plan.toUpperCase()} · {pending.seats} {pending.seats === 1 ? "seat" : "seats"}</p>
          <button type="button" disabled={busy} onClick={continueSetup} className="mk-btn mk-btn-primary mt-6">{busy ? "Preparing secure checkout…" : "Continue to secure checkout"}</button>
        </div>}
        {status && <p role="status" className="mk-alert mk-alert-info mt-7">{status}</p>}
        <div className="mt-7 flex flex-wrap gap-5 text-sm"><Link href="/attorney-login" className="underline">Sign in</Link><Link href="/get-started" className="underline">Start registration</Link></div>
      </div>
    </section>
    <SiteFooter/>
  </main>;
}
