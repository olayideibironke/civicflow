import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const featureCards = [
  {
    title: "Public intake",
    description:
      "Capture requests through branded forms with required field validation, clean client records, and case-ready submissions.",
  },
  {
    title: "Case management",
    description:
      "Move requests through assignment, statuses, notes, document review, follow-ups, decisions, and completion.",
  },
  {
    title: "Reporting",
    description:
      "Track workload, service demand, document gaps, follow-ups, cycle time, charts, and Excel exports.",
  },
];

const proofItems = [
  ["Cases", "Supabase-backed case records"],
  ["Documents", "Storage uploads and signed downloads"],
  ["Follow-ups", "Staff accountability and due dates"],
  ["Reports", "Charts and Excel export"],
];

export default function Home() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader />

      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Premium Workflow SaaS
          </div>

          <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
            Intake, case management, documents, and reporting in one clean
            workspace.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            CivicFlow helps organizations manage service requests from the first
            public intake submission through staff assignment, document review,
            case tracking, notes, statuses, follow-ups, and performance
            reporting.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/request-demo" className="btn btn-primary px-6 py-3.5 text-base">
              Request demo
            </Link>

            <Link href="/platform" className="btn btn-secondary px-6 py-3.5 text-base">
              Explore platform
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <CheckIcon /> Supabase-backed
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon /> Procurement-ready
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon /> Excel reporting
            </span>
          </div>
        </div>

        <div className="premium-dark animate-fade-up lg:!p-9">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
            CivicFlow Product Snapshot
          </p>

          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
            Built for teams that cannot afford messy workflows.
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            CivicFlow demonstrates the operating loop Westforge can deliver:
            intake, case queues, case detail workspaces, document tracking,
            notes, follow-ups, reports, charts, and Excel exports.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {proofItems.map(([label, detail]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
              >
                <p className="text-lg font-bold text-white">{label}</p>
                <p className="mt-1 text-xs leading-5 text-blue-100/80">{detail}</p>
              </div>
            ))}
          </div>

          <Link
            href="/request-demo"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-blue-50"
          >
            Request a walkthrough
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-12">
        <div className="premium-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Platform</p>

              <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900">
                One workflow layer for service operations.
              </h2>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                CivicFlow supports teams that need a professional system for
                intake, case routing, documentation, review, approvals,
                reporting, and operational visibility.
              </p>
            </div>

            <Link href="/platform" className="btn btn-primary shrink-0">
              View platform details
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {featureCards.map((card, index) => (
              <div
                key={card.title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:border-blue-200 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  {card.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Use Cases
            </p>

            <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
              Flexible enough for public service and private operations.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              Westforge can shape CivicFlow into multiple workflow SaaS lanes:
              intake portals, compliance desks, case management systems,
              document intake vaults, and reporting dashboards.
            </p>

            <Link
              href="/use-cases"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-blue-50"
            >
              Explore use cases
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="premium-card">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Community service intake",
                "Eligibility review workflows",
                "Document-heavy case processing",
                "Referral and service coordination",
                "Internal operations tracking",
                "Program performance reporting",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <CheckIcon />
                  </span>
                  <p className="text-sm font-medium text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-blue-500">
      <path
        d="m5 10.5 3.2 3.2L15 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
