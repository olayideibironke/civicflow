"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type DemoRequest = {
  id: string;
  first_name: string;
  last_name: string;
  work_email: string;
  phone: string | null;
  organization_name: string;
  role_title: string;
  organization_type: string;
  team_size: string;
  primary_need: string;
  timeline: string;
  preferred_contact: string;
  message: string;
  status: string;
  source: string;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
  last_staff_action_at: string | null;
};

const statusOptions = [
  "New",
  "Contacted",
  "Demo Scheduled",
  "Proposal Sent",
  "Won",
  "Lost",
  "Not a Fit",
];

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPhone(value: string | null) {
  if (!value) {
    return "—";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length !== 10) {
    return value;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getStatusStyle(status: string) {
  if (status === "Won") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "Lost" || status === "Not a Fit") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  if (status === "Proposal Sent" || status === "Demo Scheduled") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (status === "Contacted") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-950 text-white border-slate-950";
}

function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "emerald" | "amber" | "blue" | "rose";
}) {
  const valueClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "blue"
          ? "text-blue-700"
          : tone === "rose"
            ? "text-rose-700"
            : "text-slate-950";

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>

      <p className={`mt-4 text-5xl font-black tracking-tight ${valueClass}`}>
        {value}
      </p>

      <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

export default function DemoRequestsPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  async function loadRequests() {
    setLoading(true);
    setLoadError("");

    const { data, error } = await supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    const loadedRequests = (data ?? []) as DemoRequest[];
    const drafts: Record<string, string> = {};

    loadedRequests.forEach((request) => {
      drafts[request.id] = request.internal_note ?? "";
    });

    setRequests(loadedRequests);
    setNoteDrafts(drafts);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const searchableContent = [
        request.first_name,
        request.last_name,
        request.work_email,
        request.phone ?? "",
        request.organization_name,
        request.role_title,
        request.organization_type,
        request.team_size,
        request.primary_need,
        request.timeline,
        request.preferred_contact,
        request.message,
        request.status,
        request.internal_note ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? searchableContent.includes(normalizedSearch)
        : true;

      const matchesStatus =
        statusFilter === "All Statuses" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const newRequests = useMemo(
    () => requests.filter((request) => request.status === "New"),
    [requests]
  );

  const activePipeline = useMemo(
    () =>
      requests.filter((request) =>
        ["Contacted", "Demo Scheduled", "Proposal Sent"].includes(request.status)
      ),
    [requests]
  );

  const wonRequests = useMemo(
    () => requests.filter((request) => request.status === "Won"),
    [requests]
  );

  const lostRequests = useMemo(
    () =>
      requests.filter((request) =>
        ["Lost", "Not a Fit"].includes(request.status)
      ),
    [requests]
  );

  const requestsByNeed = useMemo(() => {
    const counts = new Map<string, number>();

    requests.forEach((request) => {
      counts.set(request.primary_need, (counts.get(request.primary_need) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  async function updateStatus(requestId: string, status: string) {
    setSavingId(requestId);

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("demo_requests")
      .update({
        status,
        updated_at: now,
        last_staff_action_at: now,
      })
      .eq("id", requestId);

    if (error) {
      setSavingId("");
      alert(error.message);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status,
              updated_at: now,
              last_staff_action_at: now,
            }
          : request
      )
    );

    setSavingId("");
  }

  async function saveInternalNote(requestId: string) {
    setSavingId(requestId);

    const now = new Date().toISOString();
    const internalNote = noteDrafts[requestId]?.trim() ?? "";

    const { error } = await supabase
      .from("demo_requests")
      .update({
        internal_note: internalNote,
        updated_at: now,
        last_staff_action_at: now,
      })
      .eq("id", requestId);

    if (error) {
      setSavingId("");
      alert(error.message);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              internal_note: internalNote,
              updated_at: now,
              last_staff_action_at: now,
            }
          : request
      )
    );

    setSavingId("");
  }

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Demo Requests
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Loading demo request pipeline...
          </h1>
        </section>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-500">
            Supabase Error
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Demo requests could not be loaded.
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-600">
            {loadError}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Sales Pipeline
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                CivicFlow demo requests
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Track website demo leads, organization needs, contact details,
                sales status, internal notes, and follow-up activity for
                Westforge.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={loadRequests}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Refresh
              </button>

              <a
                href="/request-demo"
                target="_blank"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Open demo form
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
          <MetricCard
            label="Total Leads"
            value={requests.length}
            detail="All demo requests"
          />

          <MetricCard
            label="New"
            value={newRequests.length}
            detail="Needs first contact"
            tone={newRequests.length > 0 ? "amber" : "emerald"}
          />

          <MetricCard
            label="Active"
            value={activePipeline.length}
            detail="Contacted, scheduled, or proposal"
            tone="blue"
          />

          <MetricCard
            label="Won"
            value={wonRequests.length}
            detail="Converted opportunities"
            tone="emerald"
          />

          <MetricCard
            label="Closed Lost"
            value={lostRequests.length}
            detail="Lost or not a fit"
            tone={lostRequests.length > 0 ? "rose" : "default"}
          />
        </section>

        <section className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section className="premium-card">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Filters
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Search demo leads
                  </h2>
                </div>

                <p className="text-sm font-black text-slate-500">
                  Showing {filteredRequests.length} of {requests.length} leads
                </p>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                <label className="input-label">
                  Search
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search name, organization, email, need, timeline..."
                    className="input-field"
                  />
                </label>

                <label className="input-label">
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="input-field"
                  >
                    <option>All Statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="grid gap-4">
              {filteredRequests.length === 0 ? (
                <div className="premium-card">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    No Results
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    No demo requests match these filters.
                  </h2>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusStyle(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {request.timeline}
                          </span>

                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {request.primary_need}
                          </span>
                        </div>

                        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                          {request.organization_name}
                        </h2>

                        <p className="mt-2 text-sm font-bold text-slate-500">
                          {request.first_name} {request.last_name} ·{" "}
                          {request.role_title}
                        </p>

                        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
                          {request.message}
                        </p>
                      </div>

                      <div className="grid shrink-0 gap-2 rounded-3xl bg-slate-50 p-4 text-sm">
                        <a
                          href={`mailto:${request.work_email}`}
                          className="font-black text-blue-700 hover:text-blue-900"
                        >
                          {request.work_email}
                        </a>

                        <p className="font-bold text-slate-600">
                          Phone: {formatPhone(request.phone)}
                        </p>

                        <p className="font-bold text-slate-600">
                          Contact: {request.preferred_contact}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 xl:grid-cols-3">
                      <div className="rounded-3xl bg-slate-50 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                          Organization Type
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {request.organization_type}
                        </p>
                      </div>

                      <div className="rounded-3xl bg-slate-50 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                          Team Size
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {request.team_size}
                        </p>
                      </div>

                      <div className="rounded-3xl bg-slate-50 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                          Submitted
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 xl:grid-cols-[260px_minmax(0,1fr)_160px]">
                      <label className="input-label">
                        Pipeline status
                        <select
                          value={request.status}
                          onChange={(event) =>
                            updateStatus(request.id, event.target.value)
                          }
                          disabled={savingId === request.id}
                          className="input-field"
                        >
                          {statusOptions.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>

                      <label className="input-label">
                        Internal Westforge note
                        <textarea
                          value={noteDrafts[request.id] ?? ""}
                          onChange={(event) =>
                            setNoteDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [request.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Add internal sales notes, contact attempts, pricing thoughts, or next steps..."
                          className="input-field resize-y leading-7"
                        />
                      </label>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => saveInternalNote(request.id)}
                          disabled={savingId === request.id}
                          className={`w-full rounded-2xl px-5 py-3 text-sm font-black transition ${
                            savingId === request.id
                              ? "bg-slate-200 text-slate-500"
                              : "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
                          } disabled:cursor-not-allowed`}
                        >
                          {savingId === request.id ? "Saving..." : "Save note"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                      <span>Source: {request.source}</span>
                      <span>·</span>
                      <span>Updated: {formatDate(request.updated_at)}</span>
                      <span>·</span>
                      <span>
                        Last staff action: {formatDate(request.last_staff_action_at)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
                Sales Signal
              </p>

              <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
                {newRequests.length > 0
                  ? "New demo leads need first contact."
                  : activePipeline.length > 0
                    ? "Active opportunities are moving."
                    : "Demo pipeline is ready."}
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-300">
                {newRequests.length > 0
                  ? "Start by contacting new organizations and moving qualified leads to Contacted or Demo Scheduled."
                  : activePipeline.length > 0
                    ? "Track scheduled demos and proposals carefully so Westforge can convert opportunities into paid work."
                    : "New demo requests from the website will appear here for Westforge review."}
              </p>
            </section>

            <section className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Needs Breakdown
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                What prospects want
              </h2>

              <div className="mt-6 space-y-3">
                {requestsByNeed.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="text-sm font-black text-slate-500">
                      No request needs have been captured yet.
                    </p>
                  </div>
                ) : (
                  requestsByNeed.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-black leading-6 text-slate-950">
                          {item.label}
                        </p>

                        <span className="rounded-2xl bg-slate-950 px-3 py-1 text-xs font-black text-white">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Pipeline Stages
              </p>

              <div className="mt-5 grid gap-3">
                {statusOptions.map((status) => {
                  const count = requests.filter(
                    (request) => request.status === status
                  ).length;

                  return (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-sm font-black text-slate-700">
                        {status}
                      </p>

                      <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}