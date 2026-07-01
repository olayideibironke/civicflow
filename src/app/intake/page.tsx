"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  cleanPhoneDigits,
  formatPhoneInput,
  getFirstValidationError,
  validateRequiredEmail,
  validateRequiredPhone,
  validateRequiredText,
} from "@/lib/validation";

type IntakeFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceCategory: string;
  priority: string;
  details: string;
};

type IntakeResponse = {
  case_number: string;
  client_name: string;
};

const defaultFormState: IntakeFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  serviceCategory: "Eligibility Review",
  priority: "Standard",
  details: "",
};

export default function IntakePage() {
  const router = useRouter();

  const [formState, setFormState] = useState<IntakeFormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function updateField(field: keyof IntakeFormState, value: string) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: field === "phone" ? formatPhoneInput(value) : value,
    }));

    setFormError("");
  }

  function validateForm() {
    return getFirstValidationError([
      validateRequiredText(formState.firstName, "First name"),
      validateRequiredText(formState.lastName, "Last name"),
      validateRequiredEmail(formState.email),
      validateRequiredPhone(formState.phone),
      validateRequiredText(formState.serviceCategory, "Service category"),
      validateRequiredText(formState.priority, "Priority"),
      validateRequiredText(formState.details, "Request details"),
    ]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError("");

    const { data, error } = await supabase.rpc("submit_public_intake", {
      p_first_name: formState.firstName.trim(),
      p_last_name: formState.lastName.trim(),
      p_email: formState.email.trim(),
      p_phone: cleanPhoneDigits(formState.phone),
      p_service_category: formState.serviceCategory,
      p_priority: formState.priority,
      p_details: formState.details.trim(),
    });

    if (error) {
      setSubmitting(false);
      setFormError(error.message);
      return;
    }

    const response = (data?.[0] ?? null) as IntakeResponse | null;

    if (!response) {
      setSubmitting(false);
      setFormError("The intake was submitted, but no case number was returned.");
      return;
    }

    router.push(
      `/intake/success?case=${encodeURIComponent(
        response.case_number
      )}&client=${encodeURIComponent(response.client_name)}`
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)]">
      <header className="border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
              CF
            </div>

            <div>
              <p className="text-lg font-black leading-none text-slate-950">
                CivicFlow
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                by Westforge
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Back home
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1440px] gap-6 px-6 py-8 lg:grid-cols-[420px_minmax(0,1fr)] lg:py-10">
        <aside className="premium-dark self-start lg:sticky lg:top-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
            Public Intake
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
            Submit a service request.
          </h1>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            Public intake requires complete client information before a request
            can become a CivicFlow case.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-base font-black text-white">
                Required field validation
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Name, email, phone, service, priority, and request details must
                be complete before submission.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-base font-black text-white">
                Staff-ready case creation
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Valid submissions create a case, document checklist, and
                activity log in the CivicFlow workspace.
              </p>
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} noValidate className="premium-card">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Client Information
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Tell us who needs assistance
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                All required fields must be completed before the intake can be
                submitted.
              </p>
            </div>

            <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
              Secure intake
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="input-label">
              First name *
              <input
                required
                value={formState.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                placeholder="Angela"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Last name *
              <input
                required
                value={formState.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                placeholder="Brooks"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Email address *
              <input
                type="email"
                required
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="angela@example.org"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Phone number *
              <input
                required
                inputMode="numeric"
                value={formState.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="202-555-0198"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Service category *
              <select
                required
                value={formState.serviceCategory}
                onChange={(event) =>
                  updateField("serviceCategory", event.target.value)
                }
                className="input-field"
              >
                <option>Eligibility Review</option>
                <option>Document Processing</option>
                <option>Benefits Navigation</option>
                <option>Referral Request</option>
                <option>General Case Support</option>
              </select>
            </label>

            <label className="input-label">
              Priority *
              <select
                required
                value={formState.priority}
                onChange={(event) =>
                  updateField("priority", event.target.value)
                }
                className="input-field"
              >
                <option>Standard</option>
                <option>Medium</option>
                <option>Urgent</option>
              </select>
            </label>
          </div>

          <label className="input-label mt-6">
            Request details *
            <textarea
              required
              value={formState.details}
              onChange={(event) => updateField("details", event.target.value)}
              rows={6}
              placeholder="Briefly describe what help is needed, what documents are available, and any important deadlines."
              className="input-field resize-y leading-7"
            />
          </label>

          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-black text-slate-950">
              Default case checklist
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              CivicFlow will create required document checklist items for the
              staff review team.
            </p>
          </div>

          {formError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
              {formError}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              By submitting, the request becomes a real CivicFlow case for staff
              review.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className={`rounded-2xl px-6 py-3 text-sm font-black shadow-lg transition ${
                submitting
                  ? "bg-slate-300 text-slate-600 shadow-none"
                  : "bg-slate-950 text-white shadow-slate-950/15 hover:bg-slate-800"
              } disabled:cursor-not-allowed`}
            >
              {submitting ? "Submitting intake..." : "Submit intake"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}