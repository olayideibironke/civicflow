import Link from "next/link";

export default function IntakeSuccessPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-6 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="premium-card w-full text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl font-black text-emerald-700">
            ✓
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            Intake Submitted
          </p>

          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Your request has been received.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            A staff member can now review the intake, verify documents, assign
            ownership, and move the case through the CivicFlow workflow.
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
            {[
              ["Step 1", "Intake review"],
              ["Step 2", "Staff assignment"],
              ["Step 3", "Case decision"],
            ].map(([step, label]) => (
              <div key={step} className="soft-panel p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  {step}
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Back to homepage
            </Link>

            <Link
              href="/app/cases/case-1001"
              className="rounded-2xl bg-slate-950 px-6 py-3 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              View demo case
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}