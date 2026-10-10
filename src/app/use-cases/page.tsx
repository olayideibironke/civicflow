import type { Metadata } from "next";
import type { ReactNode } from "react";
import MarketingHeader from "@/components/MarketingHeader";
import ClosingCta from "@/components/marketing/ClosingCta";
import SiteFooter from "@/components/marketing/SiteFooter";
import {
  ActivityTimeline,
  ClientPortalScreen,
  DocumentChecklist,
  FloatCard,
  FollowUpList,
  MatterCard,
} from "@/components/marketing/product";
import {
  ButtonLink,
  CheckIcon,
  CheckList,
  Container,
  Eyebrow,
  TextLink,
} from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Use Cases | Practice Management for Small and Growing Law Firms",
  description:
    "How family law, immigration, criminal defense and civil litigation firms use CivicFlow to run intake, matters, documents, client access and reporting.",
  alternates: {
    canonical: "/use-cases",
  },
};

const areas: {
  name: string;
  head: string;
  text: string;
  points: string[];
  visual: ReactNode;
}[] = [
  {
    name: "Family law",
    head: "Keep clients informed through sensitive, document-heavy matters.",
    text: "Family matters generate a steady stream of records and anxious questions. Share selected updates and documents through the portal so clients know where things stand.",
    points: ["Client-visible updates you approve", "Checklists for financial and identity records", "Follow-ups for every client contact"],
    visual: (
      <div className="@container overflow-hidden rounded-[12px] border border-line">
        <ClientPortalScreen />
      </div>
    ),
  },
  {
    name: "Immigration",
    head: "Never lose track of the document a filing depends on.",
    text: "Immigration work lives and dies on complete paperwork. Checklists show what is received, missing or needs review on every matter, and case health flags the gaps.",
    points: ["Received, Missing and Needs Review statuses", "Uploads tied to specific checklist items", "Closure only when every item is received"],
    visual: <DocumentChecklist />,
  },
  {
    name: "Criminal defense",
    head: "Move fast on urgent matters without dropping the follow-up.",
    text: "When a new matter arrives marked Urgent, the right person needs to own it immediately. Priority, assignment and follow-up dates keep time-sensitive work in front of the team.",
    points: ["Urgent priority from intake onward", "Unassigned matters surfaced on the dashboard", "Overdue follow-ups called out by name"],
    visual: (
      <div className="grid gap-3">
        <div className="rounded-[12px] border border-line">
          <MatterCard num="CF-1047" name="Omar Haddad" type="Criminal Defense" status="Assigned" priority="Urgent" owner="Daniel Reeves" meta="Follow-ups: 1 open · due today" />
        </div>
        <div className="rounded-[12px] border border-line">
          <FollowUpList />
        </div>
      </div>
    ),
  },
  {
    name: "Civil litigation",
    head: "A complete history of the matter, ready before every call.",
    text: "Litigation matters run long and change hands. The activity timeline records status changes, uploads and notes automatically, so anyone can pick up the file with full context.",
    points: ["Automatic timeline for every change", "Typed notes for review and decision support", "Recorded outcomes at closure"],
    visual: <ActivityTimeline items={5} />,
  },
];

const sizes = [
  {
    who: "Solo practitioners",
    head: "Structure without overhead.",
    text: "Replace the spreadsheet and inbox routine with a queue, checklists and follow-ups that keep you organized between court dates.",
    plan: "Most solos start on Basic",
  },
  {
    who: "Small firms",
    head: "A shared view of the work.",
    text: "Give attorneys and staff one place to see ownership, status and what is overdue, without weekly catch-up meetings to rebuild the picture.",
    plan: "Teams with shared staff often choose Pro",
  },
  {
    who: "Growing firms",
    head: "Control as the team expands.",
    text: "Keep the same platform as more people, matter types and clients come on board, with migration assistance and priority support available on Advanced.",
    plan: "Multi-attorney firms consider Advanced",
  },
];

const fragmented = [
  ["New client emails sorted by hand", "A firm intake link that opens a numbered matter"],
  ["Case status tracked in a spreadsheet", "Defined stages with an owner on every matter"],
  ["Documents spread across shared drives", "Checklists with files stored on the matter"],
  ["Follow-ups living in someone's memory", "Dated follow-ups with overdue alerts"],
  ["Clients calling for updates", "A portal showing what you choose to share"],
  ["Reports rebuilt every month", "Live reporting with Excel export"],
];

