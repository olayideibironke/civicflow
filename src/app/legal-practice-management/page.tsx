import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

export const metadata: Metadata = {
  title: "Legal Practice Management Software for Small Law Firms",
  description:
    "CivicFlow gives small law firms one organized platform for matters, documents, staff activity, intake, follow-ups, reporting, and firm operations, with plans starting at $30 per user per month.",
  alternates: {
    canonical: "/legal-practice-management",
  },
};

const capabilities = [
  ["Matter management", "Keep client information, matter status, notes, assignments, documents, and follow-ups connected to the same record."],
  ["Document tracking", "Organize documents around the matter, track document status, and make missing information easier to spot."],
  ["Client intake", "Capture new client information in a structured workflow and keep it connected to the firm's operational process."],
  ["Team coordination", "Give attorneys and staff shared visibility into assignments, priorities, open follow-ups, and recent activity."],
  ["Reporting and exports", "See workload and case activity through built-in reports and export data when the firm needs deeper analysis."],
  ["Organization workspace", "Keep firm records and staff activity organized inside one shared operating environment."],
];

export default function LegalPracticeManagementPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="practice-management" />

      <section className="mx-auto max-w-[1240px] px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">Legal practice management software</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Run your law firm in one cleaner operating workspace.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              CivicFlow helps small firms organize matters, documents, intake, staff activity, follow-ups, and reporting without forcing the team to rebuild the same information across spreadsheets, inboxes, and disconnected tools.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="btn btn-primary px-6 py-3.5 text-base">
                Get started
              </Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">
                View plans
              </Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Straightforward pricing
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white">
              Basic $30. Pro $80. Advanced $100.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Choose the level of workflow depth your firm needs and keep the upgrade path easy to understand.
            </p>
            <div className="mt-7 grid gap-3">
              {["Built for solo and small firms", "Matter-centered workspace", "Structured document and follow-up tracking", "Reporting and data exports"].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.06] p-4 text-sm font-medium text-blue-50/90">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 pb-14">
        <div className="premium-card">
          <p className="eyebrow">One connected workflow</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-slate-950">
            Keep the information your team needs connected to the work.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="premium-card">
            <p className="eyebrow">Built for daily legal work</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">See the matter, the team activity, and the next action in one place.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              CivicFlow keeps the operational picture visible so attorneys and staff spend less time reconstructing what happened and what needs attention next.
            </p>
            <Link href="/platform" className="btn btn-primary mt-6">Explore the platform</Link>
          </div>

          <div className="premium-card">
            <p className="eyebrow">Move with confidence</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">Choose a plan that fits the firm you run today.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Start with the workflow depth you need, bring over the information that matters, and expand the workspace as your team grows.
            </p>
            <Link href="/get-started" className="btn btn-primary mt-6">Get started</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
