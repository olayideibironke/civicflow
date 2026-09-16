import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const comparison = [
  ["Matter and contact management", "Included", "Planned included"],
  ["Client intake", "Pro and above", "Planned included"],
  ["eSignature", "Pro and above", "Planned included"],
  ["Text messaging", "Pro and above", "Planned included"],
  ["Workflow automation", "Pro and above", "Planned included"],
  ["Advanced AI / case assistance", "Advanced", "Planned included"],
  ["Open API", "Advanced", "Planned included"],
  ["Verified migration reporting", "Not positioned as a core feature", "Planned"],
];

export default function MyCaseAlternativePage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader activePage="mycase" />

      <section className="mx-auto max-w-[1220px] px-6 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow text-blue-600">MyCase alternative</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Looking for MyCase-level simplicity without paying more to unlock everyday capabilities?
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              CivicFlow is testing a simpler pricing model for small law firms: a planned $69 per-attorney core platform with matters, billing, intake, documents, communication, automation, reporting, API access, mobile workflows, and embedded AI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/early-access" className="btn btn-primary px-6 py-3.5 text-base">Join early access</Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">See planned pricing</Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Price context</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              As verified on September 16, 2026, MyCase lists annual pricing of $50 per user/month for Basic, $100 for Pro, and $130 for Advanced. Monthly billing is higher. CivicFlow's $69 figure is a validation price, not a final offer.
            </p>
            <a href="https://www.mycase.com/pricing/" target="_blank" rel="noreferrer" className="mt-6 inline-flex text-sm font-semibold text-white underline decoration-blue-300/50 underline-offset-4 hover:text-blue-100">
              Verify current MyCase pricing
            </a>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-md)]">
          <div className="border-b border-slate-100 p-7">
            <p className="eyebrow">Validation comparison</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">What we are testing against the current MyCase structure</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This is not a claim that CivicFlow already delivers every planned capability. It shows the product and pricing proposition we are validating before full development.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-black">Capability</th>
                  <th className="px-6 py-4 font-black">MyCase current positioning</th>
                  <th className="px-6 py-4 font-black">CivicFlow validation concept</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(([feature, mycase, ours]) => (
                  <tr key={feature} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold text-slate-900">{feature}</td>
                    <td className="px-6 py-4 text-slate-600">{mycase}</td>
                    <td className="px-6 py-4 font-semibold text-blue-700">{ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card title="Keep the simplicity" text="MyCase is often praised for being approachable. Our goal is not to replace simplicity with enterprise complexity." />
          <Card title="Reduce the feature maze" text="We are testing whether firms prefer everyday capabilities in one core plan instead of climbing multiple tiers." />
          <Card title="Make switching safer" text="Verified migration is planned to show what moved, what matched, and what needs review rather than asking a firm to trust a black-box import." />
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
