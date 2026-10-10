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

type ConflictMatch = {
  source_type: string;
  case_id: string;
  case_number: string;
  matched_name: string;
  party_role: string;
  matched_email: string | null;
  match_reason: string;
  score: number;
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
  serviceCategory: "General Legal Matter",
  priority: "Medium",
  status: "New Intake",
  assignedTo: "Unassigned",
  summary: "",
};

const defaultDocuments = [
  {
    name: "Photo identification",
    description: "Government-issued ID or equivalent identity document.",
    status: "Missing",
  },
  {
    name: "Engagement agreement",
    description: "Signed representation or engagement agreement, when applicable.",
    status: "Missing",
  },
  {
    name: "Client intake form",
    description: "Signed client intake questionnaire or initial matter information form.",
    status: "Missing",
  },
  {
    name: "Supporting records",
    description: "Court filings, correspondence, evidence, or other records relevant to the matter.",
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
  const [conflictMatches, setConflictMatches] = useState<ConflictMatch[]>([]);
  const [conflictChecked, setConflictChecked] = useState(false);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

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

    if (field === "firstName" || field === "lastName" || field === "email") {
      setConflictChecked(false);
      setConflictAcknowledged(false);
      setConflictMatches([]);
      setConflictMessage("");
    }

    setFormError("");
  }

  async function handleConflictCheck() {
    const clientName = `${formState.firstName.trim()} ${formState.lastName.trim()}`.trim();
    const clientEmail = formState.email.trim();
    const queries = Array.from(
      new Set([clientName, clientEmail].filter((value) => value.length >= 2))
    );

    if (!queries.length) {
      setConflictMessage("Enter the prospective client's name or email before running a conflict check.");
      return;
    }

    setCheckingConflicts(true);
    setConflictMessage("");
    setConflictAcknowledged(false);

    const collected: ConflictMatch[] = [];

    for (const query of queries) {
      const { data, error } = await supabase.rpc("search_conflicts", {
        p_query: query,
      });

      if (error) {
        setCheckingConflicts(false);
        setConflictChecked(false);
        setConflictMessage(error.message);
        return;
      }

      collected.push(...((data ?? []) as ConflictMatch[]));
    }

    const uniqueMatches = Array.from(
      new Map(
        collected.map((match) => [
          `${match.source_type}:${match.case_id}:${match.matched_name}:${match.party_role}`,
          match,
        ])
      ).values()
    ).sort((left, right) => right.score - left.score);

    setConflictMatches(uniqueMatches);
    setConflictChecked(true);
    setCheckingConflicts(false);
    setConflictMessage(
      uniqueMatches.length
        ? "Potential firm records matched this prospective client. Review them before creating the matter."
        : "No potential matches were found for the prospective client's name or email."
    );
  }

  function validateForm() {
    return getFirstValidationError([
      validateRequiredText(formState.firstName, "First name"),
      validateRequiredText(formState.lastName, "Last name"),
      validateRequiredEmail(formState.email),
      validateRequiredPhone(formState.phone),
      validateRequiredText(formState.serviceCategory, "Matter type"),
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

    if (!conflictChecked) {
      setFormError("Run the preliminary conflict check before creating this matter.");
      return;
    }

    if (conflictMatches.length > 0 && !conflictAcknowledged) {
      setFormError("Review and acknowledge the potential conflict matches before continuing.");
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
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                  ← Back to cases
                </Link>
              </div>

              <p className="eyebrow">Staff Case Creation</p>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Create new case
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Create a legal matter under the signed-in firm workspace and assign an attorney or staff owner.
              </p>
            </div>

            <div className="w-fit chip border-emerald-200 bg-emerald-50 text-emerald-700">
              Firm workspace
            </div>
          </div>

          {loadError ? (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {loadError}
            </div>
          ) : null}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <form onSubmit={handleSubmit} noValidate className="premium-card">
            <div className="border-b border-slate-100 pb-6">
              <p className="eyebrow">Case Details</p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                Client and matter information
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Required fields, valid email, and a 10-digit phone number must be provided before staff can create a case.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="input-label">
                First name *
                <input required value={formState.firstName} onChange={(event) => updateField("firstName", event.target.value)} placeholder="Angela" className="input-field" />
              </label>

              <label className="input-label">
                Last name *
                <input required value={formState.lastName} onChange={(event) => updateField("lastName", event.target.value)} placeholder="Brooks" className="input-field" />
              </label>

              <label className="input-label">
                Email address *
                <input type="email" required value={formState.email} onChange={(event) => updateField("email", event.target.value)} placeholder="angela@example.org" className="input-field" />
              </label>

              <label className="input-label">
                Phone number *
                <input required inputMode="numeric" value={formState.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="202-555-0198" className="input-field" />
              </label>

              <label className="input-label">
                Matter type *
                <select required value={formState.serviceCategory} onChange={(event) => updateField("serviceCategory", event.target.value)} className="input-field">
                  <option>Criminal Defense</option>
                  <option>Family Law</option>
                  <option>Immigration</option>
                  <option>Civil Litigation</option>
                  <option>General Legal Matter</option>
                </select>
              </label>

              <label className="input-label">
                Priority *
                <select required value={formState.priority} onChange={(event) => updateField("priority", event.target.value)} className="input-field">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </label>

              <label className="input-label">
                Initial status *
                <select required value={formState.status} onChange={(event) => updateField("status", event.target.value)} className="input-field">
                  <option>New Intake</option>
                  <option>In Review</option>
                  <option>Assigned</option>
                  <option>Waiting on Client</option>
                </select>
              </label>

              <label className="input-label">
                Assigned staff *
                <input required value={formState.assignedTo} onChange={(event) => updateField("assignedTo", event.target.value)} placeholder="Assigned attorney or staff member" className="input-field" />
              </label>
            </div>

            <label className="input-label mt-6">
              Case summary *
              <textarea required value={formState.summary} onChange={(event) => updateField("summary", event.target.value)} rows={6} placeholder="Describe the legal issue, known documents, court dates or deadlines, and next action." className="input-field resize-y leading-7" />
            </label>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="eyebrow">Preliminary conflict check</p>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">
                    Search firm records before creating this matter
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    CivicFlow checks the prospective client&apos;s name and email against existing clients, parties, organizations, and aliases. A match is a review signal, not a legal determination.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConflictCheck}
                  disabled={checkingConflicts}
                  className="btn btn-secondary shrink-0"
                >
                  {checkingConflicts ? "Checking..." : conflictChecked ? "Run again" : "Run conflict check"}
                </button>
              </div>

              {conflictMessage ? (
                <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                  conflictChecked && conflictMatches.length === 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : conflictMatches.length > 0
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-white text-slate-700"
                }`}>
                  {conflictMessage}
                </div>
              ) : null}

              {conflictMatches.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {conflictMatches.slice(0, 6).map((match, index) => (
                    <div
                      key={`${match.source_type}-${match.case_id}-${match.matched_name}-${index}`}
                      className={`rounded-xl border p-4 ${
                        match.score >= 90
                          ? "border-rose-200 bg-rose-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-950">{match.matched_name}</span>
                            <span className="chip bg-white/80 text-slate-700">{match.party_role}</span>
                            <span className="chip bg-white/80 text-slate-700">
                              {match.score >= 90 ? "Strong record match" : "Possible record match"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">
                            {match.match_reason}
                            {match.matched_email ? ` · ${match.matched_email}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Matter {match.case_number}</p>
                        </div>
                        <Link
                          href={`/app/cases/${encodeURIComponent(match.case_number)}`}
                          target="_blank"
                          className="btn btn-secondary"
                        >
                          Review matter
                        </Link>
                      </div>
                    </div>
                  ))}

                  <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={conflictAcknowledged}
                      onChange={(event) => {
                        setConflictAcknowledged(event.target.checked);
                        setFormError("");
                      }}
                    />
                    <span>
                      I reviewed the potential matches shown above and want to continue creating this matter.
                    </span>
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Firm workspace</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This case will be created under <span className="font-semibold text-slate-900">{workspace?.organization.name ?? "your firm"}</span>.
              </p>
            </div>

            {formError ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{formError}</div>
            ) : null}

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                After the preliminary conflict review, the matter appears in the firm’s case queue with the standard document checklist.
              </p>

              <button type="submit" disabled={saving || Boolean(loadError)} className="btn btn-primary px-6 py-3">
                {saving ? "Creating case..." : "Create case"}
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Firm Workspace</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">{workspace?.organization.name ?? "Loading workspace"}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Cases created here are scoped to the signed-in firm and the authenticated staff profile.
              </p>
            </div>

            <div className="premium-card">
              <p className="eyebrow">Staff Profile</p>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{workspace ? getStaffDisplayName(workspace) : "Loading staff"}</h2>

              <div className="mt-6 space-y-3">
                <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">Email</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{workspace?.email ?? "Loading"}</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">Firm</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{workspace?.organization.name ?? "Loading"}</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">Access</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Firm-scoped case creation</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
