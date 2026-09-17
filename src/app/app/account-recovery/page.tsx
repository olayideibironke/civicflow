"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { loadStaffWorkspace } from "@/lib/workspace";

type RecoveryStatus = "new" | "reviewing" | "resolved" | "closed";

type RecoveryRequest = {
  id: string;
  account_type: "attorney" | "client";
  organization_id: string | null;
  organization_name: string;
  full_name: string;
  phone: string;
  case_number: string | null;
  status: RecoveryStatus;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return value;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function AccountRecoveryPage() {
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState("");

  async function loadRequests() {
    setLoading(true);
    setMessage("");

    const workspaceResult = await loadStaffWorkspace();
    if (!workspaceResult.workspace?.isPlatformAdmin) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("account_recovery_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const loaded = (data ?? []) as RecoveryRequest[];
    const notes: Record<string, string> = {};
    loaded.forEach((request) => {
      notes[request.id] = request.internal_note ?? "";
    });

    setRequests(loaded);
    setDraftNotes(notes);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      const haystack = [
        request.organization_name,
        request.full_name,
        request.phone,
        request.case_number ?? "",
        request.account_type,
        request.status,
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [requests, search, statusFilter]);

  async function saveRequest(request: RecoveryRequest, status: RecoveryStatus) {
    setSavingId(request.id);
    setMessage("");
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("account_recovery_requests")
      .update({
        status,
        internal_note: draftNotes[request.id]?.trim() || null,
        updated_at: now,
      })
      .eq("id", request.id);

    setSavingId("");

    if (error) {
      setMessage(error.message);
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status,
              internal_note: draftNotes[request.id]?.trim() || null,
              updated_at: now,
            }
          : item
      )
    );
  }

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card text-center">
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading recovery requests...</p>
        </section>
      </AppShell>
    );
  }

  if (accessDenied) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="eyebrow text-rose-500">Restricted</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">Platform administrator access required.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Account recovery requests contain identity-verification information and are restricted to CivicFlow platform administration.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="eyebrow">Account Recovery</p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Review forgotten-email requests</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Verify the requester outside this screen before disclosing or changing any account information. CivicFlow never automatically reveals login email addresses.</p>
            </div>
            <button type="button" onClick={loadRequests} className="btn btn-secondary">Refresh</button>
          </div>
        </section>

        {message ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{message}</div> : null}

        <section className="premium-card">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="input-label">Search requests<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, firm, phone, case" className="input-field" /></label>
            <label className="input-label">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field"><option value="all">All statuses</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label>
          </div>
        </section>

        <section className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="premium-card text-center text-sm text-slate-500">No recovery requests match this view.</div>
          ) : filteredRequests.map((request) => (
            <article key={request.id} className="premium-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip border-slate-200 bg-slate-50 text-slate-700">{request.account_type === "attorney" ? "Attorney / Firm" : "Client"}</span>
                    <span className="chip border-amber-200 bg-amber-50 text-amber-700">{request.status}</span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-slate-950">{request.full_name}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-600">{request.organization_name}</p>
                </div>
                <p className="text-xs font-medium text-slate-400">Submitted {formatDate(request.created_at)}</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Phone</p><p className="mt-2 text-sm font-semibold text-slate-900">{formatPhone(request.phone)}</p></div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Case number</p><p className="mt-2 text-sm font-semibold text-slate-900">{request.case_number || "Not provided"}</p></div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Reference</p><p className="mt-2 break-all text-xs font-semibold text-slate-900">{request.id}</p></div>
              </div>

              <label className="input-label mt-6">Internal verification note<textarea value={draftNotes[request.id] ?? ""} onChange={(event) => setDraftNotes((current) => ({ ...current, [request.id]: event.target.value }))} rows={3} placeholder="Record verification steps. Do not store passwords or authentication codes." className="input-field resize-y" /></label>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" disabled={savingId === request.id} onClick={() => saveRequest(request, "reviewing")} className="btn btn-secondary">Mark reviewing</button>
                <button type="button" disabled={savingId === request.id} onClick={() => saveRequest(request, "resolved")} className="btn btn-primary">Mark resolved</button>
                <button type="button" disabled={savingId === request.id} onClick={() => saveRequest(request, "closed")} className="btn btn-secondary">Close request</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
