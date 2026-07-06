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

type PublicIntakeFormProps = {
  organizationSlug?: string;
};

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
    <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center rounded-xl transition hover:opacity-90"
          aria-label="CivicFlow home"
        >
          <CivicFlowLogo size="md" />
        </Link>

        <Link href="/" className="btn btn-secondary">
          Back home
        </Link>
      </div>
    </header>
  );
}

export default function PublicIntakeForm({
  organizationSlug,
}: PublicIntakeFormProps) {
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

      const { data, error } = await supabase.rpc("get_public_intake_settings", {
        p_slug: organizationSlug ?? null,
      });

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
  }, [organizationSlug]);

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

    const { data, error } = await supabase.rpc("submit_public_intake_for_org", {
      p_organization_slug: settings.organization_slug,
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
      <main className="min-h-screen">
        <IntakeHeader />

        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center px-6 py-10">
          <div className="premium-card w-full text-center animate-fade-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>

            <p className="eyebrow mt-6">Public Intake</p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Loading intake settings…
            </h1>

            <p className="mt-2.5 text-sm leading-6 text-slate-500">
              CivicFlow is preparing this workspace intake form.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (settingsError) {
    return (
      <main className="min-h-screen">
        <IntakeHeader />

        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center px-6 py-10">
          <div className="premium-card w-full animate-fade-up">
            <p className="eyebrow text-rose-500">Intake Settings Error</p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Public intake could not be loaded.
            </h1>

            <p className="mt-2.5 text-sm leading-6 text-slate-500">
              {settingsError}
            </p>

            <Link href="/" className="btn btn-primary mt-6">
              Back home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="min-h-screen">
        <IntakeHeader />

        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center px-6 py-10">
          <div className="premium-card w-full animate-fade-up">
            <p className="eyebrow text-rose-500">Intake Settings Missing</p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Public intake settings are unavailable.
            </h1>

            <p className="mt-2.5 text-sm leading-6 text-slate-500">
              CivicFlow could not find an organization configuration for this
              public intake form.
            </p>

            <Link href="/" className="btn btn-primary mt-6">
              Back home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!settings.public_intake_enabled) {
    return (
      <main className="min-h-screen">
        <IntakeHeader />

        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center px-6 py-10">
          <div className="premium-card w-full animate-fade-up">
            <p className="eyebrow text-amber-600">Intake Closed</p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Public intake is currently closed.
            </h1>

            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-500">
              {settings.organization_name} is not accepting new public intake
              submissions through this form right now.
            </p>

            {settings.support_email ? (
              <p className="mt-4 text-sm font-medium text-slate-500">
                Support contact: {settings.support_email}
              </p>
            ) : null}

            <Link href="/" className="btn btn-primary mt-6">
              Back home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <IntakeHeader />

      <section className="mx-auto grid max-w-[1440px] gap-6 px-6 py-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:py-10">
        <aside className="premium-dark animate-fade-up self-start lg:sticky lg:top-8 lg:!p-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
            Public Intake
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white">
            Submit a service request.
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            This intake form is configured for {settings.organization_name}.
            Complete client information is required before a request can become
            a CivicFlow case.
          </p>

          <div className="mt-7 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm font-semibold text-white">
                Organization-specific intake
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                This link uses the saved settings for{" "}
                {settings.organization_slug}.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm font-semibold text-white">
                Staff-ready case creation
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                Valid submissions create a case, document checklist, and
                activity log in the correct CivicFlow workspace.
              </p>
            </div>

            {settings.support_email ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-sm font-semibold text-white">
                  Support contact
                </p>
                <p className="mt-1.5 break-words text-xs leading-5 text-slate-300">
                  {settings.support_email}
                </p>
              </div>
            ) : null}
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="premium-card animate-fade-up"
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="eyebrow">Client Information</p>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900">
                Tell us who needs assistance
              </h2>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600">
                All required fields must be completed before the intake can be
                submitted.
              </p>
            </div>

            <span className="chip w-fit border-emerald-200 bg-emerald-50 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
                onChange={(event) => updateField("lastName", event.target.value)}
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
                onChange={(event) => updateField("priority", event.target.value)}
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

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">
              Default case checklist
            </p>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              CivicFlow will create required document checklist items for the
              staff review team.
            </p>
          </div>

          {formError ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {formError}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              By submitting, the request becomes a real CivicFlow case for staff
              review.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary px-6 py-3"
            >
              {submitting ? "Submitting intake…" : "Submit intake"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}