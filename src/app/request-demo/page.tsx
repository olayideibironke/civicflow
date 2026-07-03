"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import { supabase } from "@/lib/supabase";
import {
  cleanPhoneDigits,
  formatPhoneInput,
  getFirstValidationError,
  validateRequiredEmail,
  validateRequiredText,
} from "@/lib/validation";

type DemoFormState = {
  firstName: string;
  lastName: string;
  workEmail: string;
  phone: string;
  organizationName: string;
  roleTitle: string;
  organizationType: string;
  teamSize: string;
  primaryNeed: string;
  timeline: string;
  preferredContact: string;
  message: string;
};

const defaultFormState: DemoFormState = {
  firstName: "",
  lastName: "",
  workEmail: "",
  phone: "",
  organizationName: "",
  roleTitle: "",
  organizationType: "Government agency",
  teamSize: "1-10 staff",
  primaryNeed: "Intake and case management",
  timeline: "Exploring options",
  preferredContact: "Email",
  message: "",
};

function validateOptionalPhone(value: string) {
  if (!value.trim()) {
    return "";
  }

  if (cleanPhoneDigits(value).length !== 10) {
    return "Phone number must be exactly 10 digits.";
  }

  return "";
}

export default function RequestDemoPage() {
  const [formState, setFormState] = useState<DemoFormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof DemoFormState, value: string) {
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
      validateRequiredEmail(formState.workEmail, "Work email"),
      validateOptionalPhone(formState.phone),
      validateRequiredText(formState.organizationName, "Organization name"),
      validateRequiredText(formState.roleTitle, "Role or job title"),
      validateRequiredText(formState.organizationType, "Organization type"),
      validateRequiredText(formState.teamSize, "Team size"),
      validateRequiredText(formState.primaryNeed, "Primary need"),
      validateRequiredText(formState.timeline, "Timeline"),
      validateRequiredText(formState.preferredContact, "Preferred contact method"),
      validateRequiredText(formState.message, "Demo notes"),
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

    const { error } = await supabase.from("demo_requests").insert({
      first_name: formState.firstName.trim(),
      last_name: formState.lastName.trim(),
      work_email: formState.workEmail.trim(),
      phone: formState.phone.trim() ? cleanPhoneDigits(formState.phone) : null,
      organization_name: formState.organizationName.trim(),
      role_title: formState.roleTitle.trim(),
      organization_type: formState.organizationType,
      team_size: formState.teamSize,
      primary_need: formState.primaryNeed,
      timeline: formState.timeline,
      preferred_contact: formState.preferredContact,
      message: formState.message.trim(),
      source: "CivicFlow Website",
      status: "New",
    });

    if (error) {
      setSubmitting(false);
      setFormError(error.message);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
    setFormState(defaultFormState);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] text-slate-950">
      <MarketingHeader />

      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 py-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:py-16">
        <aside className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20 lg:sticky lg:top-32">
          <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-blue-100">
            Personalized Platform Walkthrough
          </p>

          <h1 className="mt-8 text-5xl font-black leading-[1.05] tracking-tight text-white xl:text-6xl">
            See how CivicFlow can strengthen your operations.
          </h1>

          <p className="mt-6 text-base leading-8 text-slate-300">
            Request a tailored demo built around your organization’s intake
            process, case workflow, document review needs, staff follow-ups, and
            reporting responsibilities.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              "Walk through public intake and staff review.",
              "Map CivicFlow to your current workflow.",
              "Review documents, notes, follow-ups, reports, and exports.",
              "Discuss implementation, pricing, and deployment options.",
            ].map((item) => (
              <div key={item} className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm font-bold leading-7 text-blue-50">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-2xl border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            ← Back to website
          </Link>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 shadow-2xl shadow-slate-200/70 backdrop-blur">
          {submitted ? (
            <div className="p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-600">
                Request Received
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Your demo request has been submitted.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Westforge now has your CivicFlow demo request. The next step is
                to review your organization’s workflow needs and prepare a
                focused walkthrough.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
                >
                  Submit another request
                </button>

                <Link
                  href="/"
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Back to website
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="border-b border-slate-100 p-8">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
                  Organization Information
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                  Tell us about your workflow needs.
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Fields marked with an asterisk are required.
                </p>
              </div>

              <div className="p-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-xl font-black text-slate-950">
                    Contact details
                  </h3>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="input-label">
                      First name *
                      <input
                        required
                        value={formState.firstName}
                        onChange={(event) =>
                          updateField("firstName", event.target.value)
                        }
                        placeholder="First name"
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
                        placeholder="Last name"
                        className="input-field"
                      />
                    </label>

                    <label className="input-label">
                      Work email *
                      <input
                        type="email"
                        required
                        value={formState.workEmail}
                        onChange={(event) =>
                          updateField("workEmail", event.target.value)
                        }
                        placeholder="name@organization.org"
                        className="input-field"
                      />
                    </label>

                    <label className="input-label">
                      Phone number
                      <input
                        inputMode="numeric"
                        value={formState.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        placeholder="301-555-0123"
                        className="input-field"
                      />
                    </label>

                    <label className="input-label">
                      Role or job title *
                      <input
                        required
                        value={formState.roleTitle}
                        onChange={(event) =>
                          updateField("roleTitle", event.target.value)
                        }
                        placeholder="Program Manager"
                        className="input-field"
                      />
                    </label>

                    <label className="input-label">
                      Preferred contact method *
                      <select
                        required
                        value={formState.preferredContact}
                        onChange={(event) =>
                          updateField("preferredContact", event.target.value)
                        }
                        className="input-field"
                      >
                        <option>Email</option>
                        <option>Phone</option>
                        <option>Either email or phone</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-6 border-b border-slate-100 pb-6">
                  <h3 className="text-xl font-black text-slate-950">
                    Organization details
                  </h3>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="input-label">
                      Organization name *
                      <input
                        required
                        value={formState.organizationName}
                        onChange={(event) =>
                          updateField("organizationName", event.target.value)
                        }
                        placeholder="Organization name"
                        className="input-field"
                      />
                    </label>

                    <label className="input-label">
                      Organization type *
                      <select
                        required
                        value={formState.organizationType}
                        onChange={(event) =>
                          updateField("organizationType", event.target.value)
                        }
                        className="input-field"
                      >
                        <option>Government agency</option>
                        <option>County or municipal department</option>
                        <option>Nonprofit organization</option>
                        <option>Community service provider</option>
                        <option>Consulting or implementation partner</option>
                        <option>Other</option>
                      </select>
                    </label>

                    <label className="input-label">
                      Team size *
                      <select
                        required
                        value={formState.teamSize}
                        onChange={(event) =>
                          updateField("teamSize", event.target.value)
                        }
                        className="input-field"
                      >
                        <option>1-10 staff</option>
                        <option>11-25 staff</option>
                        <option>26-50 staff</option>
                        <option>51-100 staff</option>
                        <option>100+ staff</option>
                      </select>
                    </label>

                    <label className="input-label">
                      Timeline *
                      <select
                        required
                        value={formState.timeline}
                        onChange={(event) =>
                          updateField("timeline", event.target.value)
                        }
                        className="input-field"
                      >
                        <option>Exploring options</option>
                        <option>Need something within 30 days</option>
                        <option>Need something within 60-90 days</option>
                        <option>Planning for next quarter</option>
                        <option>Procurement or RFP research</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-black text-slate-950">
                    Workflow needs
                  </h3>

                  <div className="mt-5 grid gap-5">
                    <label className="input-label">
                      Primary need *
                      <select
                        required
                        value={formState.primaryNeed}
                        onChange={(event) =>
                          updateField("primaryNeed", event.target.value)
                        }
                        className="input-field"
                      >
                        <option>Intake and case management</option>
                        <option>Document tracking and review</option>
                        <option>Reporting dashboard and Excel exports</option>
                        <option>Follow-up and staff accountability</option>
                        <option>Custom workflow system</option>
                        <option>Replacing spreadsheets or manual tracking</option>
                      </select>
                    </label>

                    <label className="input-label">
                      Demo notes *
                      <textarea
                        required
                        value={formState.message}
                        onChange={(event) =>
                          updateField("message", event.target.value)
                        }
                        rows={6}
                        placeholder="Tell us what your team currently tracks, where the workflow breaks down, and what you would like to see during the demo."
                        className="input-field resize-y leading-7"
                      />
                    </label>
                  </div>
                </div>

                {formError ? (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
                    {formError}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-2xl text-sm leading-6 text-slate-500">
                    Your request will be saved for Westforge review and demo
                    follow-up.
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
                    {submitting ? "Submitting request..." : "Request demo"}
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