"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Organization = {
  id: string;
  name: string;
  slug: string;
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

const defaultFormState: IntakeFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  serviceCategory: "Eligibility Review",
  priority: "Standard",
  details: "",
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

function mapIntakePriorityToCasePriority(priority: string) {
  if (priority === "Urgent") {
    return "Urgent";
  }

  if (priority === "Medium") {
    return "Medium";
  }

  return "Low";
}

export default function IntakePage() {
  const router = useRouter();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [formState, setFormState] = useState<IntakeFormState>(defaultFormState);
  const [loadingOrganization, setLoadingOrganization] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadOrganization() {
      setLoadingOrganization(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("slug", "community-services")
        .single();

      if (error || !data) {
        setLoadError(
          error?.message ?? "Unable to load the public intake workspace."
        );
        setLoadingOrganization(false);
        return;
      }

      setOrganization(data as Organization);
      setLoadingOrganization(false);
    }

    loadOrganization();
  }, []);

  function updateField(field: keyof IntakeFormState, value: string) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));

    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organization) {
      setFormError("Public intake workspace is not ready yet.");
      return;
    }

    if (!formState.firstName.trim() || !formState.lastName.trim()) {
      setFormError("First name and last name are required.");
      return;
    }

    if (!formState.details.trim()) {
      setFormError("Request details are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const { data: existingCases, error: existingCasesError } = await supabase
      .from("cases")
      .select("case_number")
      .eq("organization_id", organization.id);

    if (existingCasesError) {
      setSubmitting(false);
      setFormError(existingCasesError.message);
      return;
    }

    const nextCaseNumber = getNextCaseNumber(
      (existingCases ?? []).map((caseItem) => caseItem.case_number)
    );

    const { data: intakeSubmission, error: intakeError } = await supabase
      .from("intake_submissions")
      .insert({
        organization_id: organization.id,
        first_name: formState.firstName.trim(),
        last_name: formState.lastName.trim(),
        email: formState.email.trim() || null,
        phone: formState.phone.trim() || null,
        service_category: formState.serviceCategory,
        priority: formState.priority,
        details: formState.details.trim(),
      })
      .select("*")
      .single();

    if (intakeError || !intakeSubmission) {
      setSubmitting(false);
      setFormError(intakeError?.message ?? "Unable to submit intake request.");
      return;
    }

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
        priority: mapIntakePriorityToCasePriority(formState.priority),
        status: "New Intake",
        assigned_to: "Unassigned",
        summary: formState.details.trim(),
        source: "Public Intake",
      })
      .select("*")
      .single();

    if (createCaseError || !createdCase) {
      setSubmitting(false);
      setFormError(createCaseError?.message ?? "Unable to create case.");
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
      setSubmitting(false);
      setFormError(documentsError.message);
      return;
    }

    const { error: activityError } = await supabase.from("case_activity").insert({
      case_id: createdCase.id,
      organization_id: organization.id,
      title: "Case created from public intake",
      detail: `Public intake submission created ${nextCaseNumber} for ${formState.firstName.trim()} ${formState.lastName.trim()}.`,
      created_by: "Public Intake",
    });

    if (activityError) {
      setSubmitting(false);
      setFormError(activityError.message);
      return;
    }

    const { error: updateIntakeError } = await supabase
      .from("intake_submissions")
      .update({
        converted_case_id: createdCase.id,
      })
      .eq("id", intakeSubmission.id);

    if (updateIntakeError) {
      setSubmitting(false);
      setFormError(updateIntakeError.message);
      return;
    }

    router.push(
      `/intake/success?case=${encodeURIComponent(
        nextCaseNumber
      )}&client=${encodeURIComponent(
        `${formState.firstName.trim()} ${formState.lastName.trim()}`
      )}`
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
            CivicFlow now turns public intake submissions into real Supabase
            case records for staff review.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-base font-black text-white">
                Secure intake experience
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Designed for organizations that need professional intake before
                staff review.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-base font-black text-white">
                Staff-ready case creation
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Submissions create a case, document checklist, and activity log
                in the CivicFlow workspace.
              </p>
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="premium-card">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Client Information
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Tell us who needs assistance
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This public form now saves intake submissions and creates real
                cases for staff review.
              </p>
            </div>

            <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
              Supabase connected
            </span>
          </div>

          {loadError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
              {loadError}
            </div>
          ) : null}

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
                <option>Standard</option>
                <option>Medium</option>
                <option>Urgent</option>
              </select>
            </label>
          </div>

          <label className="input-label mt-6">
            Request details
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
              disabled={submitting || loadingOrganization || Boolean(loadError)}
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