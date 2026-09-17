import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const plans = [
  {
    name: "Basic",
    tagline: "Organize the essentials and keep daily firm work moving.",
    price: "$30",
    compareAt: "$50",
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
    tagline: "Add deeper workflows, visibility, and team coordination.",
    price: "$80",
    compareAt: "$100",
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
    tagline: "Give larger or more complex firms stronger operational control.",
    price: "$100",
    compareAt: "$130",
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
    <main className="min-h-screen bg-white text-slate-950">
      <MarketingHeader activePage="pricing" />

      <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-slate-600">CivicFlow plans</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Clear pricing for the way your firm works.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Start with the workflow depth your firm needs today and move up when your team needs more control, reporting, or coordination.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-3">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`relative p-7 sm:p-8 ${
                index > 0 ? "border-t border-slate-200 lg:border-l lg:border-t-0" : ""
              } ${plan.featured ? "bg-slate-50/70" : "bg-white"}`}
            >
              {plan.featured ? (
                <div className="absolute left-0 right-0 top-0 bg-slate-950 py-1.5 text-center text-xs font-semibold text-white">
                  Most popular
                </div>
              ) : null}

              <div className={plan.featured ? "pt-4" : ""}>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  CivicFlow {plan.name}
                </h2>
                <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-slate-600">
                  {plan.tagline}
                </p>

                <div className="mt-7 flex items-end gap-3">
                  <span className="text-5xl font-bold tracking-tight text-slate-950">
                    {plan.price}
                  </span>
                  <span className="pb-1.5 text-lg font-semibold text-slate-400 line-through decoration-2">
                    {plan.compareAt}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">USD / user / month</p>

                <Link
                  href={`/get-started?plan=${plan.name.toLowerCase()}`}
                  className={`mt-7 flex w-full items-center justify-center rounded-lg border px-5 py-3 text-sm font-semibold transition ${
                    plan.featured
                      ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
                      : "border-slate-300 bg-white text-slate-950 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  Get started
                </Link>

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <p className="text-sm font-semibold text-slate-950">What you get</p>
                  <ul className="mt-4 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          className="mt-1 h-4 w-4 shrink-0 text-slate-700"
                          aria-hidden="true"
                        >
                          <path
                            d="m5 10.5 3.2 3.2L15 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-10 grid border-y border-slate-200 py-8 md:grid-cols-3">
          <Info
            title="Built for small firms"
            text="A focused workspace for firms that want strong day-to-day visibility without enterprise complexity."
          />
          <Info
            title="Simple upgrade path"
            text="Move between Basic, Pro, and Advanced as your team and workflow needs grow."
          />
          <Info
            title="Predictable monthly cost"
            text="Straightforward per-user pricing keeps budgeting simple as your firm adds people."
          />
        </section>

        <section className="mt-12 flex flex-col gap-6 rounded-2xl bg-slate-950 px-7 py-8 text-white sm:px-9 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to set up your firm?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              Tell us about your team and the plan you want, and we will help you map the right CivicFlow setup.
            </p>
          </div>
          <Link
            href="/get-started"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Get started
          </Link>
        </section>
      </section>
    </main>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-4 py-4 first:pl-0 last:pr-0 md:border-l md:border-slate-200 md:px-7 md:first:border-l-0">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
