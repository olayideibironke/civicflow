import Link from "next/link";

type IntakeSuccessPageProps = {
  searchParams?: Promise<{
    case?: string;
    client?: string;
  }>;
};

export default async function IntakeSuccessPage({
  searchParams,
}: IntakeSuccessPageProps) {
  const params = await searchParams;
  const caseNumber = params?.case ?? "New case";
  const clientName = params?.client ?? "Client";

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="premium-card w-full text-center animate-fade-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-emerald-600">
              <path
                d="m5 13 4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="eyebrow mt-7 text-emerald-600">Intake Submitted</p>

          <h1 className="mx-auto mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Your request has been received.
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            CivicFlow created case{" "}
            <strong className="font-semibold text-slate-900">{caseNumber}</strong>{" "}
            for{" "}
            <strong className="font-semibold text-slate-900">{clientName}</strong>.
            A staff member can now review the intake, verify documents, assign
            ownership, and move the case through the workflow.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-3 md:grid-cols-3">
            {[
              ["Step 1", "Intake saved"],
              ["Step 2", "Case created"],
              ["Step 3", "Staff review"],
            ].map(([step, label]) => (
              <div key={step} className="soft-panel p-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {step}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn btn-secondary px-6 py-3">
              Back to homepage
            </Link>

            <Link href="/app/cases" className="btn btn-primary px-6 py-3">
              View case queue
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}