import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const outcomes = [
  {
    title: "Run every matter",
    description:
      "Keep matters, contacts, tasks, calendar activity, notes, and deadlines together without a maze of disconnected screens.",
  },
  {
    title: "Handle the money",
    description:
      "Plan for billing, trust workflows, payments, balances, flat-fee visibility, and firm reporting in the same operating system.",
  },
  {
    title: "Manage every document",
    description:
      "Bring document storage, intake, automation, eSignature, OCR, and matter context into one consistent workflow.",
  },
  {
    title: "Keep clients connected",
    description:
      "Unify intake, secure portal access, client updates, texting, signatures, and payment communication.",
  },
  {
    title: "Work anywhere",
    description:
      "Design mobile and court workflows as first-class experiences, including secure offline-ready access where it matters.",
  },
  {
    title: "Remove the busywork",
    description:
      "Use workflows and embedded AI to propose updates, reports, tasks, communications, and administrative actions for review.",
  },
];

const included = [
  "Matter and contact management",
  "Billing and payments",
  "Client intake and portal",
  "Document management",
  "eSignature",
  "Text and client communication",
  "Workflow automation",
  "Reporting and firm intelligence",
  "iOS and Android experience",
  "API and webhooks",
  "Embedded AI",
  "Migration verification",
];

export default function Home() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="home" />

      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-24">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Early access validation
          </div>

          <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
            Everything your law firm needs. One product. One straightforward price.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            CivicFlow is being evaluated as a modern practice-management platform for small law firms. The goal is to combine matters, billing, intake, documents, automation, client communication, reporting, mobile workflows, and AI without forcing firms through an expensive feature maze.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/early-access" className="btn btn-primary px-6 py-3.5 text-base">
              Join early access
            </Link>
            <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">
              See planned pricing
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500">
            <span className="flex items-center gap-2"><CheckIcon /> Planned from $69 per attorney/month</span>
            <span className="flex items-center gap-2"><CheckIcon /> No credit card</span>
            <span className="flex items-center gap-2"><CheckIcon /> Product in validation</span>
          </div>
        </div>

        <div className="premium-dark animate-fade-up lg:!p-9">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
            One platform
          </p>
          <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
            More capability without making the firm operate more software.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            The product concept is deliberately simple: one core operating system for the everyday work of a small law firm, with transparent pricing and fewer paid feature gates.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {included.slice(0, 8).map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200"><CheckIcon /></span>
                <p className="text-sm font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>

          <Link href="/platform" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-blue-50">
            Explore the concept <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1440px] px-6 pb-12">
        <div className="premium-card">
          <p className="eyebrow">Designed around outcomes</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900">
                The feature list matters less than whether the workflow actually works.
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Our validation is focused on recurring gaps attorneys already report across practice-management platforms: pricing complexity, documents, billing, reporting, mobile reliability, integrations, and fragmented workflows.
              </p>
            </div>
            <Link href="/early-access" className="btn btn-primary shrink-0">Join early access</Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {outcomes.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-12">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Planned pricing</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-black tracking-tight text-white">$69</span>
              <span className="pb-1 text-sm text-slate-300">per attorney / month</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              This is a validation price, not a final commercial commitment. We are testing whether firms prefer one capable platform at a clear price instead of paying more to unlock everyday features.
            </p>
            <Link href="/pricing" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-blue-50">
              Review pricing concept <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="premium-card">
            <p className="eyebrow">Included in the concept</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><CheckIcon /></span>
                  <p className="text-sm font-medium text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 pb-20">
        <div className="premium-card text-center">
          <p className="eyebrow">Help validate the direction</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900">
            Already comparing practice-management platforms?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Join early access if this pricing and product direction is relevant to your firm. No purchase is required, and the product is still in validation and development.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/mycase-alternative" className="btn btn-secondary">Considering MyCase alternatives?</Link>
            <Link href="/clio-alternative" className="btn btn-secondary">Considering Clio alternatives?</Link>
            <Link href="/early-access" className="btn btn-primary">Join early access</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m5 10.5 3.2 3.2L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
