import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import ClosingCta from "@/components/marketing/ClosingCta";
import SiteFooter from "@/components/marketing/SiteFooter";
import { comparison, plans, securityControls } from "@/components/marketing/content";
import {
  CheckIcon,
  Container,
  Eyebrow,
  IconTile,
  TextLink,
} from "@/components/marketing/ui";

const faqs = [
  {
    q: "How is CivicFlow priced?",
    a: "CivicFlow is priced per user per month in USD. Basic is $30, Pro is $80 and Advanced is $100 per user per month.",
  },
  {
    q: "Can we change plans later?",
    a: "Yes. Firms can move between Basic, Pro and Advanced as the team grows or as onboarding and support needs change.",
  },
  {
    q: "Which plan should we choose?",
    a: "Every plan includes the full CivicFlow platform. Basic includes guided setup. Pro adds priority onboarding support. Advanced adds data export and migration assistance plus priority support.",
  },
  {
    q: "Can we bring records from our current system?",
    a: "Yes. Tell us about your current setup when you get started and we will map your existing records into CivicFlow through a controlled onboarding process. Advanced includes data export and migration assistance.",
  },
  {
    q: "Is the client portal included?",
    a: "Yes. Every plan includes the secure client portal, with invitations and client-visible sharing controlled by your staff.",
  },
  {
    q: "How do we get started?",
    a: "Share a few details about your firm, your current setup and the plan you are considering. We use that to recommend the right plan and onboarding path.",
  },
];

