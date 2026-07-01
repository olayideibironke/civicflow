"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function getCaseHref(caseNumber: string) {
  return `/app/cases/${caseNumber.toLowerCase()}`;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function isOpenCase(caseItem: CivicCase) {
  return caseItem.status !== "Completed";
}

export default function AppDashboardPage() {
  const [cases, setCases] = useState<CivicCase[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
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

    loadDashboardData();
  }, []);

  const openCases = useMemo(() => cases.filter(isOpenCase), [cases]);

  const newIntakes = useMemo(
    () => cases.filter((caseItem) => caseItem.status === "New Intake"),
    [cases]
  );

  const completedCases = useMemo(
    () => cases.filter((caseItem) => caseItem.status === "Completed"),
    [cases]
  );

  const unassignedCases = useMemo(
    () => cases.filter((caseItem) => caseItem.assigned_to === "Unassigned"),
    [cases]
  );

  const missingDocuments = useMemo(
    () => documents.filter((document) => document.status !== "Received"),
    [documents]
  );

  const casesWithDocumentGaps = useMemo(() => {
    return new Set(missingDocuments.map((document) => document.case_id));
  }, [missingDocuments]);

  const recentCases = useMemo(() => cases.slice(0, 5), [cases]);

  const workload = useMemo(() => {
    const activeCounts = openCases.reduce<Record<string, number>>(
      (accumulator, caseItem) => {
        if (!accumulator[caseItem.service_category]) {
          accumulator[caseItem.service_category] = 0;
        }

        accumulator[caseItem.service_category] += 1;
        return accumulator;
      },
      {}
    );

    return Object.entries(activeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [openCases]);

  const metrics = [
    {
      label: "Open cases",
      value: openCases.length.toString(),
      detail: `${unassignedCases.length} unassigned`,
    },
    {
      label: "New intakes",
      value: newIntakes.length.toString(),
      detail: "Awaiting first staff action",
    },
    {
      label: "Missing documents",
      value: missingDocuments.length.toString(),
      detail: `${casesWithDocumentGaps.size} case${
        casesWithDocumentGaps.size === 1 ? "" : "s"
      } affected`,
    },
    {
      label: "Completed",
      value: completedCases.length.toString(),
      detail: "Closed case records",
    },
  ];

  const workflowCards = [
    {
      title: "Public intake",
      description:
        "Collect service requests, client information, and document placeholders through a branded public form.",
      href: "/intake",
      action: "Open intake",
    },
    {
      title: "Case queue",
      description:
        "Review submitted cases, filter by status, assign staff, and prioritize work across the organization.",
      href: "/app/cases",
      action: "View cases",
    },
    {
      title: "Reports",
      description:
        "Track workload, open cases, document gaps, completion activity, and service workflow performance.",
      href: "/app/reports",
      action: "View reports",
    },
  ];

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Loading Dashboard
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Connecting dashboard to Supabase...
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-600">
            CivicFlow is loading real cases, documents, and workload metrics
            from your database.
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
        <section className="premium-card overflow-hidden">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                CivicFlow Operations
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Real-time workspace for intake, cases, documents, and service
                workflows.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                This dashboard is now connected to Supabase and reflects real
                case records created through staff workflows and public intake.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/app/cases"
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
                >
                  Open case queue
                </Link>

                <Link
                  href="/intake"
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Launch public intake
                </Link>
              </div>
            </div>

            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Today’s Snapshot
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
                Supabase is live.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                CivicFlow now has a working data loop: public intake, staff case
                creation, case queue, dynamic case pages, document review, and
                completion status.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Cases with Gaps
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {casesWithDocumentGaps.size}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Unassigned
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {unassignedCases.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Product Modules
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Core workflow areas
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    These modules now sit on top of the CivicFlow Supabase case
                    management foundation.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                  Database connected
                </span>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {workflowCards.map((card) => (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="text-lg font-black text-slate-950">
                      {card.title}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {card.description}
                    </p>

                    <p className="mt-5 text-sm font-black text-slate-950">
                      {card.action} →
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Recent Activity
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Latest case movement
                  </h2>
                </div>

                <Link
                  href="/app/cases"
                  className="w-fit rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  View all
                </Link>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="divide-y divide-slate-100">
                  {recentCases.length > 0 ? (
                    recentCases.map((caseItem) => (
                      <Link
                        key={caseItem.id}
                        href={getCaseHref(caseItem.case_number)}
                        className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 md:grid-cols-[0.7fr_1fr_0.8fr_0.8fr] md:items-center"
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

                        <div>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                            {caseItem.status}
                          </span>
                        </div>

                        <p className="text-sm font-black text-slate-700">
                          {caseItem.assigned_to}
                        </p>

                        <p className="text-sm font-semibold text-slate-500">
                          {formatUpdatedAt(caseItem.updated_at)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <p className="text-base font-black text-slate-950">
                        No cases yet
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Create a case or submit public intake to populate the
                        dashboard.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Workload
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Service queues
              </h2>

              <div className="mt-6 space-y-3">
                {workload.length > 0 ? (
                  workload.map(([name, count]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-sm font-black text-slate-950">
                        {name}
                      </p>
                      <p className="text-sm font-bold text-slate-500">
                        {count} active
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-black text-slate-950">
                      No active service queues
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Completed cases are no longer counted as active workload.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Next Build Step
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Reports should be next.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                The dashboard is now database-backed. Next, the reports page can
                calculate real workload, completion, document gaps, and service
                distribution from Supabase.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}