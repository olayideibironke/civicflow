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
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] text-slate-950">
      <MarketingHeader />

      <section className="mx-auto grid max-w-[1440px] gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-blue-700">
            Premium Workflow SaaS
          </div>

          <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[1.03] tracking-tight text-slate-950 sm:text-6xl xl:text-7xl">
            Intake, case management, documents, and reporting in one clean
            workspace.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-600">
            CivicFlow helps organizations manage service requests from the first
            public intake submission through staff assignment, document review,
            case tracking, notes, statuses, follow-ups, and performance
            reporting.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/request-demo"
              className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Request demo
            </Link>

            <Link
              href="/platform"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Explore platform
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20 ring-1 ring-white/10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
            CivicFlow Product Snapshot
          </p>

          <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white xl:text-5xl">
            Built for teams that cannot afford messy workflows.
          </h2>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            CivicFlow demonstrates the operating loop Westforge can deliver:
            intake, case queues, case detail workspaces, document tracking,
            notes, follow-ups, reports, charts, and Excel exports.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {proofItems.map(([label, detail]) => (
              <div key={label} className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-black text-white">{label}</p>
                <p className="mt-2 text-sm font-bold text-blue-100">{detail}</p>
              </div>
            ))}
          </div>

          <Link
            href="/request-demo"
            className="mt-8 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-black/10 transition hover:bg-blue-50"
          >
            Request a walkthrough →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-xl shadow-slate-200/60 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Platform
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950">
                One workflow layer for service operations.
              </h2>

              <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
                CivicFlow supports teams that need a professional system for
                intake, case routing, documentation, review, approvals,
                reporting, and operational visibility.
              </p>
            </div>

            <Link
              href="/platform"
              className="w-fit rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              View platform details
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-white p-6"
              >
                <p className="text-xl font-black text-slate-950">
                  {card.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
              Use Cases
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
              Flexible enough for public service and private operations.
            </h2>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              Westforge can shape CivicFlow into multiple workflow SaaS lanes:
              intake portals, compliance desks, case management systems,
              document intake vaults, and reporting dashboards.
            </p>

            <Link
              href="/use-cases"
              className="mt-7 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-black/10 transition hover:bg-blue-50"
            >
              Explore use cases →
            </Link>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-xl shadow-slate-200/60 backdrop-blur">
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
                  className="rounded-3xl border border-slate-200 bg-white p-5"
                >
                  <p className="text-sm font-black text-slate-950">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}