export default function UseCasesPage() {
  return (
    <main className="mk min-h-screen">
      <MarketingHeader activePage="use-cases" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mk-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[560px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <Container className="relative py-14 sm:py-20 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            <div>
              <Eyebrow className="mk-rise">Use cases</Eyebrow>
              <h1 className="mk-h1 mk-rise mk-rise-1 mt-6 text-ink">Built for how small firms actually practice.</h1>
              <p className="mk-lead mk-rise mk-rise-1 mt-6 max-w-xl">
                Whether your firm handles family, immigration, criminal or civil matters, CivicFlow gives every practice the same disciplined foundation and lets you define the matter types you work with.
              </p>
              <div className="mk-rise mk-rise-2 mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/get-started" size="lg" arrow>
                  Get started
                </ButtonLink>
                <ButtonLink href="/platform" variant="outline" size="lg">
                  Explore the platform
                </ButtonLink>
              </div>
            </div>
            <div className="mk-rise mk-rise-2 relative mx-auto w-full max-w-[460px]">
              <div className="absolute -inset-6 rounded-[28px] bg-porcelain" aria-hidden="true" />
              <div className="relative grid gap-3">
                <FloatCard label="Family law matter waiting on client" className="sm:mr-10">
                  <MatterCard num="CF-1052" name="Daniela Rivera" type="Family Law" status="Waiting on Client" priority="High" owner="Maya Johnson" />
                </FloatCard>
                <FloatCard label="Immigration matter in review" className="sm:ml-10">
                  <MatterCard num="CF-1049" name="Chidi Okafor" type="Immigration" status="In Review" priority="Medium" owner="Daniel Reeves" />
                </FloatCard>
                <FloatCard label="Civil litigation matter from intake" className="sm:mr-4">
                  <MatterCard num="CF-1055" name="Tess Brennan" type="Civil Litigation" status="New Intake" priority="Urgent" owner="Unassigned" />
                </FloatCard>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Practice areas */}
      <section id="practice-areas" className="scroll-mt-24 border-t border-line bg-porcelain">
        <Container className="mk-section">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <Eyebrow>By practice area</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">The same system, shaped to the work.</h2>
            </div>
            <p className="mk-lead lg:pb-1">
              CivicFlow ships with Criminal Defense, Family Law, Immigration, Civil Litigation and General Legal Matter types. Each firm can change these in settings.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line lg:grid-cols-2">
            {areas.map((a) => (
              <article key={a.name} className="flex flex-col bg-white p-7 sm:p-10">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-cobalt">{a.name}</p>
                <h3 className="mk-display mt-3 text-[1.6rem] leading-[1.2] text-ink">{a.head}</h3>
                <p className="mt-4 text-[0.96rem] leading-7 text-slate-600">{a.text}</p>
                <CheckList className="mt-6" items={a.points} />
                <div className="mk-ui mt-8 flex-1 rounded-[14px] bg-porcelain p-3 sm:p-4" role="img" aria-label={`${a.name} example in CivicFlow`}>
                  <div aria-hidden="true" className="h-full overflow-hidden rounded-[12px] bg-white shadow-[0_1px_2px_rgba(8,18,42,0.05),0_14px_30px_-16px_rgba(8,18,42,0.25)]">
                    {a.visual}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Firm size */}
      <section id="firm-size" className="mk-section scroll-mt-24">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>By firm size</Eyebrow>
            <h2 className="mk-h2 mt-5 text-ink">Start small. Stay on the same system as you grow.</h2>
          </div>
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-[18px] hidden h-px bg-line-strong md:block" aria-hidden="true" />
            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              {sizes.map((s, i) => (
                <div key={s.who} className="relative">
                  <span className={`relative flex h-9 w-9 items-center justify-center rounded-full border font-mono text-[0.72rem] ${i === 2 ? "border-navy bg-navy text-white" : "border-line-strong bg-ivory text-navy"}`}>
                    0{i + 1}
                  </span>
                  <p className="mt-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{s.who}</p>
                  <p className="mk-display mt-2 text-[1.6rem] leading-tight text-ink">{s.head}</p>
                  <p className="mt-3 text-[0.96rem] leading-7 text-slate-600">{s.text}</p>
                  <p className="mt-5 text-sm font-medium text-navy">{s.plan}</p>
                </div>
              ))}
            </div>
          </div>
          <TextLink href="/pricing" className="mt-12">Compare Basic, Pro and Advanced</TextLink>
        </Container>
      </section>

      {/* Leaving fragmented tools */}
      <section className="mk-dark relative overflow-hidden">
        <div className="mk-dark-grid mk-fade-mask pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container className="mk-section relative">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Eyebrow tone="light">Leaving fragmented tools</Eyebrow>
              <h2 className="mk-h2 mt-5 text-white">From scattered workarounds to one operating record.</h2>
              <p className="mk-lead mt-5 !text-slate-300">
                Most firms that come to CivicFlow are not replacing one tool. They are replacing a patchwork of habits.
              </p>
            </div>
            <div className="overflow-hidden rounded-[16px] border border-white/10">
              <div className="grid grid-cols-2 border-b border-white/10 bg-white/[0.04] text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
                <p className="px-5 py-4 text-slate-400 sm:px-6">Before</p>
                <p className="border-l border-white/10 px-5 py-4 text-blue-200 sm:px-6">With CivicFlow</p>
              </div>
              {fragmented.map(([before, after]) => (
                <div key={before} className="grid grid-cols-2 border-b border-white/10 last:border-b-0">
                  <p className="px-5 py-4 text-[0.92rem] leading-6 text-slate-400 sm:px-6">{before}</p>
                  <p className="flex gap-2.5 border-l border-white/10 px-5 py-4 text-[0.92rem] leading-6 text-white sm:px-6">
                    <CheckIcon className="mt-1 text-blue-300" />
                    {after}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <div className="pt-20 sm:pt-24">
        <ClosingCta title="Tell us how your practice works." lead="Share your practice areas, team size and current setup. We will recommend the right plan and show you how CivicFlow fits." />
      </div>
      <SiteFooter />
    </main>
  );
}
