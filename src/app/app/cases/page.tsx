"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type CaseStatus =
  | "New Intake"
  | "In Review"
  | "Assigned"
  | "Waiting on Client"
  | "Completed";

type CasePriority = "Low" | "Medium" | "High" | "Urgent";

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

const filters = [
  "All",
  "New Intake",
  "In Review",
  "Assigned",
  "Waiting on Client",
  "Completed",
] as const;

type FilterValue = (typeof filters)[number];

const statusStyles: Record<CaseStatus, string> = {
  "New Intake": "border-blue-200 bg-blue-50 text-blue-700",
  "In Review": "border-amber-200 bg-amber-50 text-amber-700",
  Assigned: "border-purple-200 bg-purple-50 text-purple-700",
  "Waiting on Client": "border-orange-200 bg-orange-50 text-orange-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<CasePriority, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-amber-50 text-amber-700",
  Urgent: "bg-rose-50 text-rose-700",
};

function normalizeStatus(value: string): CaseStatus {
  if (
    value === "New Intake" ||
    value === "In Review" ||
    value === "Assigned" ||
    value === "Waiting on Client" ||
    value === "Completed"
  ) {
    return value;
  }

  return "New Intake";
}

function normalizePriority(value: string): CasePriority {
  if (
    value === "Low" ||
    value === "Medium" ||
    value === "High" ||
    value === "Urgent"
  ) {
    return value;
  }

  return "Medium";
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCaseHref(caseNumber: string) {
  return `/app/cases/${caseNumber.toLowerCase()}`;
}

export default function CasesPage() {
  const [cases, setCases] = useState<CivicCase[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadCases() {
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

    loadCases();
  }, []);

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

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return cases.filter((caseItem) => {
      const status = normalizeStatus(caseItem.status);

      const matchesFilter = activeFilter === "All" || status === activeFilter;

      const clientName =
        `${caseItem.client_first_name} ${caseItem.client_last_name}`.toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        caseItem.case_number.toLowerCase().includes(normalizedQuery) ||
        clientName.includes(normalizedQuery) ||
        (caseItem.client_email ?? "").toLowerCase().includes(normalizedQuery) ||
        caseItem.service_category.toLowerCase().includes(normalizedQuery) ||
        caseItem.assigned_to.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, cases, query]);

  const openCases = cases.filter(
    (caseItem) => normalizeStatus(caseItem.status) !== "Completed"
  );

  const unassignedCases = cases.filter(
    (caseItem) => caseItem.assigned_to === "Unassigned"
  );

  const missingDocumentCaseIds = new Set(
    documents
      .filter((document) => document.status !== "Received")
      .map((document) => document.case_id)
  );

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Loading Cases
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Connecting to Supabase...
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-600">
            CivicFlow is loading real case records from your Supabase database.
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
            Cases could not be loaded.
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
                Case Queue
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Cases
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                This queue is connected to Supabase and displays real case
                records, assignment status, document gaps, and workflow movement.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
              <Link
                href="/intake"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Public intake
              </Link>

              <Link
                href="/app/cases/new"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Create case
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total cases", cases.length.toString(), "Supabase records"],
            ["Open cases", openCases.length.toString(), "Not yet completed"],
            [
              "Unassigned",
              unassignedCases.length.toString(),
              "Need staff owner",
            ],
            [
              "Missing docs",
              missingDocumentCaseIds.size.toString(),
              "Require follow-up",
            ],
          ].map(([label, value, detail]) => (
            <div key={label} className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                {label}
              </p>

              <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                {value}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
            </div>
          ))}
        </section>

        <section className="premium-card">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Search and Filter
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Staff working queue
              </h2>
            </div>

            <div className="w-full xl:max-w-md">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by case, client, service, or staff..."
                className="input-field mt-0"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-[1.1fr_1.1fr_0.8fr_0.9fr_0.8fr_0.6fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 xl:grid">
              <p>Case</p>
              <p>Service</p>
              <p>Status</p>
              <p>Assigned</p>
              <p>Updated</p>
              <p className="text-right">Action</p>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredCases.map((caseItem) => {
                const status = normalizeStatus(caseItem.status);
                const priority = normalizePriority(caseItem.priority);
                const caseDocuments = documentsByCaseId[caseItem.id] ?? [];
                const missingDocs = caseDocuments.filter(
                  (document) => document.status !== "Received"
                ).length;

                return (
                  <Link
                    key={caseItem.id}
                    href={getCaseHref(caseItem.case_number)}
                    className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 xl:grid-cols-[1.1fr_1.1fr_0.8fr_0.9fr_0.8fr_0.6fr] xl:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-slate-950">
                          {caseItem.case_number}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${priorityStyles[priority]}`}
                        >
                          {priority}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-black text-slate-700">
                        {caseItem.client_first_name} {caseItem.client_last_name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {caseItem.client_email ?? "No email on file"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {caseItem.service_category}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {missingDocs === 0
                          ? "Documents complete"
                          : `${missingDocs} missing document${
                              missingDocs === 1 ? "" : "s"
                            }`}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusStyles[status]}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {caseItem.assigned_to}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        {formatUpdatedAt(caseItem.updated_at)}
                      </p>
                    </div>

                    <div className="xl:text-right">
                      <span className="inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">
                        View case
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredCases.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-lg font-black text-slate-950">
                  No cases found
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Try another search term or status filter.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}