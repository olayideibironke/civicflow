"use client";

import { useEffect, useState, type FormEvent } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import {
  getFirstValidationError,
  isValidEmail,
  validateRequiredEmail,
  validateRequiredText,
} from "@/lib/validation";
import { loadStaffWorkspace } from "@/lib/workspace";

type OrganizationSettings = {
  id: string;
  name: string;
  slug: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  support_email: string | null;
  public_intake_enabled: boolean | null;
  default_service_categories: string[] | null;
  default_priority_options: string[] | null;
  branding_notes: string | null;
  updated_at: string | null;
};

type SettingsFormState = {
  name: string;
  primaryContactName: string;
  primaryContactEmail: string;
  supportEmail: string;
  publicIntakeEnabled: boolean;
  serviceCategoriesText: string;
  priorityOptionsText: string;
  brandingNotes: string;
};

const defaultFormState: SettingsFormState = {
  name: "",
  primaryContactName: "",
  primaryContactEmail: "",
  supportEmail: "",
  publicIntakeEnabled: true,
  serviceCategoriesText: "",
  priorityOptionsText: "",
  brandingNotes: "",
};

function listToText(value: string[] | null | undefined) {
  return (value ?? []).join("\n");
}

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function validateOptionalEmail(value: string, label: string) {
  if (!value.trim()) {
    return "";
  }

  if (!isValidEmail(value)) {
    return `${label} must be a valid email address.`;
  }

  return "";
}

function formFromOrganization(
  organization: OrganizationSettings
): SettingsFormState {
  return {
    name: organization.name ?? "",
    primaryContactName: organization.primary_contact_name ?? "",
    primaryContactEmail: organization.primary_contact_email ?? "",
    supportEmail: organization.support_email ?? "",
    publicIntakeEnabled: organization.public_intake_enabled ?? true,
    serviceCategoriesText: listToText(organization.default_service_categories),
    priorityOptionsText: listToText(organization.default_priority_options),
    brandingNotes: organization.branding_notes ?? "",
  };
}

function StatusCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [siteOrigin, setSiteOrigin] = useState("https://civicflowapp.org");
  const [copyMessage, setCopyMessage] = useState("");
  const [formState, setFormState] =
    useState<SettingsFormState>(defaultFormState);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setLoadError("");

      const workspaceResult = await loadStaffWorkspace();

      if (workspaceResult.error || !workspaceResult.workspace) {
        setLoadError(
          workspaceResult.error || "Unable to load organization workspace."
        );
        setLoading(false);
        return;
      }

      const workspaceOrganizationId =
        workspaceResult.workspace.organization.id;

      const { data, error } = await supabase
        .from("organizations")
        .select(
          "id, name, slug, primary_contact_name, primary_contact_email, support_email, public_intake_enabled, default_service_categories, default_priority_options, branding_notes, updated_at"
        )
        .eq("id", workspaceOrganizationId)
        .single();

      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }

      const organization = data as OrganizationSettings;

      setOrganizationId(organization.id);
      setOrganizationSlug(organization.slug);
      setLastUpdatedAt(organization.updated_at);
      setFormState(formFromOrganization(organization));
      setLoading(false);
    }

    loadSettings();
  }, []);

  const publicIntakeUrl = `${siteOrigin}/intake/${
    organizationSlug || "community-services"
  }`;

  function updateField<K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K]
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));

    setFormError("");
    setSaveMessage("");
    setCopyMessage("");
  }

  function validateForm() {
    return getFirstValidationError([
      validateRequiredText(formState.name, "Organization name"),
      validateRequiredText(formState.primaryContactName, "Primary contact name"),
      validateRequiredEmail(
        formState.primaryContactEmail,
        "Primary contact email"
      ),
      validateOptionalEmail(formState.supportEmail, "Support email"),
      validateRequiredText(
        formState.serviceCategoriesText,
        "Default service categories"
      ),
      validateRequiredText(
        formState.priorityOptionsText,
        "Default priority options"
      ),
    ]);
  }

  async function handleCopyIntakeLink() {
    try {
      await navigator.clipboard.writeText(publicIntakeUrl);
      setCopyMessage("Public intake link copied.");
      window.setTimeout(() => setCopyMessage(""), 2000);
    } catch {
      setCopyMessage("Copy failed. You can manually copy the link.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");
    setSaveMessage("");

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("organizations")
      .update({
        name: formState.name.trim(),
        primary_contact_name: formState.primaryContactName.trim(),
        primary_contact_email: formState.primaryContactEmail.trim(),
        support_email: formState.supportEmail.trim() || null,
        public_intake_enabled: formState.publicIntakeEnabled,
        default_service_categories: textToList(formState.serviceCategoriesText),
        default_priority_options: textToList(formState.priorityOptionsText),
        branding_notes: formState.brandingNotes.trim(),
        updated_at: now,
      })
      .eq("id", organizationId)
      .select(
        "id, name, slug, primary_contact_name, primary_contact_email, support_email, public_intake_enabled, default_service_categories, default_priority_options, branding_notes, updated_at"
      )
      .single();

    if (error) {
      setSaving(false);
      setFormError(error.message);
      return;
    }

    const updatedOrganization = data as OrganizationSettings;

    setOrganizationSlug(updatedOrganization.slug);
    setLastUpdatedAt(updatedOrganization.updated_at);
    setFormState(formFromOrganization(updatedOrganization));
    setSaveMessage("Organization settings saved.");
    setSaving(false);
  }

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="eyebrow">
            Organization Settings
          </p>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Loading workspace settings...
          </h1>
        </section>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="eyebrow text-rose-500">
            Settings Error
          </p>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings could not be loaded.
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-600">
            {loadError}
          </p>
        </section>
      </AppShell>
    );
  }

  const serviceCategoryCount = textToList(formState.serviceCategoriesText).length;
  const priorityOptionCount = textToList(formState.priorityOptionsText).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="eyebrow">
                SaaS Configuration
              </p>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Organization settings
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Manage the workspace identity, public intake link, default
                intake categories, priority options, contact details, and
                implementation notes for this CivicFlow organization.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={publicIntakeUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                Open intake link
              </a>

              <button
                type="button"
                onClick={handleCopyIntakeLink}
                className="btn btn-secondary"
              >
                Copy intake link
              </button>

              <button
                type="submit"
                form="organization-settings-form"
                disabled={saving}
                className={`btn btn-primary`}
              >
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>

          {copyMessage ? (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {copyMessage}
            </div>
          ) : null}

          {saveMessage ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {saveMessage}
            </div>
          ) : null}

          {formError ? (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {formError}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <StatusCard
            label="Workspace"
            value={formState.name || "Unnamed workspace"}
            detail={`Slug: ${organizationSlug || "not set"}`}
          />

          <StatusCard
            label="Public Intake"
            value={formState.publicIntakeEnabled ? "Enabled" : "Disabled"}
            detail="Controls whether this organization accepts public intake."
          />

          <StatusCard
            label="Service Categories"
            value={`${serviceCategoryCount}`}
            detail="Options shown on this organization’s public intake form."
          />

          <StatusCard
            label="Last Updated"
            value={formatDate(lastUpdatedAt)}
            detail="Latest organization settings update."
          />
        </section>

        <form
          id="organization-settings-form"
          onSubmit={handleSubmit}
          noValidate
          className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]"
        >
          <section className="space-y-6">
            <div className="premium-card">
              <div className="border-b border-slate-100 pb-6">
                <p className="eyebrow">
                  Identity
                </p>

                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                  Workspace identity
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  These settings control how this customer workspace is named
                  and who should be contacted for operational questions.
                </p>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <label className="input-label">
                  Organization name *
                  <input
                    required
                    value={formState.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Community Services"
                    className="input-field"
                  />
                </label>

                <label className="input-label">
                  Primary contact name *
                  <input
                    required
                    value={formState.primaryContactName}
                    onChange={(event) =>
                      updateField("primaryContactName", event.target.value)
                    }
                    placeholder="Program Director"
                    className="input-field"
                  />
                </label>

                <label className="input-label">
                  Primary contact email *
                  <input
                    type="email"
                    required
                    value={formState.primaryContactEmail}
                    onChange={(event) =>
                      updateField("primaryContactEmail", event.target.value)
                    }
                    placeholder="director@organization.org"
                    className="input-field"
                  />
                </label>

                <label className="input-label">
                  Support email
                  <input
                    type="email"
                    value={formState.supportEmail}
                    onChange={(event) =>
                      updateField("supportEmail", event.target.value)
                    }
                    placeholder="support@organization.org"
                    className="input-field"
                  />
                </label>
              </div>
            </div>

            <div className="premium-card">
              <div className="border-b border-slate-100 pb-6">
                <p className="eyebrow">
                  Intake Defaults
                </p>

                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                  Public intake configuration
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  These values power the organization-specific public intake
                  link. Put one option per line.
                </p>
              </div>

              <div className="mt-6">
                <label className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <input
                    type="checkbox"
                    checked={formState.publicIntakeEnabled}
                    onChange={(event) =>
                      updateField("publicIntakeEnabled", event.target.checked)
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      Public intake enabled
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      When disabled, this organization’s public intake link will
                      show an intake closed message.
                    </span>
                  </span>
                </label>

                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <label className="input-label">
                    Default service categories *
                    <textarea
                      required
                      value={formState.serviceCategoriesText}
                      onChange={(event) =>
                        updateField("serviceCategoriesText", event.target.value)
                      }
                      rows={8}
                      placeholder="Eligibility Review"
                      className="input-field resize-y leading-7"
                    />
                  </label>

                  <label className="input-label">
                    Default priority options *
                    <textarea
                      required
                      value={formState.priorityOptionsText}
                      onChange={(event) =>
                        updateField("priorityOptionsText", event.target.value)
                      }
                      rows={8}
                      placeholder="Standard"
                      className="input-field resize-y leading-7"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="premium-card">
              <div className="border-b border-slate-100 pb-6">
                <p className="eyebrow">
                  Branding Notes
                </p>

                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                  Implementation notes
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  Use this space to store customer-specific branding,
                  onboarding, implementation, or workflow notes.
                </p>
              </div>

              <label className="input-label mt-6">
                Notes
                <textarea
                  value={formState.brandingNotes}
                  onChange={(event) =>
                    updateField("brandingNotes", event.target.value)
                  }
                  rows={7}
                  placeholder="Example: client wants intake wording to mention resident assistance, document upload instructions, and program-specific contact details."
                  className="input-field resize-y leading-7"
                />
              </label>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="premium-dark">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                Multi-Tenant Intake
              </p>

              <h2 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-white">
                Every customer now gets their own intake link.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-300">
                The public intake URL uses the organization slug, loads that
                organization’s settings, and submits cases into the correct
                workspace.
              </p>
            </section>

            <section className="premium-card">
              <p className="eyebrow">
                Public Intake Link
              </p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                Shareable URL
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                This is the organization-specific intake link for{" "}
                {formState.name || "this workspace"}.
              </p>

              <input
                readOnly
                value={publicIntakeUrl}
                className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              />

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={handleCopyIntakeLink}
                  className="btn btn-primary w-full"
                >
                  Copy link
                </button>

                <a
                  href={publicIntakeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary w-full"
                >
                  Open link
                </a>
              </div>
            </section>

            <section className="premium-card">
              <p className="eyebrow">
                Current Defaults
              </p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                Saved configuration
              </h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Service categories
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {textToList(formState.serviceCategoriesText).map((item) => (
                      <span
                        key={item}
                        className="chip bg-blue-50 text-blue-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Priority options
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {textToList(formState.priorityOptionsText).map((item) => (
                      <span
                        key={item}
                        className="chip bg-slate-100 text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="premium-card">
              <p className="eyebrow">
                Next Scaling Step
              </p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                Team management.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                After this is clean, we build the staff/team layer so each
                organization can manage users instead of manually creating them
                in Supabase.
              </p>
            </section>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}