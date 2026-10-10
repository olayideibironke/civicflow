import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import ClosingCta from "@/components/marketing/ClosingCta";
import SiteFooter from "@/components/marketing/SiteFooter";
import { plans, securityControls } from "@/components/marketing/content";
import {
  ActivityTimeline,
  AppWindow,
  CaseDetailScreen,
  ClientAccessCard,
  ClientPortalScreen,
  DashboardScreen,
  DocumentChecklist,
  ExportCard,
  FloatCard,
  IntakeArrivalCard,
  IntakeFormCard,
  NoteCard,
  ReportsScreen,
} from "@/components/marketing/product";
import {
  ButtonLink,
  CheckList,
  Container,
  Eyebrow,
  Icon,
  IconTile,
  SectionIntro,
  TextLink,
  type IconName,
} from "@/components/marketing/ui";

const flow: { n: string; title: string; text: string; href: string; icon: IconName }[] = [
  { n: "01", title: "Intake", text: "A client submits your firm's intake link.", href: "#intake", icon: "intake" },
  { n: "02", title: "Matter", text: "A numbered case opens with a checklist.", href: "#matter", icon: "matter" },
  { n: "03", title: "Documents and activity", text: "Files, notes and follow-ups stay on record.", href: "#documents", icon: "document" },
  { n: "04", title: "Client access", text: "Clients see only what you choose to share.", href: "#client-access", icon: "client" },
  { n: "05", title: "Reporting", text: "Leaders see workload, gaps and throughput.", href: "#reporting", icon: "report" },
];

