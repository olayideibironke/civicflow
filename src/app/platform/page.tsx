import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const platformModules = [
  {
    title: "Public intake portal",
    description:
      "Launch branded intake forms that collect client information, service requests, priority levels, and required details before staff review.",
  },
  {
    title: "Case queue",
    description:
      "Give staff a structured queue for open cases, statuses, assignments, document blockers, follow-ups, and priority triage.",
  },
  {
    title: "Case workspace",
    description:
      "Centralize notes, document tracking, workflow decisions, follow-up actions, and case activity in one operational record.",
  },
  {
    title: "Document tracking",
    description:
      "Track missing, received, and review-needed documents with upload support and organized case-level visibility.",
  },
  {
    title: "Follow-up management",
    description:
      "Create internal follow-ups, due dates, note types, overdue signals, and accountability views for staff action.",
  },
  {
    title: "Reports and exports",
    description:
      "View charts, workload metrics, document gaps, follow-up metrics, and export operational data to Excel.",
  },
];

const deliverySteps = [
  "Discovery and workflow mapping",
  "Portal and database configuration",
  "Staff dashboard and case workflow setup",
  "Reporting and export configuration",
  "Deployment, testing, and training",
  "Support and improvement cycle",
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader />

      <section className="mx-auto max-w-[1440px] px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Platform
            </p>

            <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
              A complete workflow layer for intake, cases, documents, and
              reporting.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              CivicFlow gives organizations the structure they need to replace
              scattered spreadsheets, inboxes, document folders, and manual
              follow-up tracking with one professional operating system.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/request-demo" className="btn btn-primary px-6 py-3.5 text-base">
                Request demo
              </Link>

              <Link href="/use-cases" className="btn btn-secondary px-6 py-3.5 text-base">
                View use cases
              </Link>
            </div>
          </div>

          <div className="premium-dark animate-fade-up lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              What the platform solves
            </p>

            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
              Cleaner operations for teams with high-volume service work.
            </h2>

            <div className="mt-7 grid gap-3">
              {[
                "Too many requests arrive through email or paper forms.",
                "Staff cannot quickly see what is overdue or blocked.",
                "Documents are tracked manually across folders and spreadsheets.",
                "Leadership needs reliable reporting without waiting for manual summaries.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                      <path d="M8 3v6m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <p className="text-sm leading-6 text-blue-50/90">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-12">
        <div className="premium-card">
          <p className="eyebrow">Core Modules</p>

          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900">
            Everything needed to run a modern case workflow.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformModules.map((module) => (
              <div
                key={module.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:border-blue-200 hover:shadow-[var(--shadow-md)]"
              >
                <p className="text-lg font-semibold text-slate-900">
                  {module.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Implementation
            </p>

            <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
              Westforge can configure CivicFlow around the actual workflow.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              The platform can be adapted for government programs, service
              organizations, nonprofits, compliance workflows, and internal
              operations teams.
            </p>
          </div>

          <div className="premium-card">
            <div className="grid gap-2.5">
              {deliverySteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>

                  <p className="text-sm font-medium text-slate-800">{step}</p>
                </div>
              ))}
            </div>

            <Link href="/request-demo" className="btn btn-primary mt-6">
              Request implementation discussion
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
