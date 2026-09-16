import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const included = [
  "Matter and contact management",
  "Tasks, notes, calendar, and deadlines",
  "Billing and payments",
  "Client intake and portal",
  "Document management and automation",
  "eSignature",
  "Text and client communication",
  "Workflow automation",
  "Reporting and firm intelligence",
  "Mobile workflows",
  "API and webhooks",
  "Embedded AI",
  "Migration verification",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="pricing" />

      <section className="mx-auto max-w-[1180px] px-6 py-16 lg:py-20">
        <div className="text-center">
          <p className="eyebrow text-blue-600">Validation pricing</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            One capable product instead of a ladder of paid feature gates.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            We are testing whether small law firms prefer a straightforward full-suite plan rather than paying more each time they need intake, automation, texting, reporting, AI, or integrations.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[var(--shadow-lg)] sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-600">Planned core plan</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-black tracking-tight text-slate-950">$69</span>
                <span className="pb-2 text-sm font-semibold text-slate-500">per attorney / month</span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                Support-staff access is planned to be included on qualifying firm plans instead of charging every assistant or paralegal at the full attorney rate. Exact limits will be set only after usage economics are validated.
              </p>
            </div>

            <Link href="/early-access" className="btn btn-primary px-6 py-3.5 text-base">Join early access</Link>
          </div>

          <div className="mt-9 grid gap-3 border-t border-slate-100 pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                <span className="mt-0.5 text-blue-600">✓</span>
                <p className="text-sm font-semibold leading-6 text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Info title="No credit card" text="This page is testing product and price interest. Nothing is being sold yet." />
          <Info title="No final promise" text="The $69 price is a validation hypothesis and may change before commercial launch." />
          <Info title="No feature bait" text="Our direction is to include everyday firm capabilities in the core product rather than hide them behind avoidable upgrades." />
        </div>

        <div className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm font-semibold leading-7 text-blue-900">
            CivicFlow is currently an early-stage validation shell. The final legal product name, commercial terms, feature limits, and launch schedule have not been finalized.
          </p>
        </div>
      </section>
    </main>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="premium-card">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
