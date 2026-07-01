"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

type CaseStatus =
  | "New Intake"
  | "In Review"
  | "Assigned"
  | "Waiting on Client"
  | "Completed";

type CasePriority = "Low" | "Medium" | "High" | "Urgent";

type CivicCase = {
  id: string;
  client: string;
  email: string;
  service: string;
  status: CaseStatus;
  priority: CasePriority;
  assignedTo: string;
  updated: string;
  missingDocs: number;
  href: string;
};

const cases: CivicCase[] = [
  {
    id: "CF-1001",
    client: "Angela Brooks",
    email: "angela.brooks@example.org",
    service: "Eligibility Review",
    status: "In Review",
    priority: "Medium",
    assignedTo: "Maya Johnson",
    updated: "Today · 10:04 AM",
    missingDocs: 2,
    href: "/app/cases/case-1001",
  },
  {
    id: "CF-1002",
    client: "Marcus Hill",
    email: "marcus.hill@example.org",
    service: "Document Processing",
    status: "New Intake",
    priority: "High",
    assignedTo: "Unassigned",
    updated: "Today · 9:42 AM",
    missingDocs: 3,
    href: "/app/cases/case-1001",
  },
  {
    id: "CF-1003",
    client: "Nadia Spencer",
    email: "nadia.spencer@example.org",
    service: "Benefits Navigation",
    status: "Waiting on Client",
    priority: "Medium",
    assignedTo: "Daniel Reeves",
    updated: "Yesterday · 4:18 PM",
    missingDocs: 1,
    href: "/app/cases/case-1001",
  },
  {
    id: "CF-1004",
    client: "Robert Ellis",
    email: "robert.ellis@example.org",
    service: "Referral Request",
    status: "Assigned",
    priority: "Low",
    assignedTo: "Aisha Carter",
    updated: "Yesterday · 2:51 PM",
    missingDocs: 0,
    href: "/app/cases/case-1001",
  },
  {
    id: "CF-1005",
    client: "Grace Morgan",
    email: "grace.morgan@example.org",
    service: "General Case Support",
    status: "Completed",
    priority: "Low",
    assignedTo: "Eligibility Review Team",
    updated: "Jun 29 · 11:20 AM",
    missingDocs: 0,
    href: "/app/cases/case-1001",
  },
];

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

const filters = [
  "All",
  "New Intake",
  "In Review",
  "Assigned",
  "Waiting on Client",
  "Completed",
] as const;

type FilterValue = (typeof filters)[number];

export default function CasesPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return cases.filter((caseItem) => {
      const matchesFilter =
        activeFilter === "All" || caseItem.status === activeFilter;

      const matchesSearch =
        normalizedQuery.length === 0 ||
        caseItem.id.toLowerCase().includes(normalizedQuery) ||
        caseItem.client.toLowerCase().includes(normalizedQuery) ||
        caseItem.email.toLowerCase().includes(normalizedQuery) ||
        caseItem.service.toLowerCase().includes(normalizedQuery) ||
        caseItem.assignedTo.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, query]);

  const openCases = cases.filter((caseItem) => caseItem.status !== "Completed");
  const unassignedCases = cases.filter(
    (caseItem) => caseItem.assignedTo === "Unassigned"
  );
  const missingDocumentCases = cases.filter(
    (caseItem) => caseItem.missingDocs > 0
  );

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
                Manage intake submissions, staff assignments, workflow status,
                missing documents, and case movement from one clean queue.
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
            ["Total cases", cases.length.toString(), "All demo records"],
            ["Open cases", openCases.length.toString(), "Not yet completed"],
            [
              "Unassigned",
              unassignedCases.length.toString(),
              "Need staff owner",
            ],
            [
              "Missing docs",
              missingDocumentCases.length.toString(),
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
              {filteredCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={caseItem.href}
                  className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 xl:grid-cols-[1.1fr_1.1fr_0.8fr_0.9fr_0.8fr_0.6fr] xl:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black text-slate-950">
                        {caseItem.id}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${priorityStyles[caseItem.priority]}`}
                      >
                        {caseItem.priority}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-black text-slate-700">
                      {caseItem.client}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {caseItem.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {caseItem.service}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {caseItem.missingDocs === 0
                        ? "Documents complete"
                        : `${caseItem.missingDocs} missing document${
                            caseItem.missingDocs === 1 ? "" : "s"
                          }`}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusStyles[caseItem.status]}`}
                    >
                      {caseItem.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {caseItem.assignedTo}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {caseItem.updated}
                    </p>
                  </div>

                  <div className="xl:text-right">
                    <span className="inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">
                      View case
                    </span>
                  </div>
                </Link>
              ))}
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