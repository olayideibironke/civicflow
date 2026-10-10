import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import ClosingCta from "@/components/marketing/ClosingCta";
import SiteFooter from "@/components/marketing/SiteFooter";
import {
  ActivityTimeline,
  AppWindow,
  CaseHealthCard,
  CaseQueueScreen,
  ClientAccessCard,
  ClientPortalScreen,
  DecisionCard,
  DocumentChecklist,
  ExportCard,
  FloatCard,
  IntakeFormCard,
  InviteLinkCard,
  NoteCard,
  ReportsScreen,
  SettingsCard,
  StatusPill,
  UploadDocumentCard,
} from "@/components/marketing/product";
import {
  ButtonLink,
  CheckList,
  Container,
  Eyebrow,
  Icon,
  type IconName,
} from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Platform | Intake, Matters, Documents, Client Portal and Reporting",
  description:
    "Explore the CivicFlow platform: client intake, matter management, document checklists, private file storage, a secure client portal, operational reporting and Excel export.",
  alternates: {
    canonical: "/platform",
  },
};

const sections: { id: string; label: string; icon: IconName }[] = [
  { id: "intake", label: "Intake", icon: "intake" },
  { id: "matters", label: "Matters", icon: "matter" },
  { id: "documents", label: "Documents", icon: "document" },
  { id: "client-portal", label: "Client portal", icon: "client" },
  { id: "reporting", label: "Reporting", icon: "report" },
  { id: "administration", label: "Administration", icon: "settings" },
];

const stages = ["New Intake", "In Review", "Assigned", "Waiting on Client", "Completed"];

