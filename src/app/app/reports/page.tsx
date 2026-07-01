"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

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

type ChartRow = {
  label: string;
  value: number;
  detail?: string;
  href?: string;
};

type TrendPoint = {
  dateKey: string;
  label: string;
  created: number;
  completed: number;
};

const knownStatuses = [
  "New Intake",
  "In Review",
  "Assigned",
  "Waiting on Client",
  "Completed",
];

const statusStyles: Record<string, string> = {
  "New Intake": "border-blue-200 bg-blue-50 text-blue-700",
  "In Review": "border-amber-200 bg-amber-50 text-amber-700",
  Assigned: "border-purple-200 bg-purple-50 text-purple-700",
  "Waiting on Client": "border-orange-200 bg-orange-50 text-orange-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function getCaseHref(caseNumber: string) {
  return `/app/cases/${caseNumber.toLowerCase()}`;
}

function isOpenCase(caseItem: CivicCase) {
  return caseItem.status !== "Completed";
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAverageDays(cases: CivicCase[]) {
  const completedCases = cases.filter(
    (caseItem) => caseItem.status === "Completed" && caseItem.completed_at
  );

  if (completedCases.length === 0) {
    return "0d";
  }

  const totalDays = completedCases.reduce((total, caseItem) => {
    const createdAt = new Date(caseItem.created_at).getTime();
    const completedAt = new Date(caseItem.completed_at as string).getTime();
    const differenceInDays = Math.max(
      0,
      (completedAt - createdAt) / (1000 * 60 * 60 * 24)
    );

    return total + differenceInDays;
  }, 0);

  const average = totalDays / completedCases.length;

  if (average < 1) {
    return "<1d";
  }

  return `${average.toFixed(1)}d`;
}

function getDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildTrendData(cases: CivicCase[]) {
  const today = new Date();

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    const dateKey = date.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);

    const created = cases.filter(
      (caseItem) => getDateKey(caseItem.created_at) === dateKey
    ).length;

    const completed = cases.filter(
      (caseItem) =>
        caseItem.completed_at && getDateKey(caseItem.completed_at) === dateKey
    ).length;

    return {
      dateKey,
      label,
      created,
      completed,
    };
  });
}

function getSheetData<T extends Record<string, unknown>>(rows: T[]) {
  if (rows.length === 0) {
    return [{ Message: "No records available" }];
  }

  return rows;
}

function HorizontalBarChart({
  rows,
  emptyMessage,
}: {
  rows: ChartRow[];
  emptyMessage: string;
}) {
  const highestValue = Math.max(...rows.map((row) => row.value), 1);

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-black text-slate-950">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {rows.map((row) => {
        const percent =
          row.value === 0 ? 0 : Math.max(10, Math.round((row.value / highestValue) * 100));

        const content = (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-950">{row.label}</p>
                {row.detail ? (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {row.detail}
                  </p>
                ) : null}
              </div>

              <p className="text-sm font-black text-slate-700">{row.value}</p>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-950"
                style={{ width: `${percent}%` }}
              />
            </div>
          </>
        );

        if (row.href) {
          return (
            <Link
              key={row.label}
              href={row.href}
              className="block rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={row.label}
            className="rounded-3xl border border-slate-200 bg-white p-4"
          >
            {content}
          </div>
        );
      })}
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
  const completedPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 text-center">
      <div
        className="flex h-44 w-44 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#10b981 0 ${completedPercent}%, #020617 ${completedPercent}% 100%)`,
        }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
          <p className="text-3xl font-black text-slate-950">
            {completedPercent}%
          </p>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Closed
          </p>
        </div>
      </div>

      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Completed
          </p>
          <p className="mt-1 text-2xl font-black text-slate-950">
            {completed}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Open
          </p>
          <p className="mt-1 text-2xl font-black text-slate-950">{open}</p>
        </div>
      </div>
    </div>
  );
}

