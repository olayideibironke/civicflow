import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const modules = [
  ["Matter workspace", "Keep contacts, parties, notes, tasks, documents, dates, communication, and financial context around one matter record."],
  ["Client intake", "Move from lead or prospective client information into conflicts, intake, engagement, and a clean matter without duplicate entry."],
  ["Documents", "Plan for matter storage, document automation, OCR, eSignature, structured folders, and fast retrieval from web or mobile."],
  ["Billing and payments", "Bring time, flat fees, invoices, payments, balances, trust workflows, and matter economics into the same system."],
  ["Client communication", "Unify secure portal access, texting, updates, intake communication, signatures, and payment conversations."],
  ["Workflow automation", "Turn repeatable firm procedures into simple workflows and use AI to propose administrative actions for human review."],
  ["Reporting and intelligence", "Answer firm questions about revenue, workloads, aging matters, balances, referral performance, and profitability without building spreadsheets."],
  ["Mobile and court workflows", "Design the phone experience for real legal work, including quick matter access and secure offline-ready workflows where appropriate."],
  ["Migration verification", "Compare imported matters, contacts, documents, balances, tasks, and dates against the source system and surface discrepancies before cutover."],
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="platform" />

      <section className="mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
        <div className="grid gap-9 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">Platform concept</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              A legal operating system designed around the work, not the software modules.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              The validation concept combines the workflows small firms already pay multiple products or higher tiers to handle. Simplicity is a requirement, not a tradeoff for depth.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/early-access" className="btn btn-primary px-6 py-3.5 text-base">Join early access</Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">Review pricing</Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Design principle</p>
            <h2 className="mt-4 text-2xl font-bold text-white">More capability. Fewer places to click.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              A feature only counts if an attorney or staff member can complete the full workflow reliably. The goal is to remove handoffs between separate products, spreadsheets, inboxes, and manual reconciliation wherever the economics make sense.
            </p>
          </div>
        </div>

        <section className="mt-12 premium-card">
          <p className="eyebrow">Planned system</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900">The capabilities being validated before full development</h2>
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
            <p className="eyebrow">What already exists underneath</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">CivicFlow is not starting from an empty repository.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The current codebase already contains authentication, Supabase-backed case records, document handling, notes, follow-ups, staff workflows, reporting, exports, and production deployment. The legal product would reuse suitable foundations while replacing civic-specific data concepts with legal-domain architecture only after validation passes.
            </p>
          </div>

          <div className="premium-card">
            <p className="eyebrow">What is not being claimed</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">This page is a product-direction test.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Billing, trust accounting, legal calendaring, conflict checking, legal-domain AI, verified migrations, and mobile court workflows are planned capabilities, not finished production features. Early Access interest helps determine whether Westforge should complete that conversion.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
