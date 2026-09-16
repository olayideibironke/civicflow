import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";

export default function RequestDemoPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <MarketingHeader />
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="eyebrow text-blue-600">Validation phase</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          CivicFlow is currently collecting Early Access interest instead of demo requests.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          The law-practice product is still being validated. No sales call or product demo is required at this stage.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/early-access" className="btn btn-primary px-6 py-3.5 text-base">Join early access</Link>
          <Link href="/" className="btn btn-secondary px-6 py-3.5 text-base">Back to home</Link>
        </div>
      </section>
    </main>
  );
}