function TrendLineChart({ data }: { data: TrendPoint[] }) {
  const width = 620;
  const height = 220;
  const padding = 34;
  const maxValue = Math.max(
    ...data.flatMap((point) => [point.created, point.completed]),
    1
  );

  function getX(index: number) {
    if (data.length <= 1) {
      return padding;
    }

    return padding + (index / (data.length - 1)) * (width - padding * 2);
  }

  function getY(value: number) {
    return height - padding - (value / maxValue) * (height - padding * 2);
  }

  const createdPoints = data
    .map((point, index) => `${getX(index)},${getY(point.created)}`)
    .join(" ");

  const completedPoints = data
    .map((point, index) => `${getX(index)},${getY(point.completed)}`)
    .join(" ");

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-950">
            7-day intake and closure trend
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Created cases compared with completed cases.
          </p>
        </div>

        <div className="flex gap-3 text-xs font-black text-slate-500">
          <span>● Created</span>
          <span>● Completed</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-auto w-full"
        role="img"
        aria-label="Seven day case trend chart"
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e2e8f0"
          strokeWidth="2"
        />

        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#e2e8f0"
          strokeWidth="2"
        />

        <polyline
          points={createdPoints}
          fill="none"
          stroke="#020617"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <polyline
          points={completedPoints}
          fill="none"
          stroke="#10b981"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((point, index) => (
          <g key={point.dateKey}>
            <circle cx={getX(index)} cy={getY(point.created)} r="5" fill="#020617" />
            <circle
              cx={getX(index)}
              cy={getY(point.completed)}
              r="5"
              fill="#10b981"
            />

            <text
              x={getX(index)}
              y={height - 8}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#64748b"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function ReportsPage() {
  const [cases, setCases] = useState<CivicCase[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    async function loadReportsData() {
      setLoading(true);
      setLoadError("");

      const { data: loadedCases, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .order("updated_at", { ascending: false });

      if (casesError) {
        setLoadError(casesError.message);
        setLoading(false);
        return;
      }

      const { data: loadedDocuments, error: documentsError } = await supabase
        .from("case_documents")
        .select("*")
        .order("created_at", { ascending: true });

      if (documentsError) {
        setLoadError(documentsError.message);
        setLoading(false);
        return;
      }

      setCases((loadedCases ?? []) as CivicCase[]);
      setDocuments((loadedDocuments ?? []) as CaseDocument[]);
      setLoading(false);
    }

    loadReportsData();
  }, []);

  const openCases = useMemo(() => cases.filter(isOpenCase), [cases]);

  const completedCases = useMemo(
    () => cases.filter((caseItem) => caseItem.status === "Completed"),
    [cases]
  );

  const missingDocuments = useMemo(
    () => documents.filter((document) => document.status !== "Received"),
    [documents]
  );

  const documentsByCaseId = useMemo(() => {
    return documents.reduce<Record<string, CaseDocument[]>>(
      (accumulator, document) => {
        if (!accumulator[document.case_id]) {
          accumulator[document.case_id] = [];
        }

        accumulator[document.case_id].push(document);
        return accumulator;
      },
      {}
    );
  }, [documents]);

  const casesWithDocumentGaps = useMemo(() => {
    return new Set(missingDocuments.map((document) => document.case_id));
  }, [missingDocuments]);

  const serviceBreakdown = useMemo(() => {
    const serviceCounts = openCases.reduce<Record<string, number>>(
      (accumulator, caseItem) => {
        if (!accumulator[caseItem.service_category]) {
          accumulator[caseItem.service_category] = 0;
        }

        accumulator[caseItem.service_category] += 1;
        return accumulator;
      },
      {}
    );

    return Object.entries(serviceCounts)
      .map(([label, value]) => ({
        label,
        value,
        detail: "Active case workload",
      }))
      .sort((a, b) => b.value - a.value);
  }, [openCases]);

  const statusBreakdown = useMemo(() => {
    return knownStatuses.map((status) => ({
      status,
      count: cases.filter((caseItem) => caseItem.status === status).length,
      style:
        statusStyles[status] ?? "border-slate-200 bg-slate-50 text-slate-700",
    }));
  }, [cases]);

  const statusChartRows = useMemo(() => {
    return statusBreakdown.map((item) => ({
      label: item.status,
      value: item.count,
      detail: "Case status count",
    }));
  }, [statusBreakdown]);

  const staffWorkload = useMemo(() => {
    const staffCounts = openCases.reduce<Record<string, CivicCase[]>>(
      (accumulator, caseItem) => {
        if (!accumulator[caseItem.assigned_to]) {
          accumulator[caseItem.assigned_to] = [];
        }

        accumulator[caseItem.assigned_to].push(caseItem);
        return accumulator;
      },
      {}
    );

    return Object.entries(staffCounts)
      .map(([name, staffCases]) => {
        const documentGapCount = staffCases.filter((caseItem) => {
          const caseDocuments = documentsByCaseId[caseItem.id] ?? [];
          return caseDocuments.some((document) => document.status !== "Received");
        }).length;

        return {
          name,
          role: name === "Unassigned" ? "Needs assignment" : "Staff owner",
          count: staffCases.length,
          cases: `${staffCases.length} active`,
          alert:
            documentGapCount > 0
              ? `${documentGapCount} case${
                  documentGapCount === 1 ? "" : "s"
                } with document gaps`
              : "On track",
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [documentsByCaseId, openCases]);

  const documentGaps = useMemo(() => {
    const gapCounts = missingDocuments.reduce<Record<string, number>>(
      (accumulator, document) => {
        if (!accumulator[document.name]) {
          accumulator[document.name] = 0;
        }

        accumulator[document.name] += 1;
        return accumulator;
      },
      {}
    );

    return Object.entries(gapCounts)
      .map(([label, value]) => ({
        label,
        value,
        detail: `${value} case${value === 1 ? "" : "s"} affected`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [missingDocuments]);

  const recentCompletedCases = useMemo(() => {
    return completedCases
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 5);
  }, [completedCases]);

  const trendData = useMemo(() => buildTrendData(cases), [cases]);

  const reportMetrics = [
    {
      label: "Open cases",
      value: openCases.length.toString(),
      detail: "Active workload",
    },
    {
      label: "Completed cases",
      value: completedCases.length.toString(),
      detail: "Closed case records",
    },
    {
      label: "Avg. completion",
      value: formatAverageDays(cases),
      detail: "Completed case cycle time",
    },
    {
      label: "Document gaps",
      value: missingDocuments.length.toString(),
      detail: `${casesWithDocumentGaps.size} case${
        casesWithDocumentGaps.size === 1 ? "" : "s"
      } affected`,
    },
  ];

  function handleDownloadExcel() {
    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      {
        Metric: "Total cases",
        Value: cases.length,
      },
      {
        Metric: "Open cases",
        Value: openCases.length,
      },
      {
        Metric: "Completed cases",
        Value: completedCases.length,
      },
      {
        Metric: "Missing or review-needed documents",
        Value: missingDocuments.length,
      },
      {
        Metric: "Cases with document gaps",
        Value: casesWithDocumentGaps.size,
      },
      {
        Metric: "Average completion time",
        Value: formatAverageDays(cases),
      },
      {
        Metric: "Generated at",
        Value: new Date().toLocaleString(),
      },
    ];

    const caseRows = cases.map((caseItem) => {
      const caseDocuments = documentsByCaseId[caseItem.id] ?? [];
      const missingCount = caseDocuments.filter(
        (document) => document.status !== "Received"
      ).length;

      return {
        "Case Number": caseItem.case_number,
        "Client Name": `${caseItem.client_first_name} ${caseItem.client_last_name}`,
        Email: caseItem.client_email ?? "",
        Phone: caseItem.client_phone ?? "",
        "Service Category": caseItem.service_category,
        Priority: caseItem.priority,
        Status: caseItem.status,
        "Assigned To": caseItem.assigned_to,
        Source: caseItem.source,
        Summary: caseItem.summary ?? "",
        "Decision Outcome": caseItem.decision_outcome ?? "",
        "Decision Note": caseItem.decision_note ?? "",
        "Missing Documents": missingCount,
        "Created Date": formatDate(caseItem.created_at),
        "Completed Date": formatDate(caseItem.completed_at),
        "Last Updated": formatUpdatedAt(caseItem.updated_at),
      };
    });

    const documentRows = documents.map((document) => {
      const relatedCase = cases.find((caseItem) => caseItem.id === document.case_id);

      return {
        "Case Number": relatedCase?.case_number ?? "",
        Client: relatedCase
          ? `${relatedCase.client_first_name} ${relatedCase.client_last_name}`
          : "",
        "Document Name": document.name,
        Description: document.description ?? "",
        Status: document.status,
        "File Name": document.file_name ?? "",
        "Created Date": formatDate(document.created_at),
        "Last Updated": formatUpdatedAt(document.updated_at),
      };
    });

    const serviceRows = serviceBreakdown.map((service) => ({
      "Service Category": service.label,
      "Active Cases": service.value,
    }));

    const statusRows = statusBreakdown.map((item) => ({
      Status: item.status,
      Cases: item.count,
    }));

    const staffRows = staffWorkload.map((staff) => ({
      Staff: staff.name,
      Role: staff.role,
      "Active Cases": staff.count,
      Alert: staff.alert,
    }));

    const gapRows = documentGaps.map((gap) => ({
      "Document Requirement": gap.label,
      "Cases Affected": gap.value,
    }));

    const trendRows = trendData.map((point) => ({
      Date: point.label,
      "Cases Created": point.created,
      "Cases Completed": point.completed,
    }));

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(getSheetData(summaryRows)),
      "Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(getSheetData(caseRows)),
      "Cases"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(getSheetData(documentRows)),
      "Documents"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(getSheetData(serviceRows)),
      "Service Breakdown"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(getSheetData(statusRows)),
      "Status Breakdown"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(getSheetData(staffRows)),
      "Staff Workload"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(getSheetData(gapRows)),
      "Document Gaps"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(getSheetData(trendRows)),
      "7 Day Trend"
    );

    const fileDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `CivicFlow_Report_${fileDate}.xlsx`);

    setExportMessage(
      "Excel report downloaded with summary, cases, documents, staff workload, service breakdown, status breakdown, document gaps, and trend sheets."
    );
  }

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Loading Reports
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Connecting reports to Supabase...
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-600">
            CivicFlow is calculating real case, document, workload, and
            completion metrics.
          </p>
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
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Reporting Center
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Reports
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                CivicFlow reports now include professional on-screen charts and
                a comprehensive Excel workbook export.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
              <Link
                href="/app/cases"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                View cases
              </Link>

              <button
                type="button"
                onClick={handleDownloadExcel}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Download Excel report
              </button>
            </div>
          </div>

          {exportMessage ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
              {exportMessage}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reportMetrics.map((metric) => (
            <div key={metric.label} className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                {metric.label}
              </p>

              <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                {metric.value}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {metric.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Visualization Studio
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Case performance charts
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    These visualizations help organizations quickly understand
                    workload, closure activity, service demand, and document
                    blockers.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                  Excel export ready
                </span>
              </div>

              <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <TrendLineChart data={trendData} />

                <CompletionDonut
                  completed={completedCases.length}
                  open={openCases.length}
                />
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Service Breakdown
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Active cases by service line
              </h2>

              <div className="mt-7">
                <HorizontalBarChart
                  rows={serviceBreakdown}
                  emptyMessage="No active service workload"
                />
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Status Distribution
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Cases by status
              </h2>

              <div className="mt-7">
                <HorizontalBarChart
                  rows={statusChartRows}
                  emptyMessage="No case statuses available"
                />
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Staff Workload
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Team capacity view
                  </h2>
                </div>

                <Link
                  href="/app/cases"
                  className="w-fit rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Manage queue
                </Link>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="divide-y divide-slate-100">
                  {staffWorkload.length > 0 ? (
                    staffWorkload.map((staff) => (
                      <div
                        key={staff.name}
                        className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_0.8fr_1fr] md:items-center"
                      >
                        <div>
                          <p className="text-base font-black text-slate-950">
                            {staff.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {staff.role}
                          </p>
                        </div>

                        <p className="text-sm font-black text-slate-700">
                          {staff.cases}
                        </p>

                        <p className="text-sm font-semibold text-slate-500">
                          {staff.alert}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <p className="text-base font-black text-slate-950">
                        No active staff workload
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Open cases will appear here when they exist.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Completed Cases
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Recent closures
                  </h2>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="divide-y divide-slate-100">
                  {recentCompletedCases.length > 0 ? (
                    recentCompletedCases.map((caseItem) => (
                      <Link
                        key={caseItem.id}
                        href={getCaseHref(caseItem.case_number)}
                        className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 md:grid-cols-[0.7fr_1fr_0.8fr] md:items-center"
                      >
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {caseItem.case_number}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {caseItem.client_first_name}{" "}
                            {caseItem.client_last_name}
                          </p>
                        </div>

                        <p className="text-sm font-black text-slate-700">
                          {caseItem.decision_outcome ?? "Completed"}
                        </p>

                        <p className="text-sm font-semibold text-slate-500">
                          {formatUpdatedAt(caseItem.updated_at)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <p className="text-base font-black text-slate-950">
                        No completed cases yet
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Completed case records will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Operational Signal
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                {missingDocuments.length > 0
                  ? "Document gaps need attention."
                  : "No document blockers right now."}
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                {missingDocuments.length > 0
                  ? "The largest workflow delay comes from missing or review-needed client documentation."
                  : "All currently tracked document checklist items are marked received."}
              </p>

              <div className="mt-6 rounded-3xl bg-white/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Recommended Action
                </p>

                <p className="mt-2 text-lg font-black leading-7 text-white">
                  {missingDocuments.length > 0
                    ? "Prioritize document follow-up before new assignments."
                    : "Monitor new intake and keep closure activity moving."}
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

              <div className="mt-6">
                <HorizontalBarChart
                  rows={documentGaps}
                  emptyMessage="No missing documents"
                />
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Excel Workbook
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Comprehensive export
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Download a multi-sheet Excel file with summary metrics, case
                records, document records, workload, service distribution,
                status distribution, document gaps, and trend data.
              </p>

              <button
                type="button"
                onClick={handleDownloadExcel}
                className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Download Excel workbook
              </button>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}