export default function PlatformPage() {
  return (
    <main className="mk min-h-screen">
      <MarketingHeader activePage="platform" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mk-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[560px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <Container className="relative pt-14 sm:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow className="mk-rise justify-center">The CivicFlow platform</Eyebrow>
            <h1 className="mk-h1 mk-rise mk-rise-1 mt-6 text-ink">
              Every part of the practice, working from the same record.
            </h1>
            <p className="mk-lead mk-rise mk-rise-1 mx-auto mt-6 max-w-2xl">
              Intake, matters, documents, client access, reporting and firm settings are not separate tools in CivicFlow. They are one system, so the work your team does in one place is already visible everywhere else.
            </p>
            <div className="mk-rise mk-rise-2 mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/get-started" size="lg" arrow>
                Get started
              </ButtonLink>
              <ButtonLink href="/pricing" variant="outline" size="lg">
                Compare plans
              </ButtonLink>
            </div>
          </div>
        </Container>
        <div className="relative mt-16">
          <div className="mk-dark absolute inset-x-0 bottom-0 top-1/2" aria-hidden="true" />
          <Container className="relative">
            <div className="relative mx-auto max-w-[1080px] pb-16">
              <AppWindow url="civicflowapp.org/app/cases" label="CivicFlow case queue with search, status, priority and attention filters">
                <CaseQueueScreen />
              </AppWindow>
              <FloatCard label="Internal note with an open follow-up" className="absolute -right-12 bottom-24 hidden w-[310px] overflow-hidden xl:block">
                <NoteCard />
              </FloatCard>
            </div>
          </Container>
        </div>
      </section>

      {/* Section index */}
      <nav aria-label="Platform sections" className="sticky top-[68px] z-30 border-b border-line bg-ivory/95 backdrop-blur-md">
        <Container>
          <ul className="-mx-1 flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none]">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="mk-focus flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-porcelain hover:text-ink">
                  <Icon name={s.icon} className="h-4 w-4 text-slate-400" />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </nav>

      {/* Intake */}
      <section id="intake" className="mk-section scroll-mt-32">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <Eyebrow>Client intake</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">A front door for new matters that files itself.</h2>
              <p className="mk-lead mt-5">
                Each firm gets its own intake page. When a prospective client submits it, CivicFlow does the setup work your staff would otherwise do by hand.
              </p>
              <ol className="mt-10 grid gap-0 border-l border-line">
                {[
                  ["Client submits the form", "Name, contact details, matter type, priority and a description of the matter."],
                  ["A numbered matter opens", "The case is created as New Intake and marked as sourced from client intake."],
                  ["The checklist is ready", "Photo identification, proof of address, intake form and supporting records are listed."],
                  ["Your queue shows it", "The matter appears unassigned so the right person can pick it up."],
                ].map(([t, d], i) => (
                  <li key={t} className="relative pb-7 pl-8 last:pb-0">
                    <span className="absolute -left-[13px] top-0 flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line bg-white font-mono text-[0.7rem] text-navy">
                      {i + 1}
                    </span>
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="mt-1 text-[0.94rem] leading-6 text-slate-600">{d}</p>
                  </li>
                ))}
              </ol>
            </div>
            <AppWindow url="civicflowapp.org/intake/harper-lane" label="CivicFlow client intake form">
              <IntakeFormCard />
            </AppWindow>
          </div>
        </Container>
      </section>

      {/* Matters */}
      <section id="matters" className="scroll-mt-32 border-y border-line bg-porcelain">
        <Container className="mk-section">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <Eyebrow>Matter management</Eyebrow>
              <h2 className="mk-h2 mt-5 max-w-2xl text-ink">A clear workflow from first review to recorded outcome.</h2>
            </div>
            <p className="mk-lead lg:pb-1">
              Every matter moves through defined stages with a named owner. Notes, follow-ups and case health keep the next step visible, and closure requires a decision on record.
            </p>
          </div>

          <div className="mt-14 overflow-x-auto">
            <ol className="flex min-w-[680px] items-center">
              {stages.map((s, i) => (
                <li key={s} className="flex flex-1 items-center">
                  <div className="flex flex-col items-start gap-2">
                    <span className="font-mono text-[0.7rem] text-slate-400">0{i + 1}</span>
                    <span className="mk-ui">
                      <StatusPill status={s} />
                    </span>
                  </div>
                  {i < stages.length - 1 ? <span className="mx-3 mt-5 h-px flex-1 bg-line-strong" aria-hidden="true" /> : null}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <FloatCard label="Internal note with follow-up" className="overflow-hidden">
              <NoteCard />
            </FloatCard>
            <FloatCard label="Case health summary" className="overflow-hidden">
              <CaseHealthCard />
            </FloatCard>
            <FloatCard label="Final decision with outcome options" className="overflow-hidden">
              <DecisionCard />
            </FloatCard>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Status and assignment", "Set the stage and the responsible person from the case itself."],
              ["Typed notes", "General Update, Client Contact, Document Follow-up, Review Note and Decision Support."],
              ["Follow-up dates", "Open, overdue and completed follow-ups are tracked and surfaced."],
              ["Recorded outcomes", "Approved, Denied, Referred or Withdrawn, with a decision note."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-line-strong pt-5">
                <p className="mk-h3 text-ink">{t}</p>
                <p className="mt-2 text-[0.94rem] leading-6 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Documents */}
      <section id="documents" className="mk-section scroll-mt-32">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
            <div>
              <Eyebrow>Documents and activity</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">Documents attached to the work they support.</h2>
              <p className="mk-lead mt-5">
                Upload files directly against checklist items, track what is received, missing or under review, and keep a complete timeline of what changed and when.
              </p>
              <CheckList
                className="mt-8"
                items={[
                  "Checklist progress shown as a percentage",
                  "Upload PDF, image, Word and Excel files",
                  "Private storage with signed download links",
                  "Automatic activity entries for each change",
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatCard label="Document checklist" className="overflow-hidden sm:col-span-2">
                <DocumentChecklist />
              </FloatCard>
              <FloatCard label="Upload document dialog" className="overflow-hidden">
                <UploadDocumentCard />
              </FloatCard>
              <FloatCard label="Activity timeline" className="overflow-hidden">
                <ActivityTimeline items={3} />
              </FloatCard>
            </div>
          </div>
        </Container>
      </section>

      {/* Client portal */}
      <section id="client-portal" className="mk-dark relative scroll-mt-32 overflow-hidden">
        <div className="mk-dark-grid mk-fade-mask pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container className="mk-section relative">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow tone="light" className="justify-center">Client portal</Eyebrow>
            <h2 className="mk-h2 mt-5 text-white">Secure access for clients, granted one matter at a time.</h2>
            <p className="mk-lead mx-auto mt-5 max-w-2xl !text-slate-300">
              Your team decides who is invited, which matter they can see, and exactly which documents and updates are shared.
            </p>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {[
              ["Invite", "Create a secure invitation for the client's email. Share the single-use activation link with them directly."],
              ["Activate", "The client creates an account or signs in with the invited email, and the matter connects."],
              ["Share", "Mark individual documents and updates as client-visible. Everything else stays private."],
            ].map(([t, d], i) => (
              <div key={t} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-7">
                <span className="font-mono text-[0.72rem] text-blue-200">0{i + 1}</span>
                <p className="mt-3 text-lg font-semibold text-white">{t}</p>
                <p className="mt-2 text-[0.92rem] leading-6 text-slate-400">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="grid gap-5">
              <FloatCard label="Client activation link" className="mk-frame-on-dark overflow-hidden">
                <InviteLinkCard />
              </FloatCard>
              <FloatCard label="Client visibility controls" className="mk-frame-on-dark overflow-hidden @container">
                <ClientAccessCard />
              </FloatCard>
            </div>
            <AppWindow onDark url="civicflowapp.org/client/cases" label="Client portal view of a shared matter">
              <ClientPortalScreen />
            </AppWindow>
          </div>
        </Container>
      </section>

      {/* Reporting */}
      <section id="reporting" className="mk-section scroll-mt-32">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <Eyebrow>Reporting and exports</Eyebrow>
              <h2 className="mk-h2 mt-5 max-w-2xl text-ink">Operational reporting that answers real management questions.</h2>
            </div>
            <p className="mk-lead lg:pb-1">
              Who owns the open work? Which follow-ups are overdue? Where are documents missing? How long do matters take to close? CivicFlow answers from live case data.
            </p>
          </div>
          <div className="mt-14">
            <AppWindow url="civicflowapp.org/app/reports" label="CivicFlow performance dashboard">
              <ReportsScreen />
            </AppWindow>
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "7-day intake and closure trend",
                "Completion mix and average cycle",
                "Follow-ups by note type and staff",
                "Service demand by matter type",
                "Status distribution across stages",
                "Document gaps by missing item",
              ].map((r) => (
                <p key={r} className="flex items-center gap-2.5 text-[0.94rem] text-slate-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cobalt" />
                  {r}
                </p>
              ))}
            </div>
            <FloatCard label="Excel report export" className="w-full max-w-[360px]">
              <ExportCard />
            </FloatCard>
          </div>
        </Container>
      </section>

      {/* Administration */}
      <section id="administration" className="scroll-mt-32 border-t border-line bg-porcelain">
        <Container className="mk-section">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
            <AppWindow url="civicflowapp.org/app/settings" label="CivicFlow firm settings" className="order-2 lg:order-1">
              <SettingsCard />
            </AppWindow>
            <div className="order-1 lg:order-2">
              <Eyebrow>Firm administration</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">Configured around your firm, not a generic template.</h2>
              <p className="mk-lead mt-5">
                Set your firm profile, define the matter types and priority options your team works with, and control when your public intake is open.
              </p>
              <CheckList
                className="mt-8"
                items={[
                  "Firm name, primary contact and support email",
                  "Your own matter types and priority options",
                  "Turn client intake on or off",
                  "Copy your firm's intake link in one click",
                ]}
              />
            </div>
          </div>
        </Container>
      </section>

      <ClosingCta title="See how CivicFlow fits the way your firm works." />
      <SiteFooter />
    </main>
  );
}
