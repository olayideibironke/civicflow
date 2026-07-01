import Link from "next/link";
import AppShell from "@/components/AppShell";

const reportMetrics = [
  {
    label: "Open cases",
    value: "24",
    detail: "Active workload",
  },
  {
    label: "Completed this month",
    value: "38",
    detail: "Closed service cases",
  },
  {
    label: "Avg. response time",
    value: "1.8d",
    detail: "Across active queues",
  },
  {
    label: "Document gaps",
    value: "17",
    detail: "Missing required items",
  },
];

const serviceBreakdown = [
  {
    name: "Eligibility Review",
    count: 9,
    percent: 78,
  },
  {
    name: "Document Processing",
    count: 6,
    percent: 52,
  },
  {
    name: "Benefits Navigation",
    count: 5,
    percent: 44,
  },
  {
    name: "Referral Requests",
    count: 4,
    percent: 36,
  },
];

const statusBreakdown = [
  ["New Intake", "11 cases", "border-blue-200 bg-blue-50 text-blue-700"],
  ["In Review", "8 cases", "border-amber-200 bg-amber-50 text-amber-700"],
  ["Assigned", "5 cases", "border-purple-200 bg-purple-50 text-purple-700"],
  [
    "Waiting on Client",
    "6 cases",
    "border-orange-200 bg-orange-50 text-orange-700",
  ],
  ["Completed", "38 cases", "border-emerald-200 bg-emerald-50 text-emerald-700"],
];

const staffWorkload = [
  {
    name: "Maya Johnson",
    role: "Eligibility reviewer",
    cases: "9 active",
    alert: "2 missing docs",
  },
  {
    name: "Daniel Reeves",
    role: "Benefits navigator",
    cases: "7 active",
    alert: "1 waiting client",
  },
  {
    name: "Aisha Carter",
    role: "Referral specialist",
    cases: "5 active",
    alert: "On track",
  },
  {
    name: "Review Team",
    role: "Shared queue",
    cases: "3 active",
    alert: "Needs assignment",
  },
];

const documentGaps = [
  {
    document: "Program eligibility form",
    cases: "7 cases",
  },
  {
    document: "Supporting records",
    cases: "5 cases",
  },
  {
    document: "Proof of address",
    cases: "3 cases",
  },
  {
    document: "Photo identification",
    cases: "2 cases",
  },
];

export default function ReportsPage() {
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
                Track workload, status movement, document gaps, staff capacity,
                response times, and service delivery performance across the
                organization.
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
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Export report
              </button>
            </div>
          </div>
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
                    Service Breakdown
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Active cases by service line
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    This section shows which service workflows are carrying the
                    highest workload.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                  Live report preview
                </span>
              </div>

              <div className="mt-7 space-y-5">
                {serviceBreakdown.map((service) => (
                  <div key={service.name}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black text-slate-950">
                        {service.name}
                      </p>
                      <p className="text-sm font-bold text-slate-500">
                        {service.count} active
                      </p>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-950"
                        style={{ width: `${service.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Status Movement
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Case status summary
              </h2>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {statusBreakdown.map(([status, count, style]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${style}`}
                    >
                      {status}
                    </span>

                    <p className="text-sm font-black text-slate-700">
                      {count}
                    </p>
                  </div>
                ))}
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
                  {staffWorkload.map((staff) => (
                    <div
                      key={staff.name}
                      className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_0.8fr_0.8fr] md:items-center"
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
                  ))}
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
                Document gaps are the main blocker.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                The largest delay across active cases is missing client
                documentation. CivicFlow can later convert this into automated
                reminders and staff follow-up queues.
              </p>

              <div className="mt-6 rounded-3xl bg-white/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Recommended Action
                </p>

                <p className="mt-2 text-lg font-black leading-7 text-white">
                  Prioritize missing document follow-up before new assignment.
                </p>
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Document Gaps
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Missing items
              </h2>

              <div className="mt-6 space-y-3">
                {documentGaps.map((gap) => (
                  <div
                    key={gap.document}
                    className="rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-sm font-black text-slate-950">
                      {gap.document}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {gap.cases}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Export Options
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Report outputs
              </h2>

              <div className="mt-6 grid gap-3">
                {["Case workload CSV", "Document gap report", "Monthly performance summary"].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      className="rounded-3xl border border-slate-200 bg-white p-4 text-left text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}