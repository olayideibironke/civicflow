import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const highlights = [
  ["Matter management", "Keep contacts, status, notes, assignments, and follow-ups together."],
  ["Documents", "Track documents and file activity without relying on scattered folders."],
  ["Team coordination", "Give attorneys and staff a shared view of priorities and open work."],
  ["Client intake", "Move new matters into a consistent intake and case workflow."],
  ["Reporting", "Review workload, case status, and operational trends from one workspace."],
  ["Client portal", "Share selected matter updates and documents with invited clients."],
];

const plans = [
  ["Basic", "$30", "$50"],
  ["Pro", "$80", "$100"],
  ["Advanced", "$100", "$130"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <MarketingHeader activePage="home" />

      <section className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <p className="text-sm font-semibold text-slate-600">Law practice management for small firms</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-[1.03] tracking-tight text-slate-950 sm:text-6xl">
            Run your law firm from one clear workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            CivicFlow brings matters, documents, staff activity, follow-ups, intake, reporting, and client access into one organized system with plans starting at $30 per user per month.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/get-started"
              className="rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Get started
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              View pricing
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
            <Stat value="$30" label="Starting monthly price" />
            <Stat value="3" label="Clear plan levels" />
            <Stat value="1" label="Workspace for daily firm operations" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">CivicFlow workspace</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">See the firm clearly.</h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Practice workspace</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Matter management", "Organized"],
              ["Documents", "Centralized"],
              ["Client access", "Controlled"],
              ["Reporting", "Exportable"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-950">Today&apos;s work</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <Task text="Review new intake submissions" />
              <Task text="Follow up on pending case documents" />
              <Task text="Prepare client-visible matter updates" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-slate-600">Built around daily legal work</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Fewer disconnected tools. Better visibility across the firm.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              CivicFlow focuses on the operational work small firms repeat every day and keeps the experience straightforward for attorneys, staff, and invited clients.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map(([title, description]) => (
              <div key={title} className="bg-white p-6 sm:p-7">
                <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600">Straightforward pricing</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Choose the plan that fits your firm today.
            </h2>
          </div>
          <Link href="/pricing" className="text-sm font-semibold text-slate-950 hover:underline">
            View full pricing →
          </Link>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid md:grid-cols-3">
          {plans.map(([name, price, compareAt], index) => (
            <div
              key={name}
              className={`p-7 ${index > 0 ? "border-t border-slate-200 md:border-l md:border-t-0" : ""}`}
            >
              <p className="text-lg font-semibold text-slate-950">{name}</p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-4xl font-bold tracking-tight text-slate-950">{price}</span>
                <span className="pb-1 text-base font-semibold text-slate-400 line-through">{compareAt}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">per user / month</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-2xl bg-slate-950 px-7 py-9 text-white sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to bring your firm into CivicFlow?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              Tell us about your team and the workflow you want to improve first.
            </p>
          </div>
          <Link
            href="/get-started"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{label}</p>
    </div>
  );
}

function Task({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-2 w-2 rounded-full bg-slate-400" />
      <span>{text}</span>
    </div>
  );
}
