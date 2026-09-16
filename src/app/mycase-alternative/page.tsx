import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

const pricing = [
  ["Basic", "$50/user/month", "$30/user/month"],
  ["Pro", "$100/user/month", "$80/user/month"],
  ["Advanced", "$130/user/month", "$100/user/month"],
];

const reasons = [
  ["Lower entry price", "CivicFlow Basic starts at $30 per user per month, giving smaller firms a lower-cost path into structured practice management."],
  ["Simple upgrade path", "Move from Basic to Pro or Advanced as the firm needs more operational depth without jumping straight into a premium-priced plan."],
  ["Built for small firms", "The product is centered on matters, documents, staff activity, follow-ups, intake, reporting, and day-to-day operational visibility."],
  ["Migration help", "CivicFlow can help firms map existing case and document data into a cleaner workspace as part of onboarding."],
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
              A lower-priced alternative for small law firms that want a clean operating workspace.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              CivicFlow is built for firms that want organized matters, documents, staff activity, intake, follow-ups, reporting, and a simpler cost structure without paying MyCase-level prices for every user.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="btn btn-primary px-6 py-3.5 text-base">Get started</Link>
              <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">Compare plans</Link>
            </div>
          </div>

          <div className="premium-dark lg:!p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">Price comparison</p>
            <h2 className="mt-4 text-2xl font-bold text-white">Save on every tier.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              MyCase currently lists annual pricing of $50 for Basic, $100 for Pro, and $130 for Advanced per user per month. CivicFlow is priced at $30, $80, and $100 respectively.
            </p>
            <a href="https://www.mycase.com/pricing/" target="_blank" rel="noreferrer" className="mt-6 inline-flex text-sm font-semibold text-white underline decoration-blue-300/50 underline-offset-4 hover:text-blue-100">
              Verify current MyCase pricing
            </a>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-md)]">
          <div className="border-b border-slate-100 p-7">
            <p className="eyebrow">Pricing side by side</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">A simpler way to lower the firm's software bill.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Prices shown below use MyCase's publicly listed annual-billing rates as of September 16, 2026.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-black">Plan</th>
                  <th className="px-6 py-4 font-black">MyCase</th>
                  <th className="px-6 py-4 font-black">CivicFlow</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map(([plan, mycase, ours]) => (
                  <tr key={plan} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold text-slate-900">{plan}</td>
                    <td className="px-6 py-4 text-slate-600">{mycase}</td>
                    <td className="px-6 py-4 font-black text-blue-700">{ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map(([title, text]) => (
            <Card key={title} title={title} text={text} />
          ))}
        </div>

        <div className="mt-12 rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Considering a switch?</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Tell us what your firm uses today.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                We will help you choose the right CivicFlow plan and map the information your team needs to bring over.
              </p>
            </div>
            <Link href="/get-started" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-blue-50">
              Get started
            </Link>
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
