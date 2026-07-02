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

type AttentionItem = {
  id: string;
  caseNumber: string;
  clientName: string;
  title: string;
  detail: string;
  badge: string;
  tone: "rose" | "amber" | "blue";
  href: string;
  dueDate: string | null;
};

function isCompletedCase(caseItem: CaseRecord) {
  return caseItem.status === "Completed" || Boolean(caseItem.completed_at);
}

function getCaseHref(caseNumber: string) {
  return `/app/cases/${caseNumber.toLowerCase()}`;
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

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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

function getAttentionStyle(tone: AttentionItem["tone"]) {
  if (tone === "rose") {
    return {
      card: "border-rose-200 bg-rose-50",
      badge: "bg-rose-100 text-rose-700",
    };
  }

  if (tone === "amber") {
    return {
      card: "border-amber-200 bg-amber-50",
      badge: "bg-amber-100 text-amber-700",
    };
  }

  return {
    card: "border-blue-200 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
  };
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
      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
        {label}
      </p>

      <p className={`mt-4 text-5xl font-black tracking-tight ${valueClass}`}>
        {value}
      </p>

      <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
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

    loadDashboard();
  }, []);

  const openCases = useMemo(
    () => cases.filter((caseItem) => !isCompletedCase(caseItem)),
    [cases]
  );

  const completedCases = useMemo(
    () => cases.filter((caseItem) => isCompletedCase(caseItem)),
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

  const recentCases = useMemo(() => cases.slice(0, 6), [cases]);

  const caseLookup = useMemo(() => {
    const lookup = new Map<string, CaseRecord>();

    cases.forEach((caseItem) => {
      lookup.set(caseItem.id, caseItem);
    });

    return lookup;
  }, [cases]);

  const documentGapsByCase = useMemo(() => {
    const lookup = new Map<string, number>();

    documentGaps.forEach((document) => {
      lookup.set(document.case_id, (lookup.get(document.case_id) ?? 0) + 1);
    });

    return lookup;
  }, [documentGaps]);

  const followUpsByCase = useMemo(() => {
    const lookup = new Map<string, number>();

    openFollowUps.forEach((note) => {
      lookup.set(note.case_id, (lookup.get(note.case_id) ?? 0) + 1);
    });

    return lookup;
  }, [openFollowUps]);

  const attentionItems = useMemo(() => {
    const items: AttentionItem[] = [];

    overdueFollowUps.forEach((note) => {
      const matchingCase = caseLookup.get(note.case_id);

      if (!matchingCase) {
        return;
      }

      items.push({
        id: `overdue-${note.id}`,
        caseNumber: matchingCase.case_number,
        clientName: `${matchingCase.client_first_name} ${matchingCase.client_last_name}`,
        title: note.note_type ?? "Follow-up",
        detail: note.note ?? "Follow-up is overdue.",
        badge: "Overdue follow-up",
        tone: "rose",
        href: getCaseHref(matchingCase.case_number),
        dueDate: note.follow_up_date,
      });
    });

    openFollowUps
      .filter((note) => !isPastDue(note.follow_up_date))
      .forEach((note) => {
        const matchingCase = caseLookup.get(note.case_id);

        if (!matchingCase) {
          return;
        }

        items.push({
          id: `open-${note.id}`,
          caseNumber: matchingCase.case_number,
          clientName: `${matchingCase.client_first_name} ${matchingCase.client_last_name}`,
          title: note.note_type ?? "Follow-up",
          detail: note.note ?? "Follow-up is pending.",
          badge: "Open follow-up",
          tone: "amber",
          href: getCaseHref(matchingCase.case_number),
          dueDate: note.follow_up_date,
        });
      });

    unassignedCases.forEach((caseItem) => {
      items.push({
        id: `unassigned-${caseItem.id}`,
        caseNumber: caseItem.case_number,
        clientName: `${caseItem.client_first_name} ${caseItem.client_last_name}`,
        title: "Case needs assignment",
        detail:
          caseItem.summary ??
          "This case is open but does not have an assigned staff owner.",
        badge: "Unassigned",
        tone: "blue",
        href: getCaseHref(caseItem.case_number),
        dueDate: null,
      });
    });

    return items.slice(0, 8);
  }, [caseLookup, openFollowUps, overdueFollowUps, unassignedCases]);

  const workflowQueues = [
    {
      label: "New Intake",
      count: cases.filter((caseItem) => caseItem.status === "New Intake")
        .length,
      detail: "Cases waiting for first review",
    },
    {
      label: "In Review",
      count: cases.filter((caseItem) => caseItem.status === "In Review")
        .length,
      detail: "Cases under staff review",
    },
    {
      label: "Waiting on Client",
      count: cases.filter((caseItem) => caseItem.status === "Waiting on Client")
        .length,
      detail: "Cases blocked by client action",
    },
    {
      label: "Completed",
      count: completedCases.length,
      detail: "Closed case records",
    },
  ];

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Dashboard
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Loading CivicFlow workspace...
          </h1>
        </section>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-500">
            Supabase Error
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Dashboard could not be loaded.
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
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Operations Dashboard
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Staff command center
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Track open cases, overdue follow-ups, document blockers,
                assignment gaps, and recent intake activity from one workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/app/cases/new"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Create case
              </Link>

              <Link
                href="/intake"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Public intake
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            label="Open Cases"
            value={openCases.length}
            detail="Active case workload"
          />

          <MetricCard
            label="Open Follow-ups"
            value={openFollowUps.length}
            detail="Staff actions still pending"
            tone={openFollowUps.length > 0 ? "amber" : "emerald"}
          />

          <MetricCard
            label="Overdue Follow-ups"
            value={overdueFollowUps.length}
            detail="Past due staff actions"
            tone={overdueFollowUps.length > 0 ? "rose" : "emerald"}
          />

          <MetricCard
            label="Document Gaps"
            value={documentGaps.length}
            detail="Missing or review-needed documents"
            tone={documentGaps.length > 0 ? "amber" : "emerald"}
          />
        </section>

        <section className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-6">
            <div className="premium-card">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Needs Attention
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Follow-ups and assignment gaps
                  </h2>

                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                    Staff can quickly see which cases need action before opening
                    individual case records.
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
                    attentionItems.length > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {attentionItems.length} attention items
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {attentionItems.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
                    <p className="text-sm font-black text-slate-500">
                      No overdue follow-ups, open follow-ups, or unassigned
                      cases need attention right now.
                    </p>
                  </div>
                ) : (
                  attentionItems.map((item) => {
                    const styles = getAttentionStyle(item.tone);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`block rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${styles.card}`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                                {item.caseNumber}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${styles.badge}`}
                              >
                                {item.badge}
                              </span>
                            </div>

                            <p className="mt-4 text-lg font-black text-slate-950">
                              {item.title}
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-600">
                              {item.clientName}
                            </p>

                            <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600">
                              {item.detail}
                            </p>
                          </div>

                          <div className="shrink-0 rounded-2xl bg-white/75 px-4 py-3 text-sm font-black text-slate-700">
                            Due: {formatDate(item.dueDate)}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Recent Cases
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Latest case activity
                  </h2>

                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                    Recent cases with document blockers and follow-up counts.
                  </p>
                </div>

                <Link
                  href="/app/cases"
                  className="w-fit rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  View all cases
                </Link>
              </div>

              <div className="mt-6 grid gap-3">
                {recentCases.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
                    <p className="text-sm font-black text-slate-500">
                      No cases have been created yet.
                    </p>
                  </div>
                ) : (
                  recentCases.map((caseItem) => {
                    const gapCount = documentGapsByCase.get(caseItem.id) ?? 0;
                    const followUpCount = followUpsByCase.get(caseItem.id) ?? 0;

                    return (
                      <Link
                        key={caseItem.id}
                        href={getCaseHref(caseItem.case_number)}
                        className="block rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                                {caseItem.case_number}
                              </span>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusStyle(
                                  caseItem.status
                                )}`}
                              >
                                {caseItem.status}
                              </span>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getPriorityStyle(
                                  caseItem.priority
                                )}`}
                              >
                                {caseItem.priority}
                              </span>
                            </div>

                            <p className="mt-4 text-lg font-black text-slate-950">
                              {caseItem.client_first_name}{" "}
                              {caseItem.client_last_name}
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-500">
                              {caseItem.service_category} · Assigned to{" "}
                              {caseItem.assigned_to || "Unassigned"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                gapCount > 0
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {gapCount} doc gaps
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                followUpCount > 0
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {followUpCount} follow-ups
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
                Operating Signal
              </p>

              <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
                {overdueFollowUps.length > 0
                  ? "Overdue follow-ups need action."
                  : openFollowUps.length > 0
                    ? "Follow-ups are pending."
                    : documentGaps.length > 0
                      ? "Document gaps need attention."
                      : "Workspace is under control."}
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-300">
                {overdueFollowUps.length > 0
                  ? "Start with overdue follow-ups before reviewing new intake."
                  : openFollowUps.length > 0
                    ? "Pending follow-ups should be handled before they become overdue."
                    : documentGaps.length > 0
                      ? "Missing or review-needed documents may slow down case completion."
                      : "There are no major blockers in the current workspace."}
              </p>

              <div className="mt-8 grid gap-3">
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Open Follow-ups
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {openFollowUps.length}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Overdue Follow-ups
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {overdueFollowUps.length}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Unassigned Cases
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {unassignedCases.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Workflow Queues
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Case stages
              </h2>

              <div className="mt-6 grid gap-3">
                {workflowQueues.map((queue) => (
                  <div
                    key={queue.label}
                    className="rounded-3xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {queue.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {queue.detail}
                        </p>
                      </div>

                      <span className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                        {queue.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Quick Links
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/app/cases"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Open case queue
                </Link>

                <Link
                  href="/app/reports"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  View reports
                </Link>

                <Link
                  href="/app/cases/new"
                  className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
                >
                  Create staff case
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}