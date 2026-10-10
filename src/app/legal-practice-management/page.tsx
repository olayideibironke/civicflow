import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import ClosingCta from "@/components/marketing/ClosingCta";
import SiteFooter from "@/components/marketing/SiteFooter";
import { plans } from "@/components/marketing/content";
import {
  AppWindow,
  CaseDetailScreen,
} from "@/components/marketing/product";
import {
  ButtonLink,
  Container,
  Eyebrow,
  Icon,
  TextLink,
  type IconName,
} from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Legal Practice Management Software for Small Law Firms",
  description:
    "CivicFlow gives small law firms one organized platform for matters, documents, staff activity, intake, follow-ups, reporting, and firm operations, with plans starting at $30 per user per month.",
  alternates: {
    canonical: "/legal-practice-management",
  },
};

const principles = [
  {
    title: "Every matter should have one authoritative record.",
    text: "Client details, matter type, status, owner, documents, notes and history belong together. When that record is complete, attorneys walk into every conversation prepared and staff stop rebuilding context from email threads.",
  },
  {
    title: "Intake should create work, not more sorting.",
    text: "A prospective client's first submission should become a structured matter with a document checklist, ready for the right person to pick up. Retyping intake details is time the firm never gets back.",
  },
  {
    title: "The next step should never depend on memory.",
    text: "Follow-ups need dates, owners and visibility. A practice management system should surface what is open and what is overdue before a client or a deadline does.",
  },
  {
    title: "Clients deserve clarity, on the firm's terms.",
    text: "Clients want to know where their matter stands. The firm needs to decide exactly what they see. A good client portal makes both possible without exposing internal work.",
  },
  {
    title: "Leaders need the whole picture.",
    text: "Workload by person, matters by stage, document gaps and cycle time should be visible without assembling a spreadsheet. And the data should be exportable when deeper analysis is needed.",
  },
];

const capabilities: { icon: IconName; title: string; text: string }[] = [
  { icon: "matter", title: "Matter management", text: "Status, priority, assignment, notes and outcomes on one case record." },
  { icon: "intake", title: "Client intake", text: "A firm intake link that creates numbered matters automatically." },
  { icon: "document", title: "Document tracking", text: "Checklists, uploads and Received, Missing or Needs Review statuses." },
  { icon: "clock", title: "Follow-ups", text: "Dated follow-ups on notes, with open and overdue tracking." },
  { icon: "activity", title: "Activity history", text: "An automatic timeline of status changes, uploads and notes." },
  { icon: "client", title: "Client portal", text: "Invite clients to a matter and share selected documents and updates." },
  { icon: "report", title: "Reporting and export", text: "Operational dashboards with a full Excel workbook export." },
  { icon: "shield", title: "Security by design", text: "Firm-isolated data, private storage and separate client access." },
];

const faqs = [
  {
    q: "What is legal practice management software?",
    a: "Legal practice management software is the operating system for a law firm's day-to-day work. It organizes matters, clients, documents, tasks and reporting in one place so attorneys and staff work from the same information.",
  },
  {
    q: "Who is CivicFlow built for?",
    a: "CivicFlow is built for solo practitioners and small to mid-sized firms that want a disciplined, organized workflow without a complex implementation project.",
  },
  {
    q: "What does CivicFlow cost?",
    a: "CivicFlow Basic is $30, Pro is $80 and Advanced is $100 per user per month. Every plan includes intake, matter management, documents, the client portal and reporting.",
  },
  {
    q: "Can clients see their matters?",
    a: "Yes, when your firm invites them. Clients sign in to a separate portal and only see the matters, documents and updates your staff choose to share.",
  },
];

