"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  getStaffDisplayName,
  loadStaffWorkspace,
  type StaffWorkspace,
} from "@/lib/workspace";
import { supabase } from "@/lib/supabase";
import {
  cleanPhoneDigits,
  formatPhoneInput,
  getFirstValidationError,
  validateRequiredEmail,
  validateRequiredPhone,
  validateRequiredText,
} from "@/lib/validation";

type CaseFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceCategory: string;
  priority: string;
  status: string;
  assignedTo: string;
  summary: string;
};

const defaultFormState: CaseFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  serviceCategory: "Eligibility Review",
  priority: "Medium",
  status: "New Intake",
  assignedTo: "Unassigned",
  summary: "",
};

const defaultDocuments = [
  {
    name: "Photo identification",
    description: "Government-issued ID or equivalent verification document.",
    status: "Missing",
  },
  {
    name: "Proof of address",
    description: "Utility bill, lease, official mail, or another address record.",
    status: "Missing",
  },
  {
    name: "Program eligibility form",
    description: "Signed client intake or eligibility questionnaire.",
    status: "Missing",
  },
  {
    name: "Supporting records",
    description: "Additional records requested by the assigned staff member.",
    status: "Missing",
  },
];

function getNextCaseNumber(existingCaseNumbers: string[]) {
  const highestNumber = existingCaseNumbers.reduce((highest, caseNumber) => {
    const match = caseNumber.match(/CF-(\d+)/i);
    const numericValue = match ? Number(match[1]) : 0;

    return numericValue > highest ? numericValue : highest;
  }, 1000);

  return `CF-${String(highestNumber + 1).padStart(4, "0")}`;
}

export default function NewCasePage() {
  const router = useRouter();

  const [workspace, setWorkspace] = useState<StaffWorkspace | null>(null);
  const [formState, setFormState] = useState<CaseFormState>(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadWorkspace() {
      const result = await loadStaffWorkspace();

      if (result.error || !result.workspace) {
        setLoadError(result.error || "Unable to load staff workspace.");
        return;
      }

      const staffName = getStaffDisplayName(result.workspace);

      setWorkspace(result.workspace);
      setFormState((currentState) => ({
        ...currentState,
        assignedTo: staffName,
      }));
    }

    loadWorkspace();
  }, []);

  function updateField(field: keyof CaseFormState, value: string) {
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
      validateRequiredText(formState.status, "Initial status"),
      validateRequiredText(formState.assignedTo, "Assigned staff"),
      validateRequiredText(formState.summary, "Case summary"),
    ]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace) {
      setFormError("Staff workspace is not ready yet.");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");

    const { data: existingCases, error: existingCasesError } = await supabase
      .from("cases")
      .select("case_number")
      .eq("organization_id", workspace.organization.id);

    if (existingCasesError) {
      setSaving(false);
      setFormError(existingCasesError.message);
      return;
    }

    const nextCaseNumber = getNextCaseNumber(
      (existingCases ?? []).map((caseItem) => caseItem.case_number)
    );

    const { data: createdCase, error: createCaseError } = await supabase
      .from("cases")
      .insert({
        organization_id: workspace.organization.id,
        case_number: nextCaseNumber,
        client_first_name: formState.firstName.trim(),
        client_last_name: formState.lastName.trim(),
        client_email: formState.email.trim(),
        client_phone: cleanPhoneDigits(formState.phone),
        service_category: formState.serviceCategory,
        priority: formState.priority,
        status: formState.status,
        assigned_to: formState.assignedTo,
        summary: formState.summary.trim(),
        source: "Staff Created",
      })
      .select("*")
      .single();

    if (createCaseError || !createdCase) {
      setSaving(false);
      setFormError(createCaseError?.message ?? "Unable to create the case.");
      return;
    }

    const documentRows = defaultDocuments.map((document) => ({
      case_id: createdCase.id,
      organization_id: workspace.organization.id,
      name: document.name,
      description: document.description,
      status: document.status,
    }));

    const { error: documentsError } = await supabase
      .from("case_documents")
      .insert(documentRows);

    if (documentsError) {
      setSaving(false);
      setFormError(documentsError.message);
      return;
    }

    const { error: activityError } = await supabase
      .from("case_activity")
      .insert({
        case_id: createdCase.id,
        organization_id: workspace.organization.id,
        title: "Case created",
        detail: `Staff created ${nextCaseNumber} for ${formState.firstName.trim()} ${formState.lastName.trim()}.`,
        created_by: formState.assignedTo,
      });

    if (activityError) {
      setSaving(false);
      setFormError(activityError.message);
      return;
    }

    router.push("/app/cases");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-4">
                <Link
                  href="/app/cases"
                  className="text-sm font-black text-slate-500 transition hover:text-slate-950"
                >
                  ← Back to cases
                </Link>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Staff Case Creation
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Create new case
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Staff-created cases are now tied to the signed-in staff member’s
                organization profile.
              </p>
            </div>

            <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
              Workspace aware
            </div>
          </div>

          {loadError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
              {loadError}
            </div>
          ) : null}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <form onSubmit={handleSubmit} noValidate className="premium-card">
            <div className="border-b border-slate-100 pb-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Case Details
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Client and service information
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Required fields, valid email, and a 10-digit phone number must
                be provided before staff can create a case.
              </p>
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
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </label>

              <label className="input-label">
                Initial status *
                <select
                  required
                  value={formState.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                  className="input-field"
                >
                  <option>New Intake</option>
                  <option>In Review</option>
                  <option>Assigned</option>
                  <option>Waiting on Client</option>
                </select>
              </label>

              <label className="input-label">
                Assigned staff *
                <input
                  required
                  value={formState.assignedTo}
                  onChange={(event) =>
                    updateField("assignedTo", event.target.value)
                  }
                  placeholder="Assigned staff or queue"
                  className="input-field"
                />
              </label>
            </div>

            <label className="input-label mt-6">
              Case summary *
              <textarea
                required
                value={formState.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                rows={6}
                placeholder="Describe the client need, known documents, deadlines, and next action."
                className="input-field resize-y leading-7"
              />
            </label>

            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-black text-slate-950">
                Workspace connection
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                This case will be created under{" "}
                <span className="font-black text-slate-950">
                  {workspace?.organization.name ?? "your organization"}
                </span>
                .
              </p>
            </div>

            {formError ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
                {formError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                After creation, the new validated case appears in the staff case
                queue for this workspace.
              </p>

              <button
                type="submit"
                disabled={saving || Boolean(loadError)}
                className={`rounded-2xl px-6 py-3 text-sm font-black shadow-lg transition ${
                  saving
                    ? "bg-slate-300 text-slate-600 shadow-none"
                    : "bg-slate-950 text-white shadow-slate-950/15 hover:bg-slate-800"
                } disabled:cursor-not-allowed`}
              >
                {saving ? "Creating case..." : "Create case"}
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Staff Workspace
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                {workspace?.organization.name ?? "Loading workspace"}
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Staff-created cases now use the signed-in staff profile instead
                of a hardcoded demo organization.
              </p>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Staff Profile
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                {workspace ? getStaffDisplayName(workspace) : "Loading staff"}
              </h2>

              <div className="mt-6 space-y-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    {workspace?.email ?? "Loading"}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Organization
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    {workspace?.organization.name ?? "Loading"}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Access
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    Organization-scoped case creation
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}