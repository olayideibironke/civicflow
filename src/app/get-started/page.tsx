"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { plans } from "@/components/marketing/content";
import { supabase } from "@/lib/supabase";
import {
  getFirstValidationError,
  validateRequiredEmail,
  validateRequiredText,
} from "@/lib/validation";

type FormState = {
  name: string;
  workEmail: string;
  firmName: string;
  firmSize: string;
  currentSoftware: string;
  selectedPlan: string;
  primaryNeed: string;
};

const defaultState: FormState = {
  name: "",
  workEmail: "",
  firmName: "",
  firmSize: "Solo",
  currentSoftware: "Another practice-management platform",
  selectedPlan: "Basic",
  primaryNeed: "Matter management",
};

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ") || parts[0] || "",
  };
}

export default function GetStartedPage() {
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");

    if (plan && ["basic", "pro", "advanced"].includes(plan.toLowerCase())) {
      const normalized = `${plan.charAt(0).toUpperCase()}${plan.slice(1).toLowerCase()}`;
      setFormState((current) => ({ ...current, selectedPlan: normalized }));
    }
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = getFirstValidationError([
      validateRequiredText(formState.name, "Name"),
      validateRequiredEmail(formState.workEmail, "Work email"),
      validateRequiredText(formState.firmName, "Firm name"),
      validateRequiredText(formState.firmSize, "Firm size"),
      validateRequiredText(formState.currentSoftware, "Current setup"),
      validateRequiredText(formState.selectedPlan, "Plan"),
      validateRequiredText(formState.primaryNeed, "Primary need"),
    ]);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError("");

    const { firstName, lastName } = splitName(formState.name);
    const landingPage =
      window.sessionStorage.getItem("civicflow_landing") ||
      `${window.location.pathname}${window.location.search}`;
    const referrer =
      window.sessionStorage.getItem("civicflow_referrer") ||
      document.referrer ||
      "direct";
    const conversionPage = `${window.location.pathname}${window.location.search}`;

    const { error } = await supabase.from("demo_requests").insert({
      first_name: firstName,
      last_name: lastName,
      work_email: formState.workEmail.trim(),
      phone: null,
      organization_name: formState.firmName.trim(),
      role_title: "Product inquiry",
      organization_type: "Law firm",
      team_size: formState.firmSize,
      primary_need: formState.primaryNeed,
      timeline: formState.currentSoftware,
      preferred_contact: "Email",
      message: [
        `Selected plan: ${formState.selectedPlan}.`,
        `Current setup: ${formState.currentSoftware}.`,
        `Primary need: ${formState.primaryNeed}.`,
        `Landing page: ${landingPage}.`,
        `Conversion page: ${conversionPage}.`,
        `Referrer: ${referrer}.`,
      ].join(" "),
      source: "CivicFlow Get Started",
      status: "New",
    });

    if (error) {
      setSubmitting(false);
      setFormError(error.message);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
    setFormState(defaultState);
  }

  return (
    <main className="mk min-h-screen">
      <MarketingHeader activePage="get-started" />

      <section className="relative overflow-hidden">
        <div className="mk-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="mk-container relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="mk-eyebrow mk-rise">Get started</p>
            <h1 className="mk-h2 mk-rise mk-rise-1 mt-5 text-ink">Tell us about your firm. We will map the right setup.</h1>
            <p className="mk-lead mk-rise mk-rise-1 mt-5 max-w-lg">
              Share your firm size, current setup and the workflow you want to improve first. We use it to recommend a plan and an onboarding path that fits.
            </p>

            <div className="mk-rise mk-rise-2 mt-10">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">Choose a plan</p>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Plan">
                {plans.map((plan) => {
                  const selected = formState.selectedPlan === plan.name;
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => updateField("selectedPlan", plan.name)}
                      className={`mk-focus flex items-center justify-between gap-4 rounded-[12px] border px-5 py-4 text-left transition ${
                        selected
                          ? "border-navy bg-white shadow-[0_0_0_1px_var(--color-navy)]"
                          : "border-line bg-white/70 hover:border-line-strong"
                      }`}
                    >
                      <span className="flex items-center gap-3.5">
                        <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${selected ? "border-navy" : "border-line-strong"}`}>
                          {selected ? <span className="h-2 w-2 rounded-full bg-navy" /> : null}
                        </span>
                        <span>
                          <span className="block font-semibold text-ink">{plan.name}</span>
                          <span className="block text-[0.82rem] text-slate-500">{plan.bestFor}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="mk-display block text-[1.5rem] leading-none text-ink">${plan.price}</span>
                        <span className="text-[0.72rem] text-slate-500">per user / mo</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <Link href="/pricing" className="mk-link mt-4 text-sm">
                Compare plan features
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mk-arrow h-3.5 w-3.5">
                  <path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <ol className="mt-12 hidden gap-5 border-t border-line pt-8 lg:grid">
              {[
                ["Share your details", "Firm, team size, current setup and primary need."],
                ["We review your request", "We look at how your firm works today and what to move first."],
                ["Plan your onboarding", "We recommend the right plan and map your setup path."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-[0.7rem] text-navy">{i + 1}</span>
                  <span>
                    <span className="block font-semibold text-ink">{t}</span>
                    <span className="mt-0.5 block text-[0.9rem] leading-6 text-slate-600">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mk-rise mk-rise-2 rounded-[18px] border border-line bg-white shadow-[0_30px_70px_-40px_rgba(8,18,42,0.35)]">
            {submitted ? (
              <div className="p-8 sm:p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path d="m5 10.5 3.2 3.2L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">Request received</p>
                <h2 className="mk-display mt-3 text-[2rem] leading-tight text-ink">Thank you. We have your firm information.</h2>
                <p className="mt-4 max-w-xl text-[0.98rem] leading-7 text-slate-600">
                  Your product inquiry has been recorded. We will use the information you provided to determine the right plan and onboarding path for your firm.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/pricing" className="mk-btn mk-btn-primary">Review plans</Link>
                  <Link href="/" className="mk-btn mk-btn-outline">Back to home</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="border-b border-line px-7 py-7 sm:px-10 sm:py-8">
                  <h2 className="text-[1.35rem] font-semibold tracking-tight text-ink">Firm details</h2>
                  <p className="mt-1.5 text-[0.92rem] text-slate-500">All fields are required.</p>
                </div>

                <div className="px-7 py-8 sm:px-10">
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="mk-label">
                      Your name
                      <input required autoComplete="name" value={formState.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Your name" className="mk-field" />
                    </label>

                    <label className="mk-label">
                      Work email
                      <input type="email" required autoComplete="email" value={formState.workEmail} onChange={(event) => updateField("workEmail", event.target.value)} placeholder="name@lawfirm.com" className="mk-field" />
                    </label>

                    <label className="mk-label md:col-span-2">
                      Firm name
                      <input required autoComplete="organization" value={formState.firmName} onChange={(event) => updateField("firmName", event.target.value)} placeholder="Law firm name" className="mk-field" />
                    </label>

                    <label className="mk-label">
                      Firm size
                      <select required value={formState.firmSize} onChange={(event) => updateField("firmSize", event.target.value)} className="mk-field">
                        <option>Solo</option>
                        <option>2-5 attorneys</option>
                        <option>6-10 attorneys</option>
                        <option>11-25 attorneys</option>
                        <option>26+ attorneys</option>
                      </select>
                    </label>

                    <label className="mk-label">
                      Current setup
                      <select required value={formState.currentSoftware} onChange={(event) => updateField("currentSoftware", event.target.value)} className="mk-field">
                        <option>Another practice-management platform</option>
                        <option>Spreadsheets and shared drives</option>
                        <option>Mixed tools / no single system</option>
                        <option>None</option>
                        <option>Other</option>
                      </select>
                    </label>

                    <label className="mk-label">
                      Plan
                      <select required value={formState.selectedPlan} onChange={(event) => updateField("selectedPlan", event.target.value)} className="mk-field">
                        <option>Basic</option>
                        <option>Pro</option>
                        <option>Advanced</option>
                      </select>
                    </label>

                    <label className="mk-label">
                      Primary need
                      <select required value={formState.primaryNeed} onChange={(event) => updateField("primaryNeed", event.target.value)} className="mk-field">
                        <option>Matter management</option>
                        <option>Document organization</option>
                        <option>Staff workflow</option>
                        <option>Client intake</option>
                        <option>Follow-up tracking</option>
                        <option>Reporting</option>
                        <option>Migration from current software</option>
                        <option>Other</option>
                      </select>
                    </label>
                  </div>

                  {formError ? (
                    <div className="mk-alert mk-alert-error mt-6" role="alert">{formError}</div>
                  ) : null}

                  <div className="mt-8 flex flex-col gap-5 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-sm text-[0.85rem] leading-6 text-slate-500">
                      We use this information only to understand your firm&apos;s setup and onboarding needs.
                    </p>
                    <button type="submit" disabled={submitting} className="mk-btn mk-btn-primary mk-btn-lg">
                      {submitting ? "Submitting..." : "Submit request"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
