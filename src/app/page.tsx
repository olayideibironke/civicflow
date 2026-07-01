import Link from "next/link";

const productAreas = [
  {
    title: "Public intake",
    description:
      "Launch branded forms for clients, residents, applicants, or service users to submit requests and documentation.",
  },
  {
    title: "Case management",
    description:
      "Track every request from intake to assignment, review, follow-up, and completion.",
  },
  {
    title: "Document workflows",
    description:
      "Organize required records, missing items, staff review, and document completion status.",
  },
  {
    title: "Reporting dashboards",
    description:
      "Monitor open cases, workload, service performance, missing documents, and staff capacity.",
  },
];

const useCases = [
  "Community service organizations",
  "Workforce and benefits programs",
  "Housing and resident services",
  "Grant-funded case workflows",
  "Document-heavy service teams",
  "Public-facing intake operations",
];

const stats = [
  ["24", "Open demo cases"],
  ["11", "New intakes this week"],
  ["17", "Missing document items"],
  ["38", "Completed this month"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)]">
      <header className="border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
              CF
            </div>

            <div>
              <p className="text-lg font-black leading-none text-slate-950">
                CivicFlow
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                by Westforge
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#platform"
              className="text-sm font-black text-slate-600 transition hover:text-slate-950"
            >
              Platform
            </a>
            <a
              href="#use-cases"
              className="text-sm font-black text-slate-600 transition hover:text-slate-950"
            >
              Use cases
            </a>
            <a
              href="#demo"
              className="text-sm font-black text-slate-600 transition hover:text-slate-950"
            >
              Demo
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/intake"
              className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
            >
              Public intake
            </Link>

            <Link
              href="/app"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
        <div>
          <div className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
            Premium workflow SaaS
          </div>

          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
            Intake, case management, documents, and reporting in one clean
            workspace.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-600">
            CivicFlow helps organizations manage service requests from the first
            public intake submission through staff assignment, document review,
            case tracking, notes, statuses, and performance reporting.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app"
              className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              View product dashboard
            </Link>

            <Link
              href="/intake"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Try public intake
            </Link>
          </div>
        </div>

        <div className="premium-dark">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
            CivicFlow Demo Snapshot
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
            Built for teams that cannot afford messy workflows.
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            The current MVP demo shows the core operating loop: public intake,
            case queue, case detail workspace, document checklist, notes,
            status controls, and reports.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="mt-2 text-sm font-bold text-slate-300">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="premium-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Platform
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                One workflow layer for service operations.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                CivicFlow is designed for organizations that need structure,
                accountability, clean handoffs, and professional case tracking.
              </p>
            </div>

            <Link
              href="/app/cases"
              className="w-fit rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              View case queue
            </Link>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productAreas.map((area) => (
              <div
                key={area.title}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <p className="text-lg font-black text-slate-950">
                  {area.title}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="use-cases"
        className="mx-auto grid max-w-[1440px] gap-6 px-6 py-8 lg:grid-cols-[0.85fr_1.15fr]"
      >
        <div className="premium-dark">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
            Westforge SaaS Direction
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
            CivicFlow is bigger than a simple form tool.
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            The product is positioned as a serious operating system for
            workflow-heavy service teams that need intake, documents, cases,
            staff assignment, and reporting under one roof.
          </p>
        </div>

        <div className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Ideal Use Cases
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Built for real operational environments.
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {useCases.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-white p-4"
              >
                <p className="text-sm font-black text-slate-950">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-[1440px] px-6 py-8 pb-14">
        <div className="premium-card">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Demo Flow
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                Explore the current CivicFlow MVP.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Start with public intake, review the internal dashboard, open
                the case queue, inspect a case, then review reports.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href="/intake"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Start intake
              </Link>

              <Link
                href="/app"
                className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Open workspace
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}