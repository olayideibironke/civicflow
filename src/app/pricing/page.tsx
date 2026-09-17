import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const plans = [
  {
    name: "Basic",
    tagline: "The essentials for running a modern small law firm.",
    price: "$30",
    featured: false,
    features: [
      "Matter and contact management",
      "Case notes and follow-ups",
      "Document tracking and organization",
      "Tasks and staff assignments",
      "Client intake workflows",
      "Standard reporting and exports",
      "Secure staff workspace",
    ],
  },
  {
    name: "Pro",
    tagline: "More workflow depth for growing firms and busy teams.",
    price: "$80",
    featured: true,
    features: [
      "Everything in Basic",
      "Advanced workflow tracking",
      "Expanded intake and case routing",
      "Team workload visibility",
      "Advanced document workflows",
      "Expanded reporting views",
      "Priority onboarding support",
    ],
  },
  {
    name: "Advanced",
    tagline: "Deeper control, reporting, and operational visibility.",
    price: "$100",
    featured: false,
    features: [
      "Everything in Pro",
      "Advanced firm reporting",
      "Organization-level controls",
      "Data export and migration assistance",
      "Priority data onboarding",
      "Advanced administrative controls",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="pricing" />

      <section className="mx-auto max-w-[1380px] px-6 py-16 lg:py-20">
        <div className="text-center">
          <p className="eyebrow text-blue-600">Straightforward pricing</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Serious law-practice software with pricing that is easy to understand.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Choose the level of workflow depth your firm needs. Every plan is built around the same goal: keep legal work organized, visible, and easier to manage without unnecessary complexity.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative overflow-hidden rounded-[2rem] border p-7 shadow-[var(--shadow-lg)] sm:p-8 ${
                plan.featured
                  ? "border-blue-300 bg-blue-50/55 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.featured ? (
                <div className="absolute right-6 top-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                  Popular
                </div>
              ) : null}

              <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-600">
                CivicFlow {plan.name}
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{plan.tagline}</h2>

              <div className="mt-7">
                <span className="text-6xl font-black tracking-tight text-slate-950">{plan.price}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">USD / user / month</p>

              <Link
                href={`/get-started?plan=${plan.name.toLowerCase()}`}
                className={`mt-7 inline-flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-sm font-black transition ${
                  plan.featured
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                Get started with {plan.name}
              </Link>

              <div className="mt-8 border-t border-slate-200/80 pt-7">
                <p className="text-sm font-black text-slate-950">What you get</p>
                <div className="mt-4 grid gap-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">✓</span>
                      <p className="text-sm leading-6 text-slate-700">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <Info title="Built for small firms" text="Designed for solo attorneys and growing firms that want strong operational visibility without enterprise complexity." />
          <Info title="Simple upgrade path" text="Move between Basic, Pro, and Advanced as your team and workflow needs grow." />
          <Info title="Clear monthly cost" text="Know what each plan costs and choose the level of operational depth that fits your firm." />
        </section>

        <section className="mt-12 rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Ready to move?</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Bring your firm into one cleaner operating workspace.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Tell us about your firm, your current setup, and the plan you want. We will help you map the right CivicFlow setup.
              </p>
            </div>
            <Link href="/get-started" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-blue-50">
              Get started
            </Link>
          </div>
        </section>
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