export default function Home() {
  return (
    <main className="mk min-h-screen">
      <MarketingHeader activePage="home" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mk-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[640px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <Container className="relative pt-14 sm:pt-20 lg:pt-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="mk-rise lg:col-span-7">
              <Eyebrow>Law practice management</Eyebrow>
              <h1 className="mk-h1 mt-6 text-ink">
                Run every matter from first intake to final decision.
              </h1>
            </div>
            <div className="mk-rise mk-rise-1 lg:col-span-5 lg:pb-2">
              <p className="mk-lead">
                CivicFlow gives attorneys and staff one disciplined workspace for intake, matters, documents and follow-ups, a secure portal for clients, and reporting that shows exactly where work stands.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/get-started" size="lg" arrow>
                  Get started
                </ButtonLink>
                <ButtonLink href="/platform" variant="outline" size="lg">
                  Explore the platform
                </ButtonLink>
              </div>
              <p className="mt-5 text-sm text-slate-500">
                Plans from $30 per user per month.{" "}
                <Link href="/pricing" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  See pricing
                </Link>
              </p>
            </div>
          </div>
        </Container>

        {/* Product stage */}
        <div className="relative mt-14 sm:mt-20">
          <div className="mk-dark absolute inset-x-0 bottom-0 top-[42%]" aria-hidden="true">
            <div className="mk-dark-grid absolute inset-0 opacity-70" />
          </div>
          <Container className="relative">
            <div className="mk-rise mk-rise-2 relative mx-auto max-w-[1120px] pb-16 sm:pb-24">
              <AppWindow
                url="civicflowapp.org/app"
                label="CivicFlow operations dashboard showing open cases, follow-ups, document gaps and workflow queues"
              >
                <DashboardScreen />
              </AppWindow>

              <FloatCard
                label="Case document checklist with received, needs review and missing items"
                className="absolute -right-6 top-[46%] hidden w-[300px] xl:block 2xl:-right-16"
              >
                <DocumentChecklist compact />
              </FloatCard>

              <FloatCard
                label="New matter created from client intake"
                className="absolute -left-10 bottom-[10%] hidden w-[268px] xl:block 2xl:-left-20"
              >
                <IntakeArrivalCard />
              </FloatCard>
            </div>
          </Container>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mk-dark border-t border-white/10">
        <Container>
          <ul className="grid gap-px overflow-hidden py-10 sm:grid-cols-2 lg:grid-cols-4 lg:py-12">
            {securityControls.slice(0, 4).map((c) => (
              <li key={c.title} className="flex items-start gap-3.5 py-3 lg:px-6 lg:first:pl-0 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:border-white/10">
                <IconTile name={c.icon} tone="dark" />
                <div>
                  <p className="text-[0.95rem] font-semibold text-white">{c.title}</p>
                  <p className="mt-1 text-[0.82rem] leading-5 text-slate-400">
                    {c.short}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Operating flow */}
      <section className="mk-section pb-0">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
            <SectionIntro
              eyebrow="How work moves"
              title="One continuous record, from the first form to the final report."
            />
            <p className="mk-lead lg:pb-1">
              Most firms stitch the work together across inboxes, spreadsheets and shared drives. In CivicFlow every step adds to the same matter, so nothing is retyped and nothing falls between people.
            </p>
          </div>

          <ol className="relative mt-14 grid gap-0 border-y border-line md:grid-cols-5">
            {flow.map((step) => (
              <li key={step.n} className="border-b border-line last:border-b-0 md:border-b-0 md:border-l md:first:border-l-0">
                <a href={step.href} className="mk-focus group flex h-full gap-4 py-6 md:block md:px-5 md:py-7 md:first:pl-0">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-navy transition group-hover:border-cobalt group-hover:text-cobalt">
                      <Icon name={step.icon} className="h-4 w-4" />
                    </span>
                    <span className="hidden font-mono text-[0.72rem] tracking-wider text-slate-400 md:inline">{step.n}</span>
                  </span>
                  <span className="block md:mt-5">
                    <span className="block text-[0.98rem] font-semibold text-ink">{step.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">{step.text}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* 01 Intake */}
      <section id="intake" className="mk-section scroll-mt-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
            <div>
              <ChapterLabel n="01" label="Intake" />
              <h2 className="mk-h2 mt-5 text-ink">New clients arrive organized, not as another email to sort.</h2>
              <p className="mk-lead mt-5">
                Share your firm&apos;s intake link. Each submission becomes a numbered matter in your queue with the client&apos;s details, matter type, priority and a document checklist already in place.
              </p>
              <CheckList
                className="mt-8"
                items={[
                  "A dedicated intake page for your firm",
                  "Matters open as New Intake with source recorded",
                  "Required documents listed from the start",
                  "Turn intake on or off from firm settings",
                ]}
              />
            </div>
            <div className="relative pb-10 sm:pb-0 sm:pr-10">
              <AppWindow url="civicflowapp.org/intake/harper-lane" label="CivicFlow public client intake form" className="max-w-[560px]">
                <IntakeFormCard />
              </AppWindow>
              <FloatCard
                label="Intake submission arriving in the case queue as a new matter"
                className="absolute -bottom-2 right-0 w-[250px] sm:-bottom-10 sm:w-[270px]"
              >
                <IntakeArrivalCard />
              </FloatCard>
            </div>
          </div>
        </Container>
      </section>

      {/* 02 Matter: full-width showcase */}
      <section id="matter" className="scroll-mt-20 border-y border-line bg-porcelain">
        <Container className="mk-section">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <ChapterLabel n="02" label="Matter" />
              <h2 className="mk-h2 mt-5 max-w-2xl text-ink">Open a case and understand it in seconds.</h2>
            </div>
            <p className="mk-lead lg:pb-1">
              Client, matter type, priority, status, assignment, documents and history sit on one screen. Attorneys stop reconstructing context and staff stop asking where things stand.
            </p>
          </div>
          <div className="mt-14">
            <AppWindow url="civicflowapp.org/app/cases/cf-1052" label="CivicFlow case detail with workflow control, document checklist, case health and activity timeline">
              <CaseDetailScreen />
            </AppWindow>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              ["Workflow control", "Move a case through New Intake, In Review, Assigned, Waiting on Client and Completed."],
              ["Case health", "Missing items, documents needing review and open follow-ups are counted for you."],
              ["Disciplined closure", "A case closes with a recorded outcome only when every required document is received."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-line-strong pt-5">
                <p className="mk-h3 text-ink">{t}</p>
                <p className="mt-2 text-[0.95rem] leading-7 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 03 Documents and activity */}
      <section id="documents" className="mk-section scroll-mt-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
            <div className="relative order-2 lg:order-1">
              <div className="grid gap-4 sm:grid-cols-[1fr_0.92fr] sm:items-start">
                <FloatCard label="Document checklist with completion progress" className="overflow-hidden">
                  <DocumentChecklist />
                </FloatCard>
                <div className="hidden gap-4 sm:mt-14 sm:grid">
                  <FloatCard label="Internal note with an open follow-up" className="overflow-hidden">
                    <NoteCard />
                  </FloatCard>
                  <FloatCard label="Case activity timeline" className="overflow-hidden">
                    <ActivityTimeline items={3} />
                  </FloatCard>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <ChapterLabel n="03" label="Documents and activity" />
              <h2 className="mk-h2 mt-5 text-ink">Know what is missing before it becomes a delay.</h2>
              <p className="mk-lead mt-5">
                Every matter carries a document checklist. Upload files directly to the item they satisfy, mark them received or needing review, and let follow-up dates keep the next step from slipping.
              </p>
              <CheckList
                className="mt-8"
                items={[
                  "Received, Needs Review and Missing at a glance",
                  "Typed internal notes with follow-up dates",
                  "Overdue follow-ups surfaced on the dashboard",
                  "An automatic timeline of every change",
                ]}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* 04 Client access */}
      <section id="client-access" className="mk-dark relative scroll-mt-20 overflow-hidden">
        <div className="mk-dark-grid mk-fade-mask pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container className="mk-section relative">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
            <div>
              <ChapterLabel n="04" label="Client access" dark />
              <h2 className="mk-h2 mt-5 text-white">Give clients clarity without giving up control.</h2>
              <p className="mk-lead mt-5 !text-slate-300">
                Invite a client to a specific matter with a secure, single-use link. They see status, their team and the documents and updates you choose. Everything else stays inside the firm.
              </p>
              <CheckList
                tone="dark"
                className="mt-8"
                items={[
                  "Invitations tied to the invited email address",
                  "Share documents and updates one item at a time",
                  "Internal notes are never shared",
                  "A separate, focused portal for clients",
                ]}
              />
            </div>
            <div className="relative">
              <AppWindow onDark url="civicflowapp.org/client/cases" label="CivicFlow client portal showing a matter's status, shared documents and shared updates" className="sm:mr-24 lg:mr-28">
                <ClientPortalScreen />
              </AppWindow>
              <FloatCard
                label="Staff controls for client-visible documents and updates"
                className="mk-frame-on-dark @container relative z-10 ml-6 -mt-10 w-auto sm:-mt-28 sm:ml-auto sm:w-[360px] lg:-mr-6"
              >
                <ClientAccessCard />
              </FloatCard>
            </div>
          </div>
        </Container>
      </section>

      {/* 05 Reporting */}
      <section id="reporting" className="mk-section scroll-mt-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <ChapterLabel n="05" label="Reporting and operations" />
              <h2 className="mk-h2 mt-5 text-ink">See the whole practice, not just the case in front of you.</h2>
            </div>
            <p className="mk-lead lg:pb-1">
              Track open and completed matters, cycle time, follow-up workload, document gaps and staff ownership. When you need to go deeper, download the full report as an Excel workbook.
            </p>
          </div>
          <div className="relative mt-14">
            <AppWindow url="civicflowapp.org/app/reports" label="CivicFlow performance dashboard with trend chart, completion mix and staff workload">
              <ReportsScreen />
            </AppWindow>
            <FloatCard label="Excel report export with multiple sheets" className="relative mx-auto -mt-6 w-[min(340px,92%)] lg:absolute lg:-bottom-8 lg:right-10 lg:mt-0">
              <ExportCard />
            </FloatCard>
          </div>
        </Container>
      </section>

      {/* Vantage points */}
      <section className="border-t border-line bg-porcelain">
        <Container className="mk-section">
          <SectionIntro
            eyebrow="Built for the whole firm"
            title="One system. Three clear points of view."
            lead="Each person sees the work the way their role requires, from the same source of truth."
          />
          <div className="mt-14 grid overflow-hidden rounded-[16px] border border-line bg-white md:grid-cols-3">
            {[
              {
                icon: "matter" as IconName,
                who: "Attorneys",
                head: "Context before every conversation.",
                items: ["Full matter history on one screen", "Document status before a hearing", "Outcomes recorded at closure"],
              },
              {
                icon: "users" as IconName,
                who: "Staff",
                head: "A queue that tells you what is next.",
                items: ["Needs Attention and overdue follow-ups", "Search and filter the case queue", "Upload straight to checklist items"],
              },
              {
                icon: "client" as IconName,
                who: "Clients",
                head: "Answers without a phone call.",
                items: ["Current status and assigned team", "Documents shared by the firm", "Updates the firm chooses to post"],
              },
            ].map((col, i) => (
              <div key={col.who} className={`p-8 sm:p-10 ${i > 0 ? "border-t border-line md:border-l md:border-t-0" : ""}`}>
                <IconTile name={col.icon} />
                <p className="mt-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{col.who}</p>
                <p className="mk-display mt-2 text-[1.55rem] leading-tight text-ink">{col.head}</p>
                <CheckList className="mt-6" items={col.items} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Security */}
      <section className="mk-section">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionIntro
                eyebrow="Security and confidentiality"
                title="Client confidentiality is built into the architecture."
                lead="CivicFlow separates firms, separates staff from clients, and keeps documents private by default. Controls are enforced in the database, not just hidden in the interface."
              />
              <TextLink href="/security" className="mt-8">
                How CivicFlow protects your data
              </TextLink>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-2">
              {securityControls.map((c) => (
                <div key={c.title} className="bg-white p-7">
                  <IconTile name={c.icon} />
                  <p className="mk-h3 mt-5 text-ink">{c.title}</p>
                  <p className="mt-2 text-[0.92rem] leading-6 text-slate-600">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing preview */}
      <section className="border-t border-line">
        <Container className="mk-section">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionIntro
              eyebrow="Pricing"
              title="Straightforward per-user pricing."
              lead="Three plans, one platform. Every plan includes the full platform. Choose the level of onboarding and support your firm needs."
            />
            <TextLink href="/pricing">Compare all plan features</TextLink>
          </div>
          <div className="mt-12 grid overflow-hidden rounded-[16px] border border-line bg-white md:grid-cols-3">
            {plans.map((plan, i) => (
              <Link
                key={plan.key}
                href={`/get-started?plan=${plan.key}`}
                className={`group relative flex flex-col p-8 transition hover:bg-porcelain/60 sm:p-9 ${
                  i > 0 ? "border-t border-line md:border-l md:border-t-0" : ""
                }`}
              >
                {plan.featured ? <span className="absolute inset-x-0 top-0 h-[3px] bg-cobalt" aria-hidden="true" /> : null}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-ink">{plan.name}</p>
                  {plan.featured ? (
                    <span className="rounded-full bg-cobalt-soft px-2.5 py-1 text-[0.7rem] font-semibold text-cobalt">Most popular</span>
                  ) : null}
                </div>
                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="mk-display text-[3.2rem] leading-none text-ink">${plan.price}</span>
                  <span className="text-sm text-slate-500">per user / month</span>
                </p>
                <p className="mt-4 text-[0.95rem] leading-6 text-slate-600">{plan.summary}</p>
                <span className="mk-link mt-8 text-sm">
                  Choose {plan.name}
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mk-arrow h-3.5 w-3.5">
                    <path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <ClosingCta />
      <SiteFooter />
    </main>
  );
}

function ChapterLabel({ n, label, dark = false }: { n: string; label: string; dark?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.16em] ${dark ? "text-blue-200" : "text-cobalt"}`}>
      <span className={`flex h-7 min-w-7 items-center justify-center rounded-full border px-1.5 font-mono text-[0.68rem] tracking-normal ${dark ? "border-white/20 text-white" : "border-cobalt/30 text-cobalt"}`}>
        {n}
      </span>
      {label}
    </p>
  );
}