export default function LegalPracticeManagementPage() {
  return (
    <main className="mk min-h-screen">
      <MarketingHeader activePage="practice-management" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mk-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[560px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <Container className="relative pt-14 sm:pt-20 lg:pt-24">
          <div className="max-w-4xl">
            <Eyebrow className="mk-rise">Legal practice management software</Eyebrow>
            <h1 className="mk-h1 mk-rise mk-rise-1 mt-6 text-ink">Practice management for law firms that want to run with precision.</h1>
            <div className="mk-rise mk-rise-1 mt-8 grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
              <p className="mk-lead">
                CivicFlow organizes matters, intake, documents, follow-ups, client access and reporting in one platform, so a small firm can operate with the consistency of a much larger one.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                <ButtonLink href="/get-started" size="lg" arrow>
                  Get started
                </ButtonLink>
                <ButtonLink href="/pricing" variant="outline" size="lg">
                  View plans
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
        <div className="relative mt-16">
          <div className="absolute inset-x-0 bottom-0 top-1/2 border-t border-line bg-porcelain" aria-hidden="true" />
          <Container className="relative pb-16 sm:pb-20">
            <AppWindow url="civicflowapp.org/app/cases/cf-1052" label="CivicFlow case detail screen" className="mk-rise mk-rise-2 mx-auto max-w-[1100px]">
              <CaseDetailScreen />
            </AppWindow>
          </Container>
        </div>
      </section>

      {/* Principles */}
      <section className="mk-section">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Eyebrow>What it should do</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">Five things practice management software must get right.</h2>
              <p className="mk-lead mt-5">
                These are the principles CivicFlow is designed around, and a useful checklist for evaluating any system your firm considers.
              </p>
            </div>
            <ol className="border-t border-line">
              {principles.map((p, i) => (
                <li key={p.title} className="grid gap-4 border-b border-line py-9 sm:grid-cols-[4rem_1fr]">
                  <span className="mk-display text-[2rem] leading-none text-slate-300">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-[1.25rem] font-semibold leading-snug tracking-tight text-ink">{p.title}</h3>
                    <p className="mt-3 text-[1rem] leading-7 text-slate-600">{p.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Capabilities */}
      <section className="border-y border-line bg-porcelain">
        <Container className="mk-section">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>Inside CivicFlow</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">The capabilities behind the principles.</h2>
            </div>
            <TextLink href="/platform">Explore the full platform</TextLink>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((c) => (
              <div key={c.title} className="bg-white p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-navy text-white">
                  <Icon name={c.icon} className="h-[18px] w-[18px]" />
                </span>
                <p className="mk-h3 mt-5 text-ink">{c.title}</p>
                <p className="mt-2 text-[0.92rem] leading-6 text-slate-600">{c.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing band */}
      <section className="mk-section">
        <Container>
          <div className="mk-dark relative overflow-hidden rounded-[20px] px-6 py-12 sm:px-12 sm:py-14">
            <div className="mk-dark-grid mk-fade-mask pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div>
                <Eyebrow tone="light">Straightforward pricing</Eyebrow>
                <h2 className="mk-h2 mt-5 text-white">Three plans. One platform.</h2>
                <p className="mt-4 text-[0.98rem] leading-7 text-slate-300">Priced per user per month, with the same security foundation in every plan.</p>
              </div>
              <div className="grid gap-px overflow-hidden rounded-[14px] border border-white/10 bg-white/10 sm:grid-cols-3">
                {plans.map((p) => (
                  <Link key={p.key} href={`/get-started?plan=${p.key}`} className="group bg-midnight/80 p-6 transition hover:bg-navy">
                    <p className="text-sm font-semibold text-slate-300">{p.name}</p>
                    <p className="mk-display mt-3 text-[2.6rem] leading-none text-white">${p.price}</p>
                    <p className="mt-1 text-xs text-slate-400">per user / month</p>
                    <p className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-blue-200">
                      Choose {p.name}
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mk-arrow h-3.5 w-3.5">
                        <path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="pb-20 sm:pb-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Eyebrow>Common questions</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">About legal practice management.</h2>
            </div>
            <dl className="grid gap-0 border-t border-line">
              {faqs.map((f) => (
                <div key={f.q} className="border-b border-line py-7">
                  <dt className="text-[1.08rem] font-semibold text-ink">{f.q}</dt>
                  <dd className="mt-2.5 text-[0.98rem] leading-7 text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <ClosingCta />
      <SiteFooter />
    </main>
  );
}
