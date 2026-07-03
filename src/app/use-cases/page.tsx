import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const useCaseGroups = [
  {
    title: "Public service intake",
    description:
      "For teams that receive requests from residents, clients, applicants, vendors, or community members and need a clean intake-to-review workflow.",
    examples: [
      "Community assistance requests",
      "Eligibility screening",
      "Resident service requests",
      "Benefits navigation",
    ],
  },
  {
    title: "Document-heavy case review",
    description:
      "For programs that depend on collecting, reviewing, and tracking required documents before staff can make a decision.",
    examples: [
      "Document checklists",
      "Missing document follow-up",
      "Review-needed tracking",
      "Case completion readiness",
    ],
  },
  {
    title: "Program operations tracking",
    description:
      "For managers who need visibility into active workload, staff assignment, blocked cases, overdue actions, and program performance.",
    examples: [
      "Staff workload dashboards",
      "Follow-up accountability",
      "Open case visibility",
      "Excel reporting exports",
    ],
  },
  {
    title: "Referral and service coordination",
    description:
      "For organizations that route requests, track assignments, and coordinate service outcomes across internal or partner teams.",
    examples: [
      "Referral tracking",
      "Partner service coordination",
      "Case status visibility",
      "Operational handoffs",
    ],
  },
];

const buyerTypes = [
  "Government program offices",
  "County and municipal departments",
  "Nonprofits and community organizations",
  "Compliance and review teams",
  "Service coordination teams",
  "Administrative operations units",
];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] text-slate-950">
      <MarketingHeader />

      <section className="mx-auto max-w-[1440px] px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-blue-700">
              Use Cases
            </p>

            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-6xl">
              Built for teams that manage requests, documents, decisions, and
              reporting.
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-600">
              CivicFlow is designed for organizations that have outgrown manual
              spreadsheets, scattered inboxes, and disconnected document
              tracking.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/request-demo"
                className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Request demo
              </Link>

              <Link
                href="/platform"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Explore platform
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
              Who it supports
            </p>

            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
              One system that can be shaped around many operating models.
            </h2>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {buyerTypes.map((item) => (
                <div key={item} className="rounded-3xl bg-white/10 p-5">
                  <p className="text-sm font-black leading-6 text-blue-50">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-xl shadow-slate-200/60 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Operating Scenarios
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950">
            Practical workflows CivicFlow can support.
          </h2>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {useCaseGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-3xl border border-slate-200 bg-white p-6"
              >
                <p className="text-2xl font-black tracking-tight text-slate-950">
                  {group.title}
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {group.description}
                </p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {group.examples.map((example) => (
                    <div
                      key={example}
                      className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700"
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-16">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Demo Discussion
              </p>

              <h2 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white">
                Want to see how this could fit a specific agency, program, or
                service workflow?
              </h2>
            </div>

            <Link
              href="/request-demo"
              className="w-fit rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-lg shadow-black/10 transition hover:bg-blue-50"
            >
              Request demo →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}