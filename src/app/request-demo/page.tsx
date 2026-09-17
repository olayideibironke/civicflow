import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

export default function RequestDemoPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader />
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="eyebrow text-blue-600">See CivicFlow</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Tell us about your firm and we will map the right CivicFlow setup.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Start with your firm size, current setup, primary workflow needs, and the plan you want to explore. We will use that information to map the right CivicFlow onboarding path.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/get-started" className="btn btn-primary px-6 py-3.5 text-base">Get started</Link>
          <Link href="/pricing" className="btn btn-secondary px-6 py-3.5 text-base">View plans</Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          <div className="premium-card">
            <p className="text-sm font-black text-slate-950">Basic</p>
            <p className="mt-2 text-3xl font-black text-slate-950">$30</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">per user / month</p>
          </div>
          <div className="premium-card">
            <p className="text-sm font-black text-slate-950">Pro</p>
            <p className="mt-2 text-3xl font-black text-slate-950">$80</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">per user / month</p>
          </div>
          <div className="premium-card">
            <p className="text-sm font-black text-slate-950">Advanced</p>
            <p className="mt-2 text-3xl font-black text-slate-950">$100</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">per user / month</p>
          </div>
        </div>
      </section>
    </main>
  );
}
