"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type CaseStatus =
  | "New Intake"
  | "In Review"
  | "Assigned"
  | "Waiting on Client"
  | "Completed";

type DocumentStatus = "Received" | "Missing" | "Needs Review";

type CivicCase = {
  id: string;
  organization_id: string;
  case_number: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string | null;
  client_phone: string | null;
  service_category: string;
  priority: string;
  status: string;
  assigned_to: string;
  summary: string | null;
  source: string;
  decision_outcome: string | null;
  decision_note: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CaseDocument = {
  id: string;
  case_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
};

type CaseActivity = {
  id: string;
  case_id: string;
  organization_id: string;
  title: string;
  detail: string;
  created_by: string | null;
  created_at: string;
};

const statusOptions: CaseStatus[] = [
  "New Intake",
  "In Review",
  "Assigned",
  "Waiting on Client",
  "Completed",
];

const statusStyles: Record<CaseStatus, string> = {
  "New Intake": "border-blue-200 bg-blue-50 text-blue-700",
  "In Review": "border-amber-200 bg-amber-50 text-amber-700",
  Assigned: "border-purple-200 bg-purple-50 text-purple-700",
  "Waiting on Client": "border-orange-200 bg-orange-50 text-orange-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const documentStatusStyles: Record<DocumentStatus, string> = {
  Received: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Missing: "border-slate-200 bg-white text-slate-400",
  "Needs Review": "border-amber-200 bg-amber-50 text-amber-700",
};

function normalizeCaseNumber(value: string) {
  return value.trim().toUpperCase();
}

function normalizeStatus(value: string): CaseStatus {
  if (statusOptions.includes(value as CaseStatus)) {
    return value as CaseStatus;
  }

  return "New Intake";
}

function normalizeDocumentStatus(value: string): DocumentStatus {
  if (value === "Received" || value === "Missing" || value === "Needs Review") {
    return value;
  }

  return "Missing";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function savedButtonClass(isSaved: boolean) {
  return isSaved
    ? "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-300 px-5 text-sm font-black text-slate-600 shadow-none"
    : "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800";
}

export default function DynamicCaseDetailPage() {
  const params = useParams();
  const routeCaseNumber = normalizeCaseNumber(String(params.caseNumber ?? ""));

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [caseRecord, setCaseRecord] = useState<CivicCase | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [activityFeed, setActivityFeed] = useState<CaseActivity[]>([]);

  const [status, setStatus] = useState<CaseStatus>("New Intake");
  const [assignedTo, setAssignedTo] = useState("Unassigned");
  const [workflowSaved, setWorkflowSaved] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState("");

  const [decisionOutcome, setDecisionOutcome] = useState("Approved");
  const [decisionNote, setDecisionNote] = useState(
    "All required documents have been received and reviewed."
  );
  const [caseCompleted, setCaseCompleted] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState("");

  const completedDocuments = useMemo(
    () => documents.filter((document) => document.status === "Received").length,
    [documents]
  );

  const documentsNeedingReview = useMemo(
    () =>
      documents.filter((document) => document.status === "Needs Review").length,
    [documents]
  );

  const missingDocuments = documents.length - completedDocuments;
  const completionPercent =
    documents.length === 0
      ? 0
      : Math.round((completedDocuments / documents.length) * 100);

  const caseReadyForDecision =
    documents.length > 0 &&
    missingDocuments === 0 &&
    documentsNeedingReview === 0;

  const summaryCards = useMemo(() => {
    if (!caseRecord) {
      return [];
    }

    return [
      {
        label: "Client",
        value: `${caseRecord.client_first_name} ${caseRecord.client_last_name}`,
        detail: caseRecord.client_email ?? "No email on file",
      },
      {
        label: "Service Type",
        value: caseRecord.service_category,
        detail: "Staff-created case",
      },
      {
        label: "Priority",
        value: caseRecord.priority,
        detail: "Response target: 3 business days",
      },
      {
        label: "Created",
        value: formatDate(caseRecord.created_at),
        detail: caseRecord.source,
      },
    ];
  }, [caseRecord]);

  async function loadCaseData() {
    setLoading(true);
    setLoadError("");

    const { data: loadedCase, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("case_number", routeCaseNumber)
      .single();

    if (caseError || !loadedCase) {
      setLoadError(
        caseError?.message ?? `Unable to load case ${routeCaseNumber}.`
      );
      setLoading(false);
      return;
    }

    const { data: loadedDocuments, error: documentsError } = await supabase
      .from("case_documents")
      .select("*")
      .eq("case_id", loadedCase.id)
      .order("created_at", { ascending: true });

    if (documentsError) {
      setLoadError(documentsError.message);
      setLoading(false);
      return;
    }

    const { data: loadedActivity, error: activityError } = await supabase
      .from("case_activity")
      .select("*")
      .eq("case_id", loadedCase.id)
      .order("created_at", { ascending: false });

    if (activityError) {
      setLoadError(activityError.message);
      setLoading(false);
      return;
    }

    const normalizedStatus = normalizeStatus(loadedCase.status);

    setCaseRecord(loadedCase as CivicCase);
    setDocuments((loadedDocuments ?? []) as CaseDocument[]);
    setActivityFeed((loadedActivity ?? []) as CaseActivity[]);
    setStatus(normalizedStatus);
    setAssignedTo(loadedCase.assigned_to);
    setDecisionOutcome(loadedCase.decision_outcome ?? "Approved");
    setDecisionNote(
      loadedCase.decision_note ??
        "All required documents have been received and reviewed."
    );
    setCaseCompleted(normalizedStatus === "Completed");
    setLoading(false);
  }

  useEffect(() => {
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCaseNumber]);

  async function addActivity(title: string, detail: string) {
    if (!caseRecord) {
      return;
    }

    const { data, error } = await supabase
      .from("case_activity")
      .insert({
        case_id: caseRecord.id,
        organization_id: caseRecord.organization_id,
        title,
        detail,
        created_by: assignedTo,
      })
      .select("*")
      .single();

    if (error) {
      return;
    }

    setActivityFeed((currentActivity) => [
      data as CaseActivity,
      ...currentActivity,
    ]);
  }

  async function updateDocumentStatus(
    document: CaseDocument,
    nextStatus: DocumentStatus
  ) {
    const { data, error } = await supabase
      .from("case_documents")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id)
      .select("*")
      .single();

    if (error) {
      setDecisionMessage(error.message);
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.map((currentDocument) =>
        currentDocument.id === document.id
          ? (data as CaseDocument)
          : currentDocument
      )
    );

    setCaseCompleted(false);

    await addActivity(
      "Document status updated",
      `${document.name} was marked as ${nextStatus}.`
    );
  }

  async function handleWorkflowSave() {
    if (!caseRecord) {
      return;
    }

    const { data, error } = await supabase
      .from("cases")
      .update({
        status,
        assigned_to: assignedTo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseRecord.id)
      .select("*")
      .single();

    if (error) {
      setWorkflowMessage(error.message);
      return;
    }

    setCaseRecord(data as CivicCase);
    setWorkflowSaved(true);
    setWorkflowMessage("Workflow saved in Supabase.");

    await addActivity(
      "Workflow updated",
      `Case status is now ${status}. Assigned owner is ${assignedTo}.`
    );
  }

  async function handleCompleteCase() {
    if (!caseRecord) {
      return;
    }

    if (!caseReadyForDecision) {
      setDecisionMessage(
        "This case still has missing or review-needed documents."
      );
      return;
    }

    const { data, error } = await supabase
      .from("cases")
      .update({
        status: "Completed",
        decision_outcome: decisionOutcome,
        decision_note: decisionNote,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseRecord.id)
      .select("*")
      .single();

    if (error) {
      setDecisionMessage(error.message);
      return;
    }

    setCaseRecord(data as CivicCase);
    setStatus("Completed");
    setCaseCompleted(true);
    setDecisionMessage(`Case completed with outcome: ${decisionOutcome}.`);

    await addActivity(
      "Case completed",
      `Final outcome: ${decisionOutcome}. ${decisionNote}`
    );
  }

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Loading Case
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Loading {routeCaseNumber}...
          </h1>
        </section>
      </AppShell>
    );
  }

  if (loadError || !caseRecord) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-500">
            Supabase Error
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Case could not be loaded.
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {loadError}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/app/cases"
                  className="text-sm font-black text-slate-500 transition hover:text-slate-950"
                >
                  ← Back to cases
                </Link>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Case {caseRecord.case_number}
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                This dynamic case page loads the selected Supabase case record,
                its required documents, and its activity timeline.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-4 text-2xl font-black leading-tight tracking-tight text-slate-950">
                {card.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {card.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Workflow Control
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Status and assignment
              </h2>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="input-label">
                  Case status
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as CaseStatus);
                      setWorkflowSaved(false);
                    }}
                    className="input-field"
                  >
                    {statusOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="input-label">
                  Assigned staff
                  <select
                    value={assignedTo}
                    onChange={(event) => {
                      setAssignedTo(event.target.value);
                      setWorkflowSaved(false);
                    }}
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

              {workflowMessage ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  {workflowMessage}
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleWorkflowSave}
                  disabled={workflowSaved}
                  className={savedButtonClass(workflowSaved)}
                >
                  {workflowSaved ? "Workflow saved" : "Save workflow"}
                </button>
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Documents
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Document checklist
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Mark each required document as received after review.
                  </p>
                </div>

                <div className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">
                  {completionPercent}% complete
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-950 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>

              <div className="mt-6 grid gap-3">
                {documents.map((document) => {
                  const documentStatus = normalizeDocumentStatus(document.status);

                  return (
                    <div
                      key={document.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-black text-slate-950">
                            {document.name}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {document.description}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${documentStatusStyles[documentStatus]}`}
                        >
                          {documentStatus}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateDocumentStatus(document, "Received")
                          }
                          className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
                        >
                          Mark received
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateDocumentStatus(document, "Needs Review")
                          }
                          className="rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-600"
                        >
                          Needs review
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateDocumentStatus(document, "Missing")
                          }
                          className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                        >
                          Mark missing
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Final Decision
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Close case workflow
                  </h2>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-black ${
                    caseCompleted || caseReadyForDecision
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {caseCompleted
                    ? "Completed"
                    : caseReadyForDecision
                      ? "Ready"
                      : "Needs review"}
                </span>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="input-label">
                  Decision outcome
                  <select
                    value={decisionOutcome}
                    onChange={(event) => {
                      setDecisionOutcome(event.target.value);
                      setCaseCompleted(false);
                    }}
                    className="input-field"
                  >
                    <option>Approved</option>
                    <option>Denied</option>
                    <option>Referred</option>
                    <option>Withdrawn</option>
                  </select>
                </label>

                <div className="soft-panel px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Closure Status
                  </p>
                  <p className="mt-2 text-sm font-black leading-5 text-slate-900">
                    {caseCompleted
                      ? "Case closed"
                      : caseReadyForDecision
                        ? "All documents cleared"
                        : "Documents still pending"}
                  </p>
                </div>
              </div>

              <label className="input-label mt-6">
                Decision note
                <textarea
                  value={decisionNote}
                  onChange={(event) => {
                    setDecisionNote(event.target.value);
                    setCaseCompleted(false);
                  }}
                  rows={4}
                  className="input-field resize-y leading-7"
                />
              </label>

              {decisionMessage ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  {decisionMessage}
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleCompleteCase}
                  disabled={caseCompleted}
                  className={savedButtonClass(caseCompleted)}
                >
                  {caseCompleted ? "Case completed" : "Complete case"}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Case Health
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                {caseCompleted
                  ? "Case completed"
                  : caseReadyForDecision
                    ? "Ready for closure"
                    : "Documents pending"}
              </h2>

              <div className="mt-6 grid gap-3">
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Missing Items
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {missingDocuments} documents
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Needs Review
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {documentsNeedingReview} documents
                  </p>
                </div>
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Activity
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Timeline
              </h2>

              <div className="mt-6 space-y-5">
                {activityFeed.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-slate-950" />

                    <p className="text-sm font-black text-slate-950">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.detail}
                    </p>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      {formatActivityTime(item.created_at)}
                    </p>
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