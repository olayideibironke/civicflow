import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

export default function ClioAlternativePage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="clio" />

      <section className="mx-auto max-w-[1220px] px-6 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">Clio alternative</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              A cleaner, lower-cost practice-management option for growing small firms.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              CivicFlow gives small law firms one organized workspace for matters, documents, intake, staff activity, follow-ups, and reporting, with straightforward pricing from $30 per user per month.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="btn btn-primary px-6 py-3.5 text-base">Get started</Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">Compare plans</Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Built for small firms</p>
            <h2 className="mt-4 text-2xl font-bold text-white">Get the structure your firm needs without enterprise-style overhead.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              CivicFlow focuses on the day-to-day operational layer: matter visibility, documents, team coordination, follow-ups, intake, reporting, and a clear pricing ladder that is easy to understand.
            </p>
            <a href="https://www.clio.com/pricing/" target="_blank" rel="noreferrer" className="mt-6 inline-flex text-sm font-semibold text-white underline decoration-blue-300/50 underline-offset-4 hover:text-blue-100">
              Review current Clio pricing
            </a>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card title="Lower starting price" text="Basic starts at $30 per user per month, giving smaller firms an accessible entry point." />
          <Card title="One operating workspace" text="Keep cases, documents, notes, assignments, follow-ups, intake, and reporting connected." />
          <Card title="Straightforward tiers" text="Basic, Pro, and Advanced are priced at $30, $80, and $100 per user per month." />
          <Card title="Built to stay simple" text="The interface is designed for firms that need operational depth without making staff fight the software." />
        </div>

        <div className="mt-12 premium-card">
          <p className="eyebrow">What makes a switch worthwhile?</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Daily work has to become easier, not merely cheaper.</h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
            CivicFlow combines lower pricing with a focused small-firm operating model. The goal is to help your team see the matter, the documents, the activity, and the next action without building another complicated software stack.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/platform" className="btn btn-secondary">Explore the platform</Link>
            <Link href="/get-started" className="btn btn-primary">Get started</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="premium-card">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
