"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function NewCasePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    window.setTimeout(() => {
      router.push("/app/cases/case-1001");
    }, 700);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-4">
                <Link
                  href="/app/cases"
                  className="text-sm font-black text-slate-500 transition hover:text-slate-950"
                >
                  ← Back to cases
                </Link>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Staff Case Creation
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Create new case
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Create an internal case when staff receives a request by phone,
                email, walk-in, referral, or another non-public-intake channel.
              </p>
            </div>

            <div className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
              Internal workflow
            </div>
          </div>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <form onSubmit={handleSubmit} className="premium-card">
            <div className="border-b border-slate-100 pb-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Case Details
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Client and service information
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This form gives CivicFlow a staff-side path for opening cases
                directly inside the workspace.
              </p>
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
                <select name="serviceCategory" required className="input-field">
                  <option>Eligibility Review</option>
                  <option>Document Processing</option>
                  <option>Benefits Navigation</option>
                  <option>Referral Request</option>
                  <option>General Case Support</option>
                </select>
              </label>

              <label className="input-label">
                Priority
                <select name="priority" required className="input-field">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </label>

              <label className="input-label">
                Initial status
                <select name="status" required className="input-field">
                  <option>New Intake</option>
                  <option>In Review</option>
                  <option>Assigned</option>
                  <option>Waiting on Client</option>
                </select>
              </label>

              <label className="input-label">
                Assigned staff
                <select name="assignedTo" required className="input-field">
                  <option>Unassigned</option>
                  <option>Maya Johnson</option>
                  <option>Daniel Reeves</option>
                  <option>Aisha Carter</option>
                  <option>Eligibility Review Team</option>
                </select>
              </label>
            </div>

            <label className="input-label mt-6">
              Case summary
              <textarea
                name="summary"
                required
                rows={6}
                placeholder="Describe the client need, known documents, deadlines, and next action."
                className="input-field resize-y leading-7"
              />
            </label>

            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-black text-slate-950">
                Initial document placeholder
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Supabase Storage will later support direct upload here. For now,
                this area represents where staff can attach forms, IDs,
                referrals, or proof documents while creating the case.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Demo behavior: submitting this form opens the sample case detail
                workspace.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Creating case..." : "Create case"}
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Workflow Purpose
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Not every case starts from public intake.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Real organizations receive requests through calls, emails,
                referrals, walk-ins, partner agencies, and staff-created
                records. CivicFlow needs both public intake and internal case
                creation.
              </p>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Creation Checklist
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Required before review
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  "Client contact information",
                  "Service category",
                  "Priority level",
                  "Initial case summary",
                  "Assigned staff or queue",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-sm font-black text-slate-950">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}