"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
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

type TrendPoint = {
  label: string;
  dateKey: string;
  created: number;
  completed: number;
};

type BreakdownItem = {
  label: string;
  count: number;
};

function isCompletedCase(caseItem: CaseRecord) {
  return caseItem.status === "Completed" || Boolean(caseItem.completed_at);
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

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function getDateKey(value: string | Date | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatCycleTime(days: number | null) {
  if (days === null) {
    return "—";
  }

  if (days < 1) {
    return "Under 1 day";
  }

  if (days < 2) {
    return "1 day";
  }

  return `${Math.round(days)} days`;
}

function countBy<T>(items: T[], getLabel: (item: T) => string) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const label = getLabel(item).trim() || "Unspecified";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-4 text-5xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function BarList({
  items,
  emptyLabel,
}: {
  items: BreakdownItem[];
  emptyLabel: string;
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <p className="text-sm font-black text-slate-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.slice(0, 7).map((item) => {
        const percent = Math.max((item.count / maxCount) * 100, 6);

        return (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <p className="min-w-0 truncate text-sm font-black text-slate-950">
                {item.label}
              </p>
              <p className="shrink-0 text-sm font-black text-slate-500">
                {item.count}
              </p>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-950"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendLineChart({ data }: { data: TrendPoint[] }) {
  const width = 760;
  const height = 280;
  const paddingX = 46;
  const paddingY = 42;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const maxValue = Math.max(
    ...data.flatMap((point) => [point.created, point.completed]),
    1
  );

  function getX(index: number) {
    if (data.length <= 1) {
      return paddingX;
    }

    return paddingX + (index / (data.length - 1)) * chartWidth;
  }

  function getY(value: number) {
    return paddingY + chartHeight - (value / maxValue) * chartHeight;
  }

  const createdPoints = data
    .map((point, index) => `${getX(index)},${getY(point.created)}`)
    .join(" ");

  const completedPoints = data
    .map((point, index) => `${getX(index)},${getY(point.completed)}`)
    .join(" ");

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            7-Day Trend
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Intake and closure activity
          </h3>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-black text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />
            Created
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        </div>
      </div>

      <div className="mt-5 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[280px] min-w-[620px] w-full"
          role="img"
          aria-label="Seven day intake and closure chart"
        >
          {[0, 1, 2, 3].map((line) => {
            const y = paddingY + (line / 3) * chartHeight;

            return (
              <line
                key={line}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          <polyline
            fill="none"
            stroke="#020617"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
            points={createdPoints}
          />

          <polyline
            fill="none"
            stroke="#10b981"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
            points={completedPoints}
          />

          {data.map((point, index) => (
            <g key={point.dateKey}>
              <circle
                cx={getX(index)}
                cy={getY(point.created)}
                r="5"
                fill="#020617"
              />
              <circle
                cx={getX(index)}
                cy={getY(point.completed)}
                r="5"
                fill="#10b981"
              />
              <text
                x={getX(index)}
                y={height - 12}
                textAnchor="middle"
                className="fill-slate-500 text-[12px] font-bold"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function CompletionDonut({
  completed,
  open,
}: {
  completed: number;
  open: number;
}) {
  const total = completed + open;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
        Completion Mix
      </p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Closed vs open cases
      </h3>

      <div className="mt-6 flex justify-center">
        <div className="relative h-[220px] w-[220px]">
          <svg viewBox="0 0 220 220" className="h-full w-full">
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="34"
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeLinecap="round"
              strokeWidth="34"
              strokeDasharray={`${filled} ${circumference}`}
              transform="rotate(-90 110 110)"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-black tracking-tight text-slate-950">
              {percent}%
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              Closed
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-emerald-50 p-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Completed
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {completed}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-100 p-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
            Open
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{open}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    async function loadReports() {
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

      setCases((loadedCases ?? []) as CaseRecord[]);
      setDocuments((loadedDocuments ?? []) as CaseDocument[]);
      setLoading(false);
    }

    loadReports();
  }, []);

  const completedCases = useMemo(
    () => cases.filter((caseItem) => isCompletedCase(caseItem)),
    [cases]
  );

  const openCases = useMemo(
    () => cases.filter((caseItem) => !isCompletedCase(caseItem)),
    [cases]
  );

  const documentGaps = useMemo(
    () =>
      countBy(
        documents.filter((document) => document.status !== "Received"),
        (document) => document.name
      ),
    [documents]
  );

  const serviceBreakdown = useMemo(
    () => countBy(cases, (caseItem) => caseItem.service_category),
    [cases]
  );

  const statusBreakdown = useMemo(
    () => countBy(cases, (caseItem) => caseItem.status),
    [cases]
  );

  const staffWorkload = useMemo(
    () => countBy(openCases, (caseItem) => caseItem.assigned_to || "Unassigned"),
    [openCases]
  );

  const trendData = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      const dateKey = getDateKey(date);

      return {
        label: formatShortDate(date),
        dateKey,
        created: cases.filter(
          (caseItem) => getDateKey(caseItem.created_at) === dateKey
        ).length,
        completed: completedCases.filter(
          (caseItem) => getDateKey(caseItem.completed_at) === dateKey
        ).length,
      };
    });
  }, [cases, completedCases]);

  const averageCycleDays = useMemo(() => {
    const durations = completedCases
      .filter((caseItem) => caseItem.completed_at)
      .map((caseItem) => {
        const createdAt = new Date(caseItem.created_at).getTime();
        const completedAt = new Date(caseItem.completed_at as string).getTime();

        return Math.max((completedAt - createdAt) / 86_400_000, 0);
      });

    if (durations.length === 0) {
      return null;
    }

    return (
      durations.reduce((total, duration) => total + duration, 0) /
      durations.length
    );
  }, [completedCases]);

  const recentClosures = useMemo(
    () =>
      [...completedCases]
        .sort((a, b) => {
          const aTime = new Date(a.completed_at ?? a.updated_at).getTime();
          const bTime = new Date(b.completed_at ?? b.updated_at).getTime();

          return bTime - aTime;
        })
        .slice(0, 5),
    [completedCases]
  );

  const totalDocumentGaps = documentGaps.reduce(
    (total, item) => total + item.count,
    0
  );

  function handleDownloadExcel() {
    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      ["Metric", "Value"],
      ["Total cases", cases.length],
      ["Open cases", openCases.length],
      ["Completed cases", completedCases.length],
      ["Average completed cycle time", formatCycleTime(averageCycleDays)],
      ["Document gaps", totalDocumentGaps],
      ["Generated at", new Date().toLocaleString()],
    ];

    const caseRows = cases.map((caseItem) => ({
      "Case Number": caseItem.case_number,
      Client: `${caseItem.client_first_name} ${caseItem.client_last_name}`,
      Email: caseItem.client_email ?? "",
      Phone: caseItem.client_phone ?? "",
      "Service Category": caseItem.service_category,
      Priority: caseItem.priority,
      Status: caseItem.status,
      "Assigned To": caseItem.assigned_to,
      Source: caseItem.source,
      "Created At": formatDate(caseItem.created_at),
      "Completed At": formatDate(caseItem.completed_at),
      "Decision Outcome": caseItem.decision_outcome ?? "",
      Summary: caseItem.summary ?? "",
    }));

    const documentRows = documents.map((document) => {
      const matchingCase = cases.find(
        (caseItem) => caseItem.id === document.case_id
      );

      return {
        "Case Number": matchingCase?.case_number ?? "",
        Document: document.name,
        Status: document.status,
        "File Name": document.file_name ?? "",
        Description: document.description ?? "",
        "Updated At": formatDate(document.updated_at),
      };
    });

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(summaryRows),
      "Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(caseRows),
      "Cases"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(documentRows),
      "Documents"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(serviceBreakdown),
      "Service Breakdown"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(statusBreakdown),
      "Status Breakdown"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(staffWorkload),
      "Staff Workload"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(documentGaps),
      "Document Gaps"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(trendData),
      "7 Day Trend"
    );

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `CivicFlow_Report_${today}.xlsx`);

    setExportMessage(
      "Excel report downloaded with summary, cases, documents, workload, breakdowns, gaps, and trend sheets."
    );
  }

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Reports
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Loading report dashboard...
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
            Reports could not be loaded.
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{loadError}</p>
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
                Reports
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Performance dashboard
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Review case workload, closure activity, service demand, staff
                assignments, and document blockers from one clean reporting
                workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex h-12 w-fit items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Download Excel report
            </button>
          </div>

          {exportMessage ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
              {exportMessage}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            label="Open Cases"
            value={openCases.length}
            detail="Active workload"
          />
          <MetricCard
            label="Completed"
            value={completedCases.length}
            detail="Closed case records"
          />
          <MetricCard
            label="Avg Cycle"
            value={formatCycleTime(averageCycleDays)}
            detail="Completed case cycle time"
          />
          <MetricCard
            label="Document Gaps"
            value={totalDocumentGaps}
            detail={`${documentGaps.length} document types affected`}
          />
        </section>

        <section className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="min-w-0 space-y-6">
            <div className="premium-card">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Visualization Studio
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Case performance charts
                  </h2>

                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                    A clean view of intake activity, closure mix, service
                    demand, status movement, and staff workload.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
                  Excel export ready
                </span>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <TrendLineChart data={trendData} />

                <CompletionDonut
                  completed={completedCases.length}
                  open={openCases.length}
                />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="premium-card">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                  Service Demand
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Case categories
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Which service lines are generating the most work.
                </p>

                <div className="mt-6">
                  <BarList
                    items={serviceBreakdown}
                    emptyLabel="No service category data yet."
                  />
                </div>
              </div>

              <div className="premium-card">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                  Status Distribution
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Workflow stages
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  How cases are distributed across the operating pipeline.
                </p>

                <div className="mt-6">
                  <BarList
                    items={statusBreakdown}
                    emptyLabel="No status data yet."
                  />
                </div>
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Staff Workload
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Open case ownership
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Active workload by assigned staff member or queue.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                  {openCases.length} open cases
                </span>
              </div>

              <div className="mt-6">
                <BarList
                  items={staffWorkload}
                  emptyLabel="No open staff workload yet."
                />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
                Operational Signal
              </p>

              <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
                {totalDocumentGaps > 0
                  ? "Document gaps need attention."
                  : "Documents are under control."}
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-300">
                {totalDocumentGaps > 0
                  ? "Missing or review-needed documents are the main blockers to faster case completion."
                  : "There are no open document gaps in the current case workload."}
              </p>

              <div className="mt-8 rounded-3xl bg-white/10 p-6">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                  Recommended Action
                </p>
                <p className="mt-3 text-xl font-black leading-8 text-white">
                  {totalDocumentGaps > 0
                    ? "Prioritize document follow-up before new assignments."
                    : "Continue monitoring new intake and review activity."}
                </p>
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Document Gap Chart
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Missing items
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Document types still marked as missing or needing review.
              </p>

              <div className="mt-6">
                <BarList
                  items={documentGaps}
                  emptyLabel="No missing document items."
                />
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Recent Closures
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Completed cases
              </h2>

              <div className="mt-6 space-y-3">
                {recentClosures.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="text-sm font-black text-slate-500">
                      No completed cases yet.
                    </p>
                  </div>
                ) : (
                  recentClosures.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">
                            {caseItem.case_number}
                          </p>
                          <p className="mt-1 truncate text-sm font-bold text-slate-500">
                            {caseItem.client_first_name}{" "}
                            {caseItem.client_last_name}
                          </p>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          Closed
                        </span>
                      </div>

                      <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        {formatDate(caseItem.completed_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}