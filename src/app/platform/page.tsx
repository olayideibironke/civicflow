import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const modules = [
  ["Matter workspace", "Keep client information, case status, notes, documents, assignments, follow-ups, and activity around one matter record."],
  ["Client intake", "Capture new client information in a structured workflow and move it into the firm's operating workspace without losing context."],
  ["Document tracking", "Organize matter documents, track document status, identify gaps, and keep files connected to the work they support."],
  ["Team workflow", "Assign work, track priorities, follow up on open items, and give staff a shared view of what needs attention."],
  ["Reporting", "See case activity, workload, status, and operational trends through built-in reports and exports."],
  ["Organization controls", "Keep staff inside the right firm workspace with organization-aware records and administrative settings."],
  ["Data exports", "Export operational data when your firm needs additional analysis, backup workflows, or reporting outside the platform."],
  ["Migration support", "Map existing records into CivicFlow with a controlled onboarding process instead of starting your firm over from scratch."],
  ["Growing-firm foundation", "Use the same core system as your team expands from a solo practice into a multi-user operation."],
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="platform" />

      <section className="mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
        <div className="grid gap-9 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">Platform</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              A cleaner operating system for the everyday work of a small law firm.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              CivicFlow brings matters, documents, intake, staff activity, follow-ups, reporting, and operational visibility into one organized workspace built to stay understandable as the firm grows.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="btn btn-primary px-6 py-3.5 text-base">Get started</Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">Compare plans</Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Design principle</p>
            <h2 className="mt-4 text-2xl font-bold text-white">More visibility. Fewer places to click.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              CivicFlow is designed around complete operational workflows instead of forcing staff to rebuild the same picture across email, spreadsheets, folders, and disconnected task lists.
            </p>
          </div>
        </div>

        <section className="mt-12 premium-card">
          <p className="eyebrow">Core system</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900">The operating pieces your team uses every day</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map(([title, description], index) => (
              <article key={title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">{String(index + 1).padStart(2, "0")}</div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="premium-card">
            <p className="eyebrow">For attorneys</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Open the matter and understand what is happening.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Keep the case record, documents, current status, assignments, notes, and follow-up work connected so important context is easier to find.
            </p>
          </div>

          <div className="premium-card">
            <p className="eyebrow">For staff</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Know what needs attention without chasing updates.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Shared queues, assignments, follow-up dates, document status, and reporting help the team move work forward with fewer manual handoffs.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Bring the firm together</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Choose the plan that fits your team.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Basic starts at $30, Pro at $80, and Advanced at $100 per user per month.
              </p>
            </div>
            <Link href="/pricing" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-blue-50">
              View pricing
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