export default function PricingPage() {
  return (
    <main className="mk min-h-screen">
      <MarketingHeader activePage="pricing" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mk-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <Container className="relative pb-14 pt-14 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow className="mk-rise justify-center">Pricing</Eyebrow>
            <h1 className="mk-h1 mk-rise mk-rise-1 mt-6 text-ink">Clear per-user pricing for every stage of your firm.</h1>
            <p className="mk-lead mk-rise mk-rise-1 mx-auto mt-6 max-w-2xl">
              Every plan includes the full platform: intake, matters, documents, the client portal and reporting. Plans differ in onboarding and support.
            </p>
          </div>
        </Container>
      </section>

      {/* Plans */}
      <section>
        <Container>
          <div className="mk-rise mk-rise-2 grid gap-5 lg:grid-cols-3 lg:gap-0">
            {plans.map((plan, i) => {
              const dark = plan.featured;
              return (
                <article
                  key={plan.key}
                  className={`relative flex flex-col p-8 sm:p-10 ${
                    dark
                      ? "mk-dark z-10 rounded-[18px] shadow-[0_40px_80px_-30px_rgba(8,18,42,0.55)] lg:-my-5 lg:py-[3.75rem]"
                      : `mk-card rounded-[18px] ${i === 0 ? "lg:rounded-r-none lg:border-r-0" : "lg:rounded-l-none lg:border-l-0"}`
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className={`text-xl font-semibold ${dark ? "text-white" : "text-ink"}`}>{plan.name}</h2>
                    {plan.featured ? (
                      <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[0.7rem] font-semibold text-blue-100">
                        Most popular
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{plan.bestFor}</p>
                  <p className="mt-8 flex items-baseline gap-2">
                    <span className={`mk-display text-[3.75rem] leading-none ${dark ? "text-white" : "text-ink"}`}>${plan.price}</span>
                    <span className={`text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      per user
                      <br />
                      per month
                    </span>
                  </p>
                  <p className={`mt-5 min-h-[3rem] text-[0.95rem] leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>{plan.summary}</p>
                  <Link
                    href={`/get-started?plan=${plan.key}`}
                    className={`mk-btn mk-btn-lg mt-8 w-full ${dark ? "mk-btn-accent" : "mk-btn-primary"}`}
                  >
                    Get started with {plan.name}
                  </Link>
                  <div className={`mt-9 border-t pt-7 ${dark ? "border-white/10" : "border-line"}`}>
                    <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.14em] ${dark ? "text-slate-400" : "text-slate-400"}`}>
                      Highlights
                    </p>
                    <ul className="mt-4 grid gap-3">
                      {plan.highlights.map((h) => (
                        <li key={h} className={`flex items-start gap-3 text-[0.93rem] leading-6 ${dark ? "text-slate-200" : "text-slate-700"}`}>
                          <CheckIcon className={`mt-1 ${dark ? "text-blue-300" : "text-cobalt"}`} />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-10 text-center text-sm text-slate-500">All prices in USD, per user per month.</p>
        </Container>
      </section>

      {/* Comparison */}
      <section className="mk-section">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Compare plans</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">Everything side by side.</h2>
            </div>
          </div>

          <div className="relative mt-10 overflow-x-auto rounded-[16px] border border-line bg-white">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">CivicFlow plan comparison</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="w-[46%] p-5 text-sm font-medium text-slate-500 sm:p-6">Feature</th>
                  {plans.map((p) => (
                    <th key={p.key} scope="col" className={`p-5 text-center sm:p-6 ${p.featured ? "bg-cobalt-soft/50" : ""}`}>
                      <span className="block text-base font-semibold text-ink">{p.name}</span>
                      <span className="mt-0.5 block text-sm font-normal text-slate-500">${p.price}/user/mo</span>
                    </th>
                  ))}
                </tr>
              </thead>
              {comparison.map((group) => (
                <tbody key={group.group}>
                  <tr className="border-b border-line bg-porcelain">
                    <th scope="colgroup" colSpan={4} className="px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-6">
                      {group.group}
                    </th>
                  </tr>
                  {group.rows.map(([feature, ...values]) => (
                    <tr key={feature} className="border-b border-line last:border-b-0">
                      <th scope="row" className="px-5 py-4 text-[0.93rem] font-normal text-slate-700 sm:px-6">{feature}</th>
                      {values.map((v, i) => (
                        <td key={i} className={`px-5 py-4 text-center ${plans[i].featured ? "bg-cobalt-soft/50" : ""}`}>
                          {v ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy text-white">
                              <CheckIcon className="h-3.5 w-3.5" />
                              <span className="sr-only">Included</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">
                              <span aria-hidden="true">–</span>
                              <span className="sr-only">Not included</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </Container>
      </section>

      {/* Included in every plan */}
      <section className="border-y border-line bg-porcelain">
        <Container className="mk-section">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Eyebrow>In every plan</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">The same security foundation at every price.</h2>
              <p className="mk-lead mt-5">
                Firm isolation, private documents and controlled client access are not upgrades. They are how CivicFlow works.
              </p>
              <TextLink href="/security" className="mt-8">Read about security</TextLink>
            </div>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {securityControls.map((c) => (
                <li key={c.title} className="flex gap-4">
                  <IconTile name={c.icon} />
                  <div>
                    <p className="font-semibold text-ink">{c.title}</p>
                    <p className="mt-1 text-[0.9rem] leading-6 text-slate-600">{c.short}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="mk-section">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Eyebrow>Questions</Eyebrow>
              <h2 className="mk-h2 mt-5 text-ink">Pricing questions, answered plainly.</h2>
            </div>
            <div className="border-t border-line">
              {faqs.map((f) => (
                <details key={f.q} className="group border-b border-line">
                  <summary className="mk-focus flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[1.05rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-slate-500 transition group-open:rotate-45" aria-hidden="true">
                      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                        <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <p className="-mt-1 max-w-2xl pb-6 text-[0.98rem] leading-7 text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <ClosingCta
        title="Pick a plan. We will help you set it up."
        lead="Tell us about your firm and the plan you are considering, and we will map the right setup and onboarding path."
        secondary={{ label: "Explore the platform", href: "/platform" }}
      />
      <SiteFooter />
    </main>
  );
}
