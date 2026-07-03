"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";
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

type PublicIntakeSettings = {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  public_intake_enabled: boolean;
  service_categories: string[];
  priority_options: string[];
  support_email: string;
};

const fallbackServiceCategories = [
  "Eligibility Review",
  "Document Processing",
  "Benefits Navigation",
  "Referral Request",
  "General Case Support",
];

const fallbackPriorityOptions = ["Standard", "Medium", "Urgent"];

const defaultFormState: IntakeFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  serviceCategory: "",
  priority: "",
  details: "",
};

function normalizeOptions(
  options: string[] | null | undefined,
  fallback: string[]
) {
  const cleanedOptions = (options ?? [])
    .map((option) => option.trim())
    .filter(Boolean);

  return cleanedOptions.length > 0 ? cleanedOptions : fallback;
}

function IntakeHeader() {
  return (
    <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-[1440px] items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center rounded-2xl transition hover:opacity-90"
          aria-label="CivicFlow home"
        >
          <CivicFlowLogo size="md" />
        </Link>

        <Link
          href="/"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back home
        </Link>
      </div>
    </header>
  );
}

export default function IntakePage() {
  const router = useRouter();

  const [formState, setFormState] = useState<IntakeFormState>(defaultFormState);
  const [settings, setSettings] = useState<PublicIntakeSettings | null>(null);
  const [serviceCategories, setServiceCategories] = useState<string[]>(
    fallbackServiceCategories
  );
  const [priorityOptions, setPriorityOptions] =
    useState<string[]>(fallbackPriorityOptions);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPublicIntakeSettings() {
      setLoadingSettings(true);
      setSettingsError("");

      const { data, error } = await supabase.rpc("get_public_intake_settings");

      if (!active) {
        return;
      }

      if (error) {
        setSettingsError(error.message);
        setLoadingSettings(false);
        return;
      }

      const loadedSettings = (data?.[0] ?? null) as PublicIntakeSettings | null;

      if (!loadedSettings) {
        setSettingsError("Public intake settings could not be found.");
        setLoadingSettings(false);
        return;
      }

      const loadedServiceCategories = normalizeOptions(
        loadedSettings.service_categories,
        fallbackServiceCategories
      );

      const loadedPriorityOptions = normalizeOptions(
        loadedSettings.priority_options,
        fallbackPriorityOptions
      );

      setSettings(loadedSettings);
      setServiceCategories(loadedServiceCategories);
      setPriorityOptions(loadedPriorityOptions);
      setFormState((currentState) => ({
        ...currentState,
        serviceCategory:
          currentState.serviceCategory &&
          loadedServiceCategories.includes(currentState.serviceCategory)
            ? currentState.serviceCategory
            : loadedServiceCategories[0],
        priority:
          currentState.priority &&
          loadedPriorityOptions.includes(currentState.priority)
            ? currentState.priority
            : loadedPriorityOptions[0],
      }));
      setLoadingSettings(false);
    }

    loadPublicIntakeSettings();

    return () => {
      active = false;
    };
  }, []);

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

    if (!settings?.public_intake_enabled) {
      setFormError("Public intake is currently closed for this workspace.");
      return;
    }

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

  if (loadingSettings) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)]">
        <IntakeHeader />

        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center px-6 py-10">
          <div className="premium-card w-full text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              Public Intake
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Loading intake settings...
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              CivicFlow is preparing this workspace intake form.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (settingsError) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)]">
        <IntakeHeader />

        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center px-6 py-10">
          <div className="premium-card w-full">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-500">
              Intake Settings Error
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Public intake could not be loaded.
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              {settingsError}
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Back home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)]">
        <IntakeHeader />

        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center px-6 py-10">
          <div className="premium-card w-full">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-500">
              Intake Settings Missing
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Public intake settings are unavailable.
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              CivicFlow could not find an organization configuration for this
              public intake form.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Back home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!settings.public_intake_enabled) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)]">
        <IntakeHeader />

        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center px-6 py-10">
          <div className="premium-card w-full">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-600">
              Intake Closed
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Public intake is currently closed.
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {settings.organization_name} is not accepting new public intake
              submissions through this form right now.
            </p>

            {settings.support_email ? (
              <p className="mt-4 text-sm font-bold text-slate-500">
                Support contact: {settings.support_email}
              </p>
            ) : null}

            <Link
              href="/"
              className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Back home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)]">
      <IntakeHeader />

      <section className="mx-auto grid max-w-[1440px] gap-6 px-6 py-8 lg:grid-cols-[420px_minmax(0,1fr)] lg:py-10">
        <aside className="self-start rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20 lg:sticky lg:top-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
            Public Intake
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
            Submit a service request.
          </h1>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            This intake form is configured for {settings.organization_name}.
            Complete client information is required before a request can become
            a CivicFlow case.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-base font-black text-white">
                Workspace-controlled options
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Service categories and priority options now come from the
                organization settings page.
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

            {settings.support_email ? (
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-base font-black text-white">
                  Support contact
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                  {settings.support_email}
                </p>
              </div>
            ) : null}
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-xl shadow-slate-200/60 backdrop-blur"
        >
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
                {serviceCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
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
                {priorityOptions.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
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