import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const groups = [
  {
    title: "Litigation and court-heavy practices",
    description: "Keep matter status, deadlines, documents, follow-ups, staff assignments, and activity visible in one workspace.",
    examples: ["Criminal defense", "Family law", "Civil litigation", "Traffic and DUI"],
  },
  {
    title: "Client and document-heavy practices",
    description: "Use structured intake, document tracking, status workflows, staff notes, and reporting to reduce repeated administrative work.",
    examples: ["Immigration", "Estate planning", "Probate", "Business services"],
  },
  {
    title: "Growing small firms",
    description: "Give a growing team more operational structure than basic case tracking without adding enterprise implementation complexity.",
    examples: ["Solo firms", "2-5 attorneys", "6-10 attorneys", "Lean support teams"],
  },
  {
    title: "Firms leaving fragmented tools",
    description: "Consolidate case records, documents, assignments, follow-ups, intake, and reporting so staff spend less time rebuilding context between systems.",
    examples: ["Spreadsheet-heavy firms", "Shared-drive workflows", "Inbox-driven work", "Multiple point tools"],
  },
];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader />

      <section className="mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
        <div className="grid gap-9 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">Built for small law firms</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              A flexible operating workspace that fits different practice areas.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              CivicFlow gives small firms a shared foundation for matters, documents, staff activity, follow-ups, intake, and reporting while leaving room for each practice to organize its own workflow.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="btn btn-primary px-6 py-3.5 text-base">Get started</Link>
              <Link href="/platform" className="btn btn-secondary px-6 py-3.5 text-base">Explore platform</Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">A practical fit</p>
            <h2 className="mt-4 text-2xl font-bold text-white">For firms that need better structure without a heavier software stack.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              CivicFlow is especially well suited to solo and small multi-attorney firms that want cleaner matter organization, stronger staff coordination, and straightforward pricing.
            </p>
          </div>
        </div>

        <section className="mt-12 premium-card">
          <p className="eyebrow">Operating scenarios</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {groups.map((group) => (
              <article key={group.title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{group.title}</h2>
                <p className="mt-2.5 text-sm leading-6 text-slate-600">{group.description}</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {group.examples.map((example) => (
                    <div key={example} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      {example}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 premium-dark lg:!p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Choose your plan</p>
              <h2 className="mt-3 max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
                Start at $30 per user per month and move up only when your firm needs more depth.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                CivicFlow Basic, Pro, and Advanced give firms a clear pricing path without making the buying process difficult to understand.
              </p>
            </div>
            <Link href="/pricing" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-blue-50">
              Compare plans <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
