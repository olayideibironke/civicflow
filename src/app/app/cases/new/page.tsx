"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

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

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [formState, setFormState] = useState<CaseFormState>(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadOrganization() {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("slug", "community-services")
        .single();

      if (error || !data) {
        setLoadError(
          error?.message ?? "Unable to load the demo organization."
        );
        return;
      }

      setOrganization(data as Organization);
    }

    loadOrganization();
  }, []);

  function updateField(field: keyof CaseFormState, value: string) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));

    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organization) {
      setFormError("Organization is not ready yet.");
      return;
    }

    if (!formState.firstName.trim() || !formState.lastName.trim()) {
      setFormError("Client first name and last name are required.");
      return;
    }

    if (!formState.summary.trim()) {
      setFormError("Case summary is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    const { data: existingCases, error: existingCasesError } = await supabase
      .from("cases")
      .select("case_number")
      .eq("organization_id", organization.id);

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
        organization_id: organization.id,
        case_number: nextCaseNumber,
        client_first_name: formState.firstName.trim(),
        client_last_name: formState.lastName.trim(),
        client_email: formState.email.trim() || null,
        client_phone: formState.phone.trim() || null,
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
      setFormError(
        createCaseError?.message ?? "Unable to create the case."
      );
      return;
    }

    const documentRows = defaultDocuments.map((document) => ({
      case_id: createdCase.id,
      organization_id: organization.id,
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
        organization_id: organization.id,
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
                Create a real Supabase case record when staff receives a request
                by phone, email, walk-in, referral, or another internal channel.
              </p>
            </div>

            <div className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
              Supabase connected
            </div>
          </div>

          {loadError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
              {loadError}
            </div>
          ) : null}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <form onSubmit={handleSubmit} className="premium-card">
            <div className="border-b border-slate-100 pb-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Case Details
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Client and service information
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Submitting this form now creates a real case, document checklist,
                and activity event in Supabase.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="input-label">
                First name
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
                Last name
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
                Email address
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="angela@example.org"
                  className="input-field"
                />
              </label>

              <label className="input-label">
                Phone number
                <input
                  value={formState.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(555) 123-4567"
                  className="input-field"
                />
              </label>

              <label className="input-label">
                Service category
                <select
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
                Priority
                <select
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
                Initial status
                <select
                  value={formState.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="input-field"
                >
                  <option>New Intake</option>
                  <option>In Review</option>
                  <option>Assigned</option>
                  <option>Waiting on Client</option>
                </select>
              </label>

              <label className="input-label">
                Assigned staff
                <select
                  value={formState.assignedTo}
                  onChange={(event) =>
                    updateField("assignedTo", event.target.value)
                  }
                  className="input-field"
                >
                  <option>Unassigned</option>
                  <option>Maya Johnson</option>
                  <option>Daniel Reeves</option>
                  <option>Aisha Carter</option>
                  <option>Eligibility Review Team</option>
                </select>
              </label>
            </div>

            <label className="input-label mt-6">
              Case summary
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
                Default checklist will be created
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                CivicFlow will automatically create required document checklist
                items for this new case.
              </p>
            </div>

            {formError ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
                {formError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                After creation, you’ll return to the case queue and see the new
                Supabase record.
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
                Workflow Purpose
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Internal cases now become real records.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                This is the first true staff-side creation workflow. It writes to
                the cases, case_documents, and case_activity tables.
              </p>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Creation Checklist
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Required before review
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  "Client contact information",
                  "Service category",
                  "Priority level",
                  "Initial case summary",
                  "Assigned staff or queue",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-sm font-black text-slate-950">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}