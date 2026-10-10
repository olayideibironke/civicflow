import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import ClosingCta from "@/components/marketing/ClosingCta";
import SiteFooter from "@/components/marketing/SiteFooter";
import { securityControls } from "@/components/marketing/content";
import {
  ClientAccessCard,
  FloatCard,
  InviteLinkCard,
} from "@/components/marketing/product";
import {
  ButtonLink,
  CheckList,
  Container,
  Eyebrow,
  Icon,
  IconTile,
} from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Security and Client Confidentiality",
  description:
    "How CivicFlow protects law firm and client data: firm-isolated records, separate staff and client access, private document storage, single-use client invitations and verified account recovery.",
  alternates: {
    canonical: "/security",
  },
};

export default function SecurityPage() {
  return (
    <main className="mk min-h-screen">
      <MarketingHeader activePage="security" />

      {/* Hero */}
      <section className="mk-dark relative overflow-hidden">
        <div className="mk-dark-grid mk-fade-mask pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container className="relative py-16 sm:py-24">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div>
              <Eyebrow tone="light" className="mk-rise">Security and confidentiality</Eyebrow>
              <h1 className="mk-h1 mk-rise mk-rise-1 mt-6 text-white lg:!text-[3.6rem]">Built to keep client information where it belongs.</h1>
              <p className="mk-lead mk-rise mk-rise-1 mt-6 max-w-xl !text-slate-300">
                Law firms hold some of the most sensitive information people ever share. CivicFlow enforces firm boundaries, separates staff from clients and keeps documents private by default.
              </p>
              <div className="mk-rise mk-rise-2 mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/get-started" variant="light" size="lg" arrow>
                  Get started
                </ButtonLink>
                <ButtonLink href="#controls" variant="ghost-dark" size="lg">
                  Review the controls
                </ButtonLink>
              </div>
            </div>

            {/* Access model diagram */}
            <figure className="mk-rise mk-rise-2" aria-label="CivicFlow access model: staff work inside a firm boundary, clients see only shared items through a separate portal">
              <div className="rounded-[18px] border border-white/12 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-blue-200">Firm boundary</p>
                  <p className="flex items-center gap-1.5 text-[0.72rem] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Enforced in the database
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["users", "Staff workspace", "Attorneys and staff of this firm only"],
                    ["matter", "Case records", "Cases, notes, documents, activity"],
                    ["lock", "Private storage", "Files in a folder per firm"],
                    ["note", "Internal notes", "Never visible to clients"],
                  ].map(([icon, t, d]) => (
                    <div key={t} className="flex gap-3 rounded-[12px] border border-white/10 bg-midnight/60 p-4">
                      <span className="mt-0.5 text-blue-200">
                        <Icon name={icon as "users"} className="h-[18px] w-[18px]" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{t}</p>
                        <p className="mt-0.5 text-[0.78rem] leading-5 text-slate-400">{d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative mt-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/15" aria-hidden="true" />
                  <span className="rounded-full border border-blue-300/30 bg-cobalt/15 px-3 py-1 text-[0.72rem] font-medium text-blue-100">
                    Only items marked client-visible
                  </span>
                  <span className="h-px flex-1 bg-white/15" aria-hidden="true" />
                </div>
                <div className="mt-4 flex gap-3 rounded-[12px] border border-white/10 bg-white/[0.05] p-4">
                  <span className="mt-0.5 text-blue-200">
                    <Icon name="client" className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Client portal</p>
                    <p className="mt-0.5 text-[0.78rem] leading-5 text-slate-400">
                      Separate sign-in. Clients see only matters they were invited to, and only what the firm shares.
                    </p>
                  </div>
                </div>
              </div>
            </figure>
          </div>
        </Container>
      </section>

      {/* Controls */}
      <section id="controls" className="mk-section scroll-mt-20">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Core controls</Eyebrow>
            <h2 className="mk-h2 mt-5 text-ink">Protection that does not depend on people remembering to be careful.</h2>
            <p className="mk-lead mt-5">
              The controls below are enforced by the platform itself, through database access policies, private storage rules and server-side checks.
            </p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {securityControls.map((c) => (
              <article key={c.title} className="bg-white p-8">
                <IconTile name={c.icon} />
                <h3 className="mk-h3 mt-6 text-ink">{c.title}</h3>
                <p className="mt-2.5 text-[0.95rem] leading-7 text-slate-600">{c.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Client visibility */}
      <section className="border-y border-line bg-porcelain">
        <Container className="mk-section">
          <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20">
            <div>
              <Eyebrow>Client visibility</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">Private by default. Shared by decision.</h2>
              <p className="mk-lead mt-5">
                Nothing reaches a client automatically. Staff choose, item by item, which documents and activity updates appear in the client portal for each matter.
              </p>
              <CheckList
                className="mt-8"
                items={[
                  "Documents and updates start as private",
                  "Sharing is set per item, per matter",
                  "Internal notes cannot be shared",
                  "Clients reach only matters linked to their account",
                ]}
              />
            </div>
            <div className="grid gap-4">
              <FloatCard label="Client activation link with expiry" className="overflow-hidden sm:mr-16">
                <InviteLinkCard />
              </FloatCard>
              <FloatCard label="Client-visible document and update controls" className="@container overflow-hidden sm:ml-10">
                <ClientAccessCard />
              </FloatCard>
            </div>
          </div>
        </Container>
      </section>

      {/* Accounts */}
      <section className="mk-section">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Eyebrow>Accounts and access</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">Careful handling of every way in.</h2>
            </div>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {[
                ["Authenticated access", "Every firm page and client page requires a signed-in account. Protected pages verify workspace access before anything loads."],
                ["Two separate portals", "Staff and clients use different sign-in pages. A client account cannot open the firm workspace, and a staff account cannot be converted into a client."],
                ["Strong passwords", "New passwords must be at least 12 characters. Password resets use time-limited links sent to the account email."],
                ["Invitation integrity", "A client invitation can only be accepted by an account signed in with the invited email address, and only once."],
                ["Recovery without disclosure", "Forgotten-email requests never reveal an address. Each request receives a reference and is verified before anything is shared."],
                ["Signed document links", "Document downloads are issued as short-lived signed links, so files are never exposed through permanent public URLs."],
              ].map(([t, d]) => (
                <div key={t} className="border-t border-line-strong pt-5">
                  <p className="mk-h3 text-ink">{t}</p>
                  <p className="mt-2 text-[0.95rem] leading-7 text-slate-600">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <ClosingCta
        title="Have security questions about your firm's setup?"
        lead="Tell us about your firm and your requirements when you get started. We will walk through how CivicFlow handles access, storage and client visibility."
        secondary={{ label: "Explore the platform", href: "/platform" }}
      />
      <SiteFooter />
    </main>
  );
}
