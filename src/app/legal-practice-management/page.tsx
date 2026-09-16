import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

export const metadata: Metadata = {
  title: "Legal Practice Management Software for Small Law Firms",
  description:
    "Explore CivicFlow's early-access legal practice management concept for small firms: matters, billing, intake, documents, client communication, automation, reporting, mobile workflows, AI, and migration verification in one platform.",
  alternates: {
    canonical: "/legal-practice-management",
  },
};

const capabilities = [
  ["Matter management", "Keep contacts, notes, tasks, deadlines, documents, communications, and financial context together around the matter."],
  ["Billing and payments", "Support time-based and flat-fee work, balances, payment workflows, reporting, and planned trust-accounting capabilities."],
  ["Client intake and communication", "Bring intake, portal access, texting, signatures, updates, and payment communication into the same operating layer."],
  ["Documents and automation", "Organize matter documents while planning OCR, document automation, eSignature, workflow triggers, and source-grounded AI."],
  ["Reporting and firm intelligence", "Make operational and financial questions easier to answer without forcing small firms into spreadsheets or separate reporting products."],
  ["Mobile and court workflows", "Treat mobile work as a first-class experience, including planned secure offline-ready workflows for court-heavy practices."],
];

export default function LegalPracticeManagementPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader />

      <section className="mx-auto max-w-[1240px] px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">Legal practice management software</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Run the firm in one operating system instead of a growing stack of legal software.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              CivicFlow is validating a modern practice-management platform for small law firms that combines the everyday work of matters, billing, intake, documents, client communication, automation, reporting, mobile workflows, and AI without forcing routine capabilities into a maze of paid upgrades.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/early-access" className="btn btn-primary px-6 py-3.5 text-base">
                Join early access
              </Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">
                See planned pricing
              </Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Validation proposition
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white">
              Planned from $69 per attorney per month.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The price is a market-validation hypothesis, not a final commercial promise. Our direction is simple: include ordinary firm capabilities in the core product and use transparent fair-use allowances only for unusually heavy metered consumption.
            </p>
            <div className="mt-7 grid gap-3">
              {["No credit card", "No sales call required", "No claim that the full product is already built", "Temporary CivicFlow name during validation"].map((item) => (
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
            The goal is not more features. It is fewer handoffs between products.
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
            <p className="eyebrow">Considering MyCase?</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">See the MyCase alternative hypothesis.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Review the pricing and product differences we are testing for firms already evaluating MyCase alternatives.
            </p>
            <Link href="/mycase-alternative" className="btn btn-primary mt-6">Compare the approach</Link>
          </div>

          <div className="premium-card">
            <p className="eyebrow">Considering Clio?</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">See the Clio alternative hypothesis.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Explore whether a more consolidated product and a simpler pricing structure would be compelling enough to switch.
            </p>
            <Link href="/clio-alternative" className="btn btn-primary mt-6">Compare the approach</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
