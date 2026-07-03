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
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] text-slate-950">
      <MarketingHeader />

      <section className="mx-auto max-w-[1440px] px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-blue-700">
              Platform
            </p>

            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-6xl">
              A complete workflow layer for intake, cases, documents, and
              reporting.
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-600">
              CivicFlow gives organizations the structure they need to replace
              scattered spreadsheets, inboxes, document folders, and manual
              follow-up tracking with one professional operating system.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/request-demo"
                className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Request demo
              </Link>

              <Link
                href="/use-cases"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                View use cases
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
              What the platform solves
            </p>

            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
              Cleaner operations for teams with high-volume service work.
            </h2>

            <div className="mt-8 grid gap-4">
              {[
                "Too many requests arrive through email or paper forms.",
                "Staff cannot quickly see what is overdue or blocked.",
                "Documents are tracked manually across folders and spreadsheets.",
                "Leadership needs reliable reporting without waiting for manual summaries.",
              ].map((item) => (
                <div key={item} className="rounded-3xl bg-white/10 p-5">
                  <p className="text-sm font-bold leading-7 text-blue-50">
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
            Core Modules
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950">
            Everything needed to run a modern case workflow.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformModules.map((module) => (
              <div
                key={module.title}
                className="rounded-3xl border border-slate-200 bg-white p-6"
              >
                <p className="text-xl font-black text-slate-950">
                  {module.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
              Implementation
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
              Westforge can configure CivicFlow around the actual workflow.
            </h2>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              The platform can be adapted for government programs, service
              organizations, nonprofits, compliance workflows, and internal
              operations teams.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-xl shadow-slate-200/60 backdrop-blur">
            <div className="grid gap-3">
              {deliverySteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <p className="text-sm font-black text-slate-950">{step}</p>
                </div>
              ))}
            </div>

            <Link
              href="/request-demo"
              className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Request implementation discussion
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}