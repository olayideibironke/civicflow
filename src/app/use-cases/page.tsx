import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const groups = [
  {
    title: "Litigation and court-heavy practices",
    description: "Matter timelines, deadlines, discovery tracking, documents, court preparation, post-hearing actions, and mobile access are central to the concept.",
    examples: ["Criminal defense", "Family law", "Civil litigation", "Traffic and DUI"],
  },
  {
    title: "Client and document-heavy practices",
    description: "Structured intake, document collection, signatures, status communication, workflow checklists, and matter reporting can reduce repeated administrative work.",
    examples: ["Immigration", "Estate planning", "Probate", "Business services"],
  },
  {
    title: "Flat-fee and hybrid billing firms",
    description: "The planned economics layer connects fees collected, time consumed, direct matter costs, outstanding balances, and future pricing intelligence.",
    examples: ["Flat-fee matters", "Payment plans", "Hybrid billing", "Matter profitability"],
  },
  {
    title: "Growing small firms",
    description: "The core ICP is a firm that needs more operational depth than simple case tracking but does not want enterprise implementation complexity.",
    examples: ["Solo firms", "2-5 attorneys", "6-10 attorneys", "Lean support teams"],
  },
];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader />

      <section className="mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
        <div className="grid gap-9 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">Who the concept is for</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Start with small law firms, then deepen workflows by practice area.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              The core platform is being validated broadly for small firms. Practice-area workflows can become deeper over time without forcing every firm into the same rigid process.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/early-access" className="btn btn-primary px-6 py-3.5 text-base">Join early access</Link>
              <Link href="/platform" className="btn btn-secondary px-6 py-3.5 text-base">Explore platform</Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Initial market</p>
            <h2 className="mt-4 text-2xl font-bold text-white">Small firms that already understand legal SaaS but want better value.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The broad validation target is solo to roughly ten-attorney firms, especially firms already paying for MyCase, Clio, PracticePanther, Smokeball, Filevine, or a fragmented mix of point tools.
            </p>
          </div>
        </div>

        <section className="mt-12 premium-card">
          <p className="eyebrow">Potential operating scenarios</p>
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
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Still validation</p>
              <h2 className="mt-3 max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
                Practice-area depth will follow evidence, not assumptions.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                This page describes directions under evaluation. It does not claim that every practice-specific workflow has already been built.
              </p>
            </div>
            <Link href="/early-access" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-blue-50">
              Join early access <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
