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
    <main className="min-h-screen text-slate-900">
      <MarketingHeader />

      <section className="mx-auto max-w-[1440px] px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Use Cases
            </p>

            <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
              Built for teams that manage requests, documents, decisions, and
              reporting.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              CivicFlow is designed for organizations that have outgrown manual
              spreadsheets, scattered inboxes, and disconnected document
              tracking.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/request-demo" className="btn btn-primary px-6 py-3.5 text-base">
                Request demo
              </Link>

              <Link href="/platform" className="btn btn-secondary px-6 py-3.5 text-base">
                Explore platform
              </Link>
            </div>
          </div>

          <div className="premium-dark animate-fade-up lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Who it supports
            </p>

            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
              One system that can be shaped around many operating models.
            </h2>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {buyerTypes.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <p className="text-sm font-medium leading-6 text-blue-50/90">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-12">
        <div className="premium-card">
          <p className="eyebrow">Operating Scenarios</p>

          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900">
            Practical workflows CivicFlow can support.
          </h2>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {useCaseGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:border-blue-200 hover:shadow-[var(--shadow-md)]"
              >
                <p className="text-xl font-bold tracking-tight text-slate-900">
                  {group.title}
                </p>

                <p className="mt-2.5 text-sm leading-6 text-slate-600">
                  {group.description}
                </p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {group.examples.map((example) => (
                    <div
                      key={example}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-20">
        <div className="premium-dark lg:!p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                Demo Discussion
              </p>

              <h2 className="mt-3 max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
                Want to see how this could fit a specific agency, program, or
                service workflow?
              </h2>
            </div>

            <Link
              href="/request-demo"
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-blue-50"
            >
              Request demo
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
