"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { plans } from "@/components/marketing/content";
import { supabase } from "@/lib/supabase";

type Plan = "basic" | "pro" | "advanced";
const isPlan = (value: string | null): value is Plan => value === "basic" || value === "pro" || value === "advanced";
const key = "civicflow_pending_registration_v1";

export default function GetStartedPage() {
  const [plan, setPlan] = useState<Plan>("basic");
  const [seats, setSeats] = useState(1);
  const [firmName, setFirmName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("plan");
    if (isPlan(requested)) setPlan(requested);
  }, []);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setNotice("");
    if (!firmName.trim() || !firstName.trim() || !lastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setNotice("Enter your firm name, full name and valid work email."); return;
    }
    if (password.length < 12) { setNotice("Choose a password of at least 12 characters."); return; }
    if (!Number.isSafeInteger(seats) || seats < 1 || seats > 250) { setNotice("Choose between 1 and 250 seats."); return; }
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) throw new Error("You are already signed in. Sign out before registering a new firm.");
      const pending = { firmName: firmName.trim(), firstName: firstName.trim(), lastName: lastName.trim(), plan, seats, email: email.trim().toLowerCase() };
      window.localStorage.setItem(key, JSON.stringify(pending));
      const { error } = await supabase.auth.signUp({
        email: pending.email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
      setComplete(true);
      setPassword("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Registration is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  const price = plans.find(item => item.key === plan)?.price ?? 30;
  return <main className="mk min-h-screen">
    <MarketingHeader activePage="get-started" />
    <section className="mk-container grid gap-12 py-14 sm:py-20 lg:grid-cols-2">
      <div>
        <p className="mk-eyebrow">Create your firm account</p>
        <h1 className="mk-h2 mt-5 text-ink">Your practice. Your workspace.</h1>
        <p className="mk-lead mt-5">Create your account, verify your email and complete secure checkout to activate your firm workspace.</p>
        <ol className="mt-9 space-y-4 text-sm text-slate-600">
          <li>01 · Create your account</li><li>02 · Verify your work email</li><li>03 · Pay securely and activate</li>
        </ol>
        <p className="mt-9 text-sm text-slate-600">Want to speak with us first? <Link className="font-semibold underline" href="/request-demo">Request a demo</Link>.</p>
      </div>
      <div className="rounded-[18px] border border-line bg-white p-7 shadow-[0_30px_70px_-40px_rgba(8,18,42,0.35)] sm:p-10">
        {complete ? <div role="status">
          <p className="mk-eyebrow">Check your inbox</p>
          <h2 className="mt-4 text-2xl font-semibold text-ink">Verify your email to continue.</h2>
          <p className="mt-4 text-slate-600">We sent account verification instructions to {email}. After verification, continue to firm setup and payment.</p>
          <Link href="/onboarding" className="mk-btn mk-btn-primary mt-7">Continue setup</Link>
        </div> : <form onSubmit={register} className="space-y-5">
          <h2 className="text-xl font-semibold text-ink">Firm registration</h2>
          <label className="mk-label">Firm name<input className="mk-field" required maxLength={160} autoComplete="organization" value={firmName} onChange={e=>setFirmName(e.target.value)} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="mk-label">First name<input className="mk-field" required maxLength={80} autoComplete="given-name" value={firstName} onChange={e=>setFirstName(e.target.value)} /></label>
            <label className="mk-label">Last name<input className="mk-field" required maxLength={80} autoComplete="family-name" value={lastName} onChange={e=>setLastName(e.target.value)} /></label>
          </div>
          <label className="mk-label">Work email<input className="mk-field" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
          <label className="mk-label">Create password<input className="mk-field" type="password" minLength={12} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="mk-label">Subscription plan<select className="mk-field" value={plan} onChange={e=>setPlan(e.target.value as Plan)}>{plans.map(p=><option key={p.key} value={p.key}>{p.name} · ${p.price}/seat</option>)}</select></label>
            <label className="mk-label">Staff seats<input className="mk-field" type="number" min={1} max={250} step={1} required value={seats} onChange={e=>setSeats(Number(e.target.value))}/></label>
          </div>
          <p className="text-sm font-semibold text-ink">Monthly total: ${Number.isSafeInteger(seats) && seats >= 1 && seats <= 250 ? price*seats : "—"}</p>
          {notice && <p role="alert" className="mk-alert mk-alert-error">{notice}</p>}
          <button className="mk-btn mk-btn-primary mk-btn-lg w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
          <p className="text-center text-sm text-slate-500">Already have an account? <Link href="/attorney-login" className="underline">Sign in</Link></p>
        </form>}
      </div>
    </section>
    <SiteFooter />
  </main>;
}
