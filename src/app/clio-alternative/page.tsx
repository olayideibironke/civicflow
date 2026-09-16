import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

export default function ClioAlternativePage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="clio" />

      <section className="mx-auto max-w-[1220px] px-6 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">Clio alternative</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Want strong legal software without stitching together a growing stack?
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Clio is a mature platform with a strong mobile experience and extensive integrations. CivicFlow is testing a different proposition for small firms: fewer product boundaries, one clear core price, and a simpler path from intake through matter work, billing, client communication, reporting, and automation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/early-access" className="btn btn-primary px-6 py-3.5 text-base">Join early access</Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">See planned pricing</Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Our test</p>
            <h2 className="mt-4 text-2xl font-bold text-white">Can a smaller firm get the depth it needs without enterprise-style complexity?</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              That is the hypothesis. We are not positioning Clio as a weak product. We are testing whether some firms value a more consolidated experience and a planned $69 per-attorney starting point enough to consider switching.
            </p>
            <a href="https://www.clio.com/pricing/" target="_blank" rel="noreferrer" className="mt-6 inline-flex text-sm font-semibold text-white underline decoration-blue-300/50 underline-offset-4 hover:text-blue-100">
              Verify current Clio pricing
            </a>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card title="One operating layer" text="Matters, billing, documents, intake, clients, reporting, automation, mobile, and AI are planned as one product experience." />
          <Card title="Transparent pricing" text="The validation model starts at $69 per attorney per month rather than hiding the useful product behind an unclear buying process." />
          <Card title="Open architecture" text="API and webhooks are planned as normal platform capabilities, not prestige features reserved only for the highest tier." />
          <Card title="Verified migration" text="The migration concept reports counts, mismatches, duplicates, and balance discrepancies before a firm trusts the cutover." />
        </div>

        <div className="mt-12 premium-card">
          <p className="eyebrow">What would make the switch worthwhile?</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">The product has to be better in daily work, not merely cheaper.</h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
            Price can earn attention, but firms still need reliable documents, billing, reporting, mobile access, migration, support, security, and workflow depth. CivicFlow's validation phase is designed to test that combined value proposition before we commit to the full build.
          </p>
          <div className="mt-7">
            <Link href="/platform" className="btn btn-primary">Explore the platform concept</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="premium-card">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
