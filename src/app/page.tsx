import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const outcomes = [
  {
    title: "Run every matter",
    description:
      "Keep matters, contacts, notes, assignments, documents, status, and follow-ups together in one organized workspace.",
  },
  {
    title: "Keep documents under control",
    description:
      "Track matter documents, document status, file activity, and missing items without scattering work across folders and spreadsheets.",
  },
  {
    title: "Keep the team aligned",
    description:
      "Give attorneys and staff a shared view of case activity, assignments, priorities, and the work that needs attention next.",
  },
  {
    title: "Stay ahead of follow-ups",
    description:
      "Track follow-up dates, completion status, open work, and overdue items so important tasks do not disappear into inboxes.",
  },
  {
    title: "See what is happening",
    description:
      "Use firm reporting and exports to understand workload, activity, case status, and operational trends without rebuilding the same spreadsheet every week.",
  },
  {
    title: "Work in one clean system",
    description:
      "CivicFlow brings the everyday operating pieces of a small law firm into a simpler workspace designed to reduce unnecessary software switching.",
  },
];

const included = [
  "Matter and contact management",
  "Document tracking",
  "Case notes",
  "Tasks and follow-ups",
  "Staff assignments",
  "Client intake workflows",
  "Reporting and exports",
  "Organization workspace",
];

const priceCards = [
  ["Basic", "$30"],
  ["Pro", "$80"],
  ["Advanced", "$100"],
];

export default function Home() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="home" />

      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-24">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Modern law practice management
          </div>

          <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
            Run your law firm with less software and a lower monthly bill.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            CivicFlow gives small law firms one clean workspace for matters, documents, staff activity, follow-ups, intake, and reporting, with straightforward plans starting at $30 per user per month.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/get-started" className="btn btn-primary px-6 py-3.5 text-base">
              Get started
            </Link>
            <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">
              View plans
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500">
            <span className="flex items-center gap-2"><CheckIcon /> Plans from $30/user/month</span>
            <span className="flex items-center gap-2"><CheckIcon /> Built for small law firms</span>
            <span className="flex items-center gap-2"><CheckIcon /> Clear upgrade path</span>
          </div>
        </div>

        <div className="premium-dark animate-fade-up lg:!p-9">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
            One platform
          </p>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
            Give your firm one place to manage the work that keeps moving.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            CivicFlow is designed for small firms that want strong case visibility, cleaner coordination, and straightforward software costs.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {included.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200"><CheckIcon /></span>
                <p className="text-sm font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>

          <Link href="/platform" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-blue-50">
            Explore the platform <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1440px] px-6 pb-12">
        <div className="premium-card">
          <p className="eyebrow">Built around daily work</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900">
                Good practice management should make the firm easier to operate.
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                CivicFlow focuses on the operational work small firms repeat every day: organizing matters, tracking documents, assigning work, recording activity, following up, and seeing what needs attention.
              </p>
            </div>
            <Link href="/get-started" className="btn btn-primary shrink-0">Get started</Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {outcomes.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-12">
        <div className="premium-dark lg:!p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Straightforward pricing</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Three plans with clear monthly pricing.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Start with the essentials, add more workflow depth as you grow, and keep your software spend predictable.
              </p>
            </div>
            <Link href="/pricing" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-blue-50">
              View full pricing <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {priceCards.map(([name, price]) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
                <p className="text-sm font-black text-blue-100">{name}</p>
                <div className="mt-4">
                  <span className="text-4xl font-black text-white">{price}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">per user / month</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-20">
        <div className="premium-card text-center">
          <p className="eyebrow">Built for the way small firms work</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900">
            Bring matters, documents, intake, follow-ups, staff activity, and reporting into one operating workspace.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Choose the CivicFlow plan that fits your firm today and grow into deeper workflow capabilities when you need them.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/platform" className="btn btn-secondary">Explore the platform</Link>
            <Link href="/pricing" className="btn btn-secondary">View pricing</Link>
            <Link href="/get-started" className="btn btn-primary">Get started</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m5 10.5 3.2 3.2L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
