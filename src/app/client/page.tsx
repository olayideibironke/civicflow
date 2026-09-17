"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClientShell from "@/components/ClientShell";
import { loadClientCases, type ClientCaseSummary } from "@/lib/clientWorkspace";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function ClientPortalPage() {
  const [cases, setCases] = useState<ClientCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCases() {
      const result = await loadClientCases();
      if (!active) return;

      if (result.error) {
        setMessage(result.error);
        setLoading(false);
        return;
      }

      setCases(result.cases);
      setLoading(false);
    }

    loadCases();
    return () => {
      active = false;
    };
  }, []);

  return (
    <ClientShell>
      <div className="space-y-6">
        <section className="premium-card">
          <p className="eyebrow">My Matters</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Your secure case portal
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Review matter status, shared documents, and client-visible updates from your legal team.
          </p>
        </section>

        {loading ? (
          <section className="premium-card text-center">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <p className="mt-4 text-sm font-medium text-slate-500">Loading your matters...</p>
          </section>
        ) : message ? (
          <section className="premium-card">
            <p className="eyebrow text-rose-500">Portal Error</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          </section>
        ) : cases.length === 0 ? (
          <section className="premium-card text-center">
            <h2 className="text-xl font-bold text-slate-950">No matters are connected yet.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              If your legal team sent you an invitation, open that invitation link while signed in to connect the matter to your account.
            </p>
            <Link href="/client/activate" className="btn btn-primary mt-6">Activate an invitation</Link>
          </section>
        ) : (
          <section className="grid gap-5 lg:grid-cols-2">
            {cases.map((item) => (
              <Link
                key={item.case_id}
                href={`/client/cases/${encodeURIComponent(item.case_id)}`}
                className="premium-card block transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">{item.organization_name}</p>
                    <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">{item.case_number}</h2>
                  </div>
                  <span className="chip border-slate-200 bg-slate-50 text-slate-700">{item.status}</span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Matter type</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800">{item.service_category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Assigned team</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800">{item.assigned_to || "Your legal team"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Priority</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800">{item.priority}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Last updated</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-800">{formatDate(item.updated_at)}</p>
                  </div>
                </div>

                {item.decision_outcome ? (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    Outcome: {item.decision_outcome}
                  </div>
                ) : null}

                <span className="mt-6 inline-flex text-sm font-bold text-slate-950">Open matter →</span>
              </Link>
            ))}
          </section>
        )}
      </div>
    </ClientShell>
  );
}
