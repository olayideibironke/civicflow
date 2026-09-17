"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { loadStaffWorkspace } from "@/lib/workspace";
import { validateRequiredEmail } from "@/lib/validation";

type FirmCase = {
  id: string;
  case_number: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string | null;
  status: string;
  updated_at: string;
};

type SharedDocument = {
  id: string;
  name: string;
  status: string;
  file_name: string | null;
  client_visible: boolean;
};

type SharedActivity = {
  id: string;
  title: string;
  detail: string;
  created_at: string;
  client_visible: boolean;
};

type ClientInvite = {
  id: string;
  email: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

type InviteRpcRow = {
  invite_token: string;
  invite_email: string;
  case_number: string;
  expires_at: string;
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

export default function ClientAccessPage() {
  const [cases, setCases] = useState<FirmCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [activity, setActivity] = useState<SharedActivity[]>([]);
  const [invites, setInvites] = useState<ClientInvite[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [activationUrl, setActivationUrl] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId]
  );

  const filteredCases = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return cases;

    return cases.filter((item) =>
      [
        item.case_number,
        item.client_first_name,
        item.client_last_name,
        item.client_email ?? "",
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [cases, search]);

  async function loadCases() {
    setLoading(true);
    setMessage("");

    const workspaceResult = await loadStaffWorkspace();
    if (!workspaceResult.workspace) {
      setMessage(workspaceResult.error || "Firm workspace could not be loaded.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("cases")
      .select(
        "id, case_number, client_first_name, client_last_name, client_email, status, updated_at"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const loaded = (data ?? []) as FirmCase[];
    setCases(loaded);
    setSelectedCaseId((current) => current || loaded[0]?.id || "");
    setLoading(false);
  }

  async function loadCaseAccess(caseId: string) {
    if (!caseId) {
      setDocuments([]);
      setActivity([]);
      setInvites([]);
      return;
    }

    setLoadingAccess(true);
    setMessage("");
    setActivationUrl("");
    setInviteMessage("");
    setCopyMessage("");

    const [documentsResult, activityResult, invitesResult] = await Promise.all([
      supabase
        .from("case_documents")
        .select("id, name, status, file_name, client_visible")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true }),
      supabase
        .from("case_activity")
        .select("id, title, detail, created_at, client_visible")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_portal_invites")
        .select("id, email, expires_at, accepted_at, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false }),
    ]);

    const firstError =
      documentsResult.error || activityResult.error || invitesResult.error;

    if (firstError) {
      setMessage(firstError.message);
      setLoadingAccess(false);
      return;
    }

    setDocuments((documentsResult.data ?? []) as SharedDocument[]);
    setActivity((activityResult.data ?? []) as SharedActivity[]);
    setInvites((invitesResult.data ?? []) as ClientInvite[]);
    setLoadingAccess(false);
  }

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;

    const matchingCase = cases.find((item) => item.id === selectedCaseId);
    setInviteEmail(matchingCase?.client_email ?? "");
    loadCaseAccess(selectedCaseId);
  }, [cases, selectedCaseId]);

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCase) {
      setInviteMessage("Select a matter first.");
      return;
    }

    const emailError = validateRequiredEmail(inviteEmail, "Client email");
    if (emailError) {
      setInviteMessage(emailError);
      return;
    }

    setCreatingInvite(true);
    setInviteMessage("");
    setActivationUrl("");

    const { data, error } = await supabase.rpc("create_client_portal_invite", {
      p_case_id: selectedCase.id,
      p_email: inviteEmail.trim(),
    });

    setCreatingInvite(false);

    if (error) {
      setInviteMessage(error.message);
      return;
    }

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    const row = rows[0] as InviteRpcRow | undefined;

    if (!row?.invite_token) {
      setInviteMessage("CivicFlow did not return an activation token.");
      return;
    }

    const url = `${window.location.origin}/client/activate?token=${encodeURIComponent(
      row.invite_token
    )}`;

    await loadCaseAccess(selectedCase.id);
    setActivationUrl(url);
    setInviteMessage(
      `Secure invitation created for ${row.invite_email}. It expires ${formatDate(
        row.expires_at
      )}.`
    );
  }

  async function copyActivationLink() {
    if (!activationUrl) return;

    try {
      await navigator.clipboard.writeText(activationUrl);
      setCopyMessage("Activation link copied.");
    } catch {
      setCopyMessage("Copy failed. Select and copy the link manually.");
    }
  }

  async function toggleDocumentVisibility(document: SharedDocument) {
    const nextVisible = !document.client_visible;
    const { error } = await supabase
      .from("case_documents")
      .update({ client_visible: nextVisible })
      .eq("id", document.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setDocuments((current) =>
      current.map((item) =>
        item.id === document.id ? { ...item, client_visible: nextVisible } : item
      )
    );
  }

  async function toggleActivityVisibility(item: SharedActivity) {
    const nextVisible = !item.client_visible;
    const { error } = await supabase
      .from("case_activity")
      .update({ client_visible: nextVisible })
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setActivity((current) =>
      current.map((activityItem) =>
        activityItem.id === item.id
          ? { ...activityItem, client_visible: nextVisible }
          : activityItem
      )
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card">
          <p className="eyebrow">Client Portal</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Control client access matter by matter
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            Invite clients to a secure portal and choose exactly which documents and case updates they can see. Internal notes remain private to the firm.
          </p>
        </section>

        {message ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {message}
          </div>
        ) : null}

        <section className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="premium-card xl:sticky xl:top-8">
            <p className="eyebrow">Matters</p>
            <label className="input-label mt-5">
              Search matters
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Case number, client, email"
                className="input-field"
              />
            </label>

            <div className="mt-5 max-h-[640px] space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <p className="py-6 text-center text-sm text-slate-500">Loading matters...</p>
              ) : filteredCases.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No matching matters.</p>
              ) : (
                filteredCases.map((item) => {
                  const active = item.id === selectedCaseId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCaseId(item.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">
                        {item.case_number}
                      </p>
                      <p className="mt-2 font-semibold">
                        {item.client_first_name} {item.client_last_name}
                      </p>
                      <p className={`mt-1 truncate text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
                        {item.client_email || "No client email on file"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="space-y-6">
            {!selectedCase ? (
              <section className="premium-card text-center">
                <h2 className="text-xl font-bold text-slate-950">Select a matter to manage client access.</h2>
              </section>
            ) : (
              <>
                <section className="premium-card">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="eyebrow">{selectedCase.case_number}</p>
                      <h2 className="mt-3 text-xl font-bold text-slate-950">
                        {selectedCase.client_first_name} {selectedCase.client_last_name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">Status: {selectedCase.status}</p>
                    </div>
                    <span className="chip border-slate-200 bg-slate-50 text-slate-700">
                      Client portal access
                    </span>
                  </div>

                  <form onSubmit={createInvite} noValidate className="mt-6 border-t border-slate-100 pt-6">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <label className="input-label">
                        Client email *
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(event) => {
                            setInviteEmail(event.target.value);
                            setInviteMessage("");
                            setActivationUrl("");
                          }}
                          placeholder="client@example.com"
                          className="input-field"
                          required
                        />
                      </label>
                      <button type="submit" disabled={creatingInvite} className="btn btn-primary px-6 py-3">
                        {creatingInvite ? "Creating..." : "Create secure invitation"}
                      </button>
                    </div>
                  </form>

                  {inviteMessage ? (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-blue-800">
                      {inviteMessage}
                    </div>
                  ) : null}

                  {activationUrl ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Client activation link</p>
                      <p className="mt-2 break-all text-sm text-slate-700">{activationUrl}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button type="button" onClick={copyActivationLink} className="btn btn-secondary">Copy link</button>
                        {copyMessage ? <span className="text-sm font-medium text-slate-600">{copyMessage}</span> : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-sm font-bold text-slate-900">Invitation history</p>
                    <div className="mt-3 space-y-2">
                      {invites.length === 0 ? (
                        <p className="text-sm text-slate-500">No client invitations have been created for this matter.</p>
                      ) : (
                        invites.map((invite) => (
                          <div key={invite.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{invite.email}</p>
                              <p className="mt-1 text-xs text-slate-500">Created {formatDate(invite.created_at)} · Expires {formatDate(invite.expires_at)}</p>
                            </div>
                            <span className={`chip ${invite.accepted_at ? "border-emerald-200 bg-emerald-50 text-emerald-700" : new Date(invite.expires_at) < new Date() ? "border-slate-200 bg-slate-50 text-slate-500" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                              {invite.accepted_at ? "Activated" : new Date(invite.expires_at) < new Date() ? "Expired" : "Pending"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="premium-card">
                    <p className="eyebrow">Shared Documents</p>
                    <h3 className="mt-3 text-lg font-bold text-slate-950">Choose client-visible documents</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">A document stays private until you explicitly share it.</p>

                    <div className="mt-5 space-y-3">
                      {loadingAccess ? (
                        <p className="text-sm text-slate-500">Loading documents...</p>
                      ) : documents.length === 0 ? (
                        <p className="text-sm text-slate-500">No documents are attached to this matter.</p>
                      ) : (
                        documents.map((document) => (
                          <label key={document.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                            <input
                              type="checkbox"
                              checked={document.client_visible}
                              onChange={() => toggleDocumentVisibility(document)}
                              className="mt-1 h-4 w-4"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-900">{document.name}</span>
                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                {document.file_name ? `File: ${document.file_name}` : `Status: ${document.status}`}
                              </span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="premium-card">
                    <p className="eyebrow">Shared Updates</p>
                    <h3 className="mt-3 text-lg font-bold text-slate-950">Choose client-visible activity</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Internal notes are never exposed here. Only selected activity updates can appear in the client portal.</p>

                    <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                      {loadingAccess ? (
                        <p className="text-sm text-slate-500">Loading activity...</p>
                      ) : activity.length === 0 ? (
                        <p className="text-sm text-slate-500">No activity has been recorded for this matter.</p>
                      ) : (
                        activity.map((item) => (
                          <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                            <input
                              type="checkbox"
                              checked={item.client_visible}
                              onChange={() => toggleActivityVisibility(item)}
                              className="mt-1 h-4 w-4"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">{item.detail}</span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
