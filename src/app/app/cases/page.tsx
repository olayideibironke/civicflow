"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type CaseRecord = {
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

type CaseNote = {
  id: string;
  case_id: string;
  organization_id: string;
  note: string | null;
  note_type: string | null;
  follow_up_required: boolean | null;
  follow_up_date: string | null;
  follow_up_completed: boolean | null;
  follow_up_completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

type AttentionFilter =
  | "All Cases"
  | "Open Follow-ups"
  | "Overdue Follow-ups"
  | "Document Gaps"
  | "Unassigned";

const statusOptions = [
  "All Statuses",
  "New Intake",
  "In Review",
  "Assigned",
  "Waiting on Client",
  "Completed",
];

const priorityOptions = ["All Priorities", "Low", "Medium", "High", "Urgent"];

const attentionOptions: AttentionFilter[] = [
  "All Cases",
  "Open Follow-ups",
  "Overdue Follow-ups",
  "Document Gaps",
  "Unassigned",
];

function getCaseHref(caseNumber: string) {
  return `/app/cases/${caseNumber.toLowerCase()}`;
}

function isCompletedCase(caseItem: CaseRecord) {
  return caseItem.status === "Completed" || Boolean(caseItem.completed_at);
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function isPastDue(dateValue: string | null) {
  if (!dateValue) {
    return false;
  }

  return dateValue < getTodayDateInput();
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusStyle(status: string) {
  if (status === "Completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Waiting on Client") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "In Review") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Assigned") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getPriorityStyle(priority: string) {
  if (priority === "Urgent" || priority === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (priority === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-white text-slate-500";
}

function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "rose" | "amber" | "emerald";
}) {
  const valueClass =
    tone === "rose"
      ? "text-rose-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "emerald"
          ? "text-emerald-700"
          : "text-slate-950";

  return (
    <div className="premium-card">
      <p className="eyebrow">
        {label}
      </p>

      <p className={`mt-4 text-3xl font-bold tracking-tight ${valueClass}`}>
        {value}
      </p>

      <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [attentionFilter, setAttentionFilter] =
    useState<AttentionFilter>("All Cases");

  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      setLoadError("");

      const { data: loadedCases, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (casesError) {
        setLoadError(casesError.message);
        setLoading(false);
        return;
      }

      const { data: loadedDocuments, error: documentsError } = await supabase
        .from("case_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (documentsError) {
        setLoadError(documentsError.message);
        setLoading(false);
        return;
      }

      const { data: loadedNotes, error: notesError } = await supabase
        .from("case_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (notesError) {
        setLoadError(notesError.message);
        setLoading(false);
        return;
      }

      setCases((loadedCases ?? []) as CaseRecord[]);
      setDocuments((loadedDocuments ?? []) as CaseDocument[]);
      setNotes((loadedNotes ?? []) as CaseNote[]);
      setLoading(false);
    }

    loadCases();
  }, []);

  const openCases = useMemo(
    () => cases.filter((caseItem) => !isCompletedCase(caseItem)),
    [cases]
  );

  const unassignedCases = useMemo(
    () =>
      openCases.filter(
        (caseItem) =>
          !caseItem.assigned_to || caseItem.assigned_to === "Unassigned"
      ),
    [openCases]
  );

  const documentGaps = useMemo(
    () => documents.filter((document) => document.status !== "Received"),
    [documents]
  );

  const openFollowUps = useMemo(
    () =>
      notes.filter(
        (note) => note.follow_up_required && !note.follow_up_completed
      ),
    [notes]
  );

  const overdueFollowUps = useMemo(
    () => openFollowUps.filter((note) => isPastDue(note.follow_up_date)),
    [openFollowUps]
  );

  const documentGapsByCase = useMemo(() => {
    const lookup = new Map<string, number>();

    documentGaps.forEach((document) => {
      lookup.set(document.case_id, (lookup.get(document.case_id) ?? 0) + 1);
    });

    return lookup;
  }, [documentGaps]);

  const openFollowUpsByCase = useMemo(() => {
    const lookup = new Map<string, number>();

    openFollowUps.forEach((note) => {
      lookup.set(note.case_id, (lookup.get(note.case_id) ?? 0) + 1);
    });

    return lookup;
  }, [openFollowUps]);

  const overdueFollowUpsByCase = useMemo(() => {
    const lookup = new Map<string, number>();

    overdueFollowUps.forEach((note) => {
      lookup.set(note.case_id, (lookup.get(note.case_id) ?? 0) + 1);
    });

    return lookup;
  }, [overdueFollowUps]);

  const filteredCases = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return cases.filter((caseItem) => {
      const clientName =
        `${caseItem.client_first_name} ${caseItem.client_last_name}`.toLowerCase();

      const searchableContent = [
        caseItem.case_number,
        clientName,
        caseItem.client_email ?? "",
        caseItem.client_phone ?? "",
        caseItem.service_category,
        caseItem.priority,
        caseItem.status,
        caseItem.assigned_to,
        caseItem.summary ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? searchableContent.includes(normalizedSearch)
        : true;

      const matchesStatus =
        statusFilter === "All Statuses" || caseItem.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All Priorities" ||
        caseItem.priority === priorityFilter;

      const hasOpenFollowUps =
        (openFollowUpsByCase.get(caseItem.id) ?? 0) > 0;
      const hasOverdueFollowUps =
        (overdueFollowUpsByCase.get(caseItem.id) ?? 0) > 0;
      const hasDocumentGaps = (documentGapsByCase.get(caseItem.id) ?? 0) > 0;
      const isUnassigned =
        !caseItem.assigned_to || caseItem.assigned_to === "Unassigned";

      const matchesAttention =
        attentionFilter === "All Cases" ||
        (attentionFilter === "Open Follow-ups" && hasOpenFollowUps) ||
        (attentionFilter === "Overdue Follow-ups" && hasOverdueFollowUps) ||
        (attentionFilter === "Document Gaps" && hasDocumentGaps) ||
        (attentionFilter === "Unassigned" && isUnassigned);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAttention
      );
    });
  }, [
    attentionFilter,
    cases,
    documentGapsByCase,
    openFollowUpsByCase,
    overdueFollowUpsByCase,
    priorityFilter,
    searchTerm,
    statusFilter,
  ]);

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="eyebrow">
            Cases
          </p>

          <h1 className="mt-4 text-2xl font-bold">
            Loading case queue...
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
            Supabase Error
          </p>

          <h1 className="mt-4 text-2xl font-bold">
            Case queue could not be loaded.
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
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="eyebrow">
                Case Queue
              </p>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Cases and follow-up workload
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Review all cases, document blockers, open follow-ups, overdue
                staff actions, assignment gaps, priorities, and workflow status.
              </p>
            </div>

            <Link
              href="/app/cases/new"
              className="btn btn-primary w-fit whitespace-nowrap"
            >
              Create case
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
          <MetricCard
            label="Total Cases"
            value={cases.length}
            detail="All case records"
          />

          <MetricCard
            label="Open Cases"
            value={openCases.length}
            detail="Active workload"
          />

          <MetricCard
            label="Open Follow-ups"
            value={openFollowUps.length}
            detail="Pending staff actions"
            tone={openFollowUps.length > 0 ? "amber" : "emerald"}
          />

          <MetricCard
            label="Overdue"
            value={overdueFollowUps.length}
            detail="Past due follow-ups"
            tone={overdueFollowUps.length > 0 ? "rose" : "emerald"}
          />

          <MetricCard
            label="Doc Gaps"
            value={documentGaps.length}
            detail="Missing or review-needed"
            tone={documentGaps.length > 0 ? "amber" : "emerald"}
          />
        </section>

        <section className="premium-card">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="eyebrow">
                Filters
              </p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                Find cases fast
              </h2>
            </div>

            <p className="text-sm font-medium text-slate-500">
              Showing {filteredCases.length} of {cases.length} cases
            </p>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_220px_220px_240px]">
            <label className="input-label">
              Search
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, case number, email, phone, service, assigned staff..."
                className="input-field"
              />
            </label>

            <label className="input-label">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="input-field"
              >
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="input-label">
              Priority
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="input-field"
              >
                {priorityOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="input-label">
              Attention
              <select
                value={attentionFilter}
                onChange={(event) =>
                  setAttentionFilter(event.target.value as AttentionFilter)
                }
                className="input-field"
              >
                {attentionOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-4">
          {filteredCases.length === 0 ? (
            <div className="premium-card">
              <p className="eyebrow">
                No Results
              </p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                No cases match these filters.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Adjust the search, status, priority, or attention filters to
                view more records.
              </p>
            </div>
          ) : (
            filteredCases.map((caseItem) => {
              const gapCount = documentGapsByCase.get(caseItem.id) ?? 0;
              const followUpCount = openFollowUpsByCase.get(caseItem.id) ?? 0;
              const overdueCount =
                overdueFollowUpsByCase.get(caseItem.id) ?? 0;
              const isUnassigned =
                !caseItem.assigned_to || caseItem.assigned_to === "Unassigned";

              return (
                <Link
                  key={caseItem.id}
                  href={getCaseHref(caseItem.case_number)}
                  className="block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm card-interactive"
                >
                  <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip bg-slate-900 text-white">
                          {caseItem.case_number}
                        </span>

                        <span
                          className={`chip ${getStatusStyle(
                            caseItem.status
                          )}`}
                        >
                          {caseItem.status}
                        </span>

                        <span
                          className={`chip ${getPriorityStyle(
                            caseItem.priority
                          )}`}
                        >
                          {caseItem.priority}
                        </span>

                        {isUnassigned ? (
                          <span className="chip bg-blue-100 text-blue-700">
                            Unassigned
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-4 text-lg font-semibold text-slate-900">
                        {caseItem.client_first_name}{" "}
                        {caseItem.client_last_name}
                      </h2>

                      <p className="mt-2 text-sm font-medium text-slate-500">
                        {caseItem.service_category} · Assigned to{" "}
                        {caseItem.assigned_to || "Unassigned"}
                      </p>

                      <p className="mt-3 line-clamp-2 max-w-4xl text-sm leading-7 text-slate-600">
                        {caseItem.summary ?? "No case summary provided."}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 2xl:grid-cols-1">
                      <div
                        className={`rounded-xl p-4 ${
                          overdueCount > 0
                            ? "bg-rose-50"
                            : followUpCount > 0
                              ? "bg-amber-50"
                              : "bg-slate-50"
                        }`}
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Follow-ups
                        </p>
                        <p
                          className={`mt-2 text-xl font-bold ${
                            overdueCount > 0
                              ? "text-rose-700"
                              : followUpCount > 0
                                ? "text-amber-700"
                                : "text-slate-900"
                          }`}
                        >
                          {followUpCount}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {overdueCount} overdue
                        </p>
                      </div>

                      <div
                        className={`rounded-xl p-4 ${
                          gapCount > 0 ? "bg-amber-50" : "bg-emerald-50"
                        }`}
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Document Gaps
                        </p>
                        <p
                          className={`mt-2 text-xl font-bold ${
                            gapCount > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {gapCount}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Missing or review-needed
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Created
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {formatDate(caseItem.created_at)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Source: {caseItem.source}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </AppShell>
  );
}