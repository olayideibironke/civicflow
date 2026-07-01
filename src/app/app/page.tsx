import Link from "next/link";
import AppShell from "@/components/AppShell";

const metrics = [
  {
    label: "Open cases",
    value: "24",
    detail: "8 require staff follow-up",
  },
  {
    label: "New intakes",
    value: "11",
    detail: "Submitted this week",
  },
  {
    label: "Missing documents",
    value: "17",
    detail: "Across active cases",
  },
  {
    label: "Completed",
    value: "38",
    detail: "Closed this month",
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

const recentCases = [
  {
    id: "CF-1001",
    client: "Angela Brooks",
    status: "In Review",
    owner: "Maya Johnson",
    updated: "Today · 10:04 AM",
  },
  {
    id: "CF-1002",
    client: "Marcus Hill",
    status: "New Intake",
    owner: "Unassigned",
    updated: "Today · 9:42 AM",
  },
  {
    id: "CF-1003",
    client: "Nadia Spencer",
    status: "Waiting on Client",
    owner: "Daniel Reeves",
    updated: "Yesterday · 4:18 PM",
  },
];

const workload = [
  ["Eligibility Review", "9 active cases"],
  ["Document Processing", "6 active cases"],
  ["Benefits Navigation", "5 active cases"],
  ["Referral Requests", "4 active cases"],
];

export default function AppDashboardPage() {
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
                A premium workspace for intake, cases, documents, and service
                workflows.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                CivicFlow gives organizations a clean operating layer for
                receiving requests, tracking cases, assigning staff, managing
                document requirements, and reporting on service delivery.
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
                Work is moving.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                This demo dashboard shows the type of operational view CivicFlow
                can provide once connected to Supabase data.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    SLA Risk
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">3</p>
                </div>

                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Unassigned
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">5</p>
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
                    These modules represent the first CivicFlow product loop:
                    intake to case review to reporting.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                  MVP buildout
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
                  {recentCases.map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      href="/app/cases/case-1001"
                      className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 md:grid-cols-[0.7fr_1fr_0.8fr_0.8fr] md:items-center"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {caseItem.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {caseItem.client}
                        </p>
                      </div>

                      <div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                          {caseItem.status}
                        </span>
                      </div>

                      <p className="text-sm font-black text-slate-700">
                        {caseItem.owner}
                      </p>

                      <p className="text-sm font-semibold text-slate-500">
                        {caseItem.updated}
                      </p>
                    </Link>
                  ))}
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
                {workload.map(([name, count]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-sm font-black text-slate-950">{name}</p>
                    <p className="text-sm font-bold text-slate-500">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Next Build Step
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Supabase-ready structure
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Once the front-end screens are stable, CivicFlow can move into
                database tables for organizations, profiles, cases, notes,
                documents, statuses, and activity logs.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}