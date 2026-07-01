import Link from "next/link";

export default function IntakePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)]">
      <header className="border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
              CF
            </div>

            <div>
              <p className="text-lg font-black leading-none text-slate-950">
                CivicFlow
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                by Westforge
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Back home
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1440px] gap-6 px-6 py-8 lg:grid-cols-[420px_minmax(0,1fr)] lg:py-10">
        <aside className="premium-dark self-start lg:sticky lg:top-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
            Public Intake
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
            Submit a service request.
          </h1>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            A clean front door for collecting client information, service
            category, request details, and supporting documents.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-base font-black text-white">
                Secure intake experience
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Designed for organizations that need professional intake before
                staff review.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-base font-black text-white">
                Staff-ready case creation
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Submissions will later flow into queues, assignments, document
                review, statuses, and reports.
              </p>
            </div>
          </div>
        </aside>

        <form action="/intake/success" className="premium-card">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Client Information
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Tell us who needs assistance
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This demo intake form shows how CivicFlow can capture the
                information needed to open a clean internal case.
              </p>
            </div>

            <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
              Demo intake
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="input-label">
              First name
              <input
                name="firstName"
                required
                placeholder="Angela"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Last name
              <input
                name="lastName"
                required
                placeholder="Brooks"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Email address
              <input
                name="email"
                type="email"
                required
                placeholder="angela@example.org"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Phone number
              <input
                name="phone"
                placeholder="(555) 123-4567"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Service category
              <select
                name="serviceCategory"
                required
                className="input-field"
              >
                <option>Eligibility review</option>
                <option>Document processing</option>
                <option>Benefits navigation</option>
                <option>Referral request</option>
                <option>General case support</option>
              </select>
            </label>

            <label className="input-label">
              Priority
              <select name="priority" className="input-field">
                <option>Standard</option>
                <option>Medium</option>
                <option>Urgent</option>
              </select>
            </label>
          </div>

          <label className="input-label mt-6">
            Request details
            <textarea
              name="details"
              required
              rows={6}
              placeholder="Briefly describe what help is needed, what documents are available, and any important deadlines."
              className="input-field resize-y leading-7"
            />
          </label>

          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-black text-slate-950">
              Document upload placeholder
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Backend upload will come later with Supabase Storage. This area
              represents where IDs, proof documents, forms, and supporting
              records would be attached.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              By submitting, the request becomes a CivicFlow case for staff
              review.
            </p>

            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Submit intake
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}