"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
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
  currentSoftware: "MyCase",
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
      validateRequiredText(formState.currentSoftware, "Current software"),
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
        `Current practice-management software: ${formState.currentSoftware}.`,
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
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="get-started" />

      <section className="mx-auto grid max-w-[1200px] gap-8 px-6 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:py-16">
        <aside className="premium-dark animate-fade-up lg:sticky lg:top-28 lg:!p-9">
          <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blue-100">
            Get started
          </p>
          <h1 className="mt-7 text-3xl font-bold leading-[1.1] tracking-tight text-white xl:text-4xl">
            Tell us about your firm and the CivicFlow plan you want.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            We will use your firm size, current software, and primary workflow need to help map the right setup and onboarding path.
          </p>

          <div className="mt-7 grid gap-2.5">
            {[
              "Basic: $30 per user/month",
              "Pro: $80 per user/month",
              "Advanced: $100 per user/month",
              "Built for solo and growing small law firms",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <span className="mt-0.5 text-blue-300">✓</span>
                <p className="text-sm leading-6 text-blue-50/90">{item}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="animate-fade-up rounded-2xl border border-slate-200/80 bg-white/95 shadow-[var(--shadow-md)] backdrop-blur">
          {submitted ? (
            <div className="p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600 ring-1 ring-emerald-200">✓</div>
              <p className="eyebrow mt-6 text-emerald-600">Request received</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Thanks. We have your firm information.</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Your product inquiry has been recorded. We will use the information you provided to determine the right plan and onboarding path for your firm.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/pricing" className="btn btn-primary">Review plans</Link>
                <Link href="/" className="btn btn-secondary">Back to home</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="border-b border-slate-100 p-8">
                <p className="eyebrow text-blue-600">Firm setup</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Get started with CivicFlow.</h2>
                <p className="mt-2.5 text-base leading-7 text-slate-600">
                  Share a few details about your firm so we can map the right plan and setup.
                </p>
              </div>

              <div className="p-8">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="input-label">
                    Your name *
                    <input required value={formState.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Your name" className="input-field" />
                  </label>

                  <label className="input-label">
                    Work email *
                    <input type="email" required value={formState.workEmail} onChange={(event) => updateField("workEmail", event.target.value)} placeholder="name@lawfirm.com" className="input-field" />
                  </label>

                  <label className="input-label md:col-span-2">
                    Firm name *
                    <input required value={formState.firmName} onChange={(event) => updateField("firmName", event.target.value)} placeholder="Law firm name" className="input-field" />
                  </label>

                  <label className="input-label">
                    Firm size *
                    <select required value={formState.firmSize} onChange={(event) => updateField("firmSize", event.target.value)} className="input-field">
                      <option>Solo</option>
                      <option>2-5 attorneys</option>
                      <option>6-10 attorneys</option>
                      <option>11-25 attorneys</option>
                      <option>26+ attorneys</option>
                    </select>
                  </label>

                  <label className="input-label">
                    Current practice-management software *
                    <select required value={formState.currentSoftware} onChange={(event) => updateField("currentSoftware", event.target.value)} className="input-field">
                      <option>MyCase</option>
                      <option>Clio</option>
                      <option>PracticePanther</option>
                      <option>Smokeball</option>
                      <option>Filevine</option>
                      <option>Other</option>
                      <option>None</option>
                    </select>
                  </label>

                  <label className="input-label">
                    Plan *
                    <select required value={formState.selectedPlan} onChange={(event) => updateField("selectedPlan", event.target.value)} className="input-field">
                      <option>Basic</option>
                      <option>Pro</option>
                      <option>Advanced</option>
                    </select>
                  </label>

                  <label className="input-label">
                    Primary need *
                    <select required value={formState.primaryNeed} onChange={(event) => updateField("primaryNeed", event.target.value)} className="input-field">
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
                  <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{formError}</div>
                ) : null}

                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-sm leading-6 text-slate-500">
                    We use this information to understand your firm's setup and onboarding needs.
                  </p>
                  <button type="submit" disabled={submitting} className="btn btn-primary px-6 py-3">
                    {submitting ? "Submitting…" : "Submit request"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}
