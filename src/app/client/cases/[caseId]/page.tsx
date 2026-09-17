"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ClientShell from "@/components/ClientShell";
import { loadClientCases, type ClientCaseSummary } from "@/lib/clientWorkspace";
import { supabase } from "@/lib/supabase";

type ClientDocument = {
  document_id: string;
  case_id: string;
  name: string;
  description: string | null;
  status: string;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
};

type ClientActivity = {
  activity_id: string;
  case_id: string;
  title: string;
  detail: string;
  created_at: string;
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

export default function ClientCasePage() {
  const params = useParams();
  const caseId = String(params.caseId ?? "");
  const [caseRecord, setCaseRecord] = useState<ClientCaseSummary | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [activity, setActivity] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMatter() {
      const casesResult = await loadClientCases();
      if (!active) return;

      if (casesResult.error) {
        setMessage(casesResult.error);
        setLoading(false);
        return;
      }

      const matchingCase = casesResult.cases.find((item) => item.case_id === caseId) ?? null;
      if (!matchingCase) {
        setMessage("This matter is not connected to your client account.");
        setLoading(false);
        return;
      }

      const [documentsResult, activityResult] = await Promise.all([
        supabase.rpc("get_client_documents", { p_case_id: caseId }),
        supabase.rpc("get_client_activity", { p_case_id: caseId }),
      ]);

      if (!active) return;

      if (documentsResult.error) {
        setMessage(documentsResult.error.message);
        setLoading(false);
        return;
      }

      if (activityResult.error) {
        setMessage(activityResult.error.message);
        setLoading(false);
        return;
      }

      setCaseRecord(matchingCase);
      setDocuments((documentsResult.data ?? []) as ClientDocument[]);
      setActivity((activityResult.data ?? []) as ClientActivity[]);
      setLoading(false);
    }

    loadMatter();
    return () => {
      active = false;
    };
  }, [caseId]);

  async function downloadDocument(document: ClientDocument) {
    if (!document.file_path) {
      setDownloadMessage("No downloadable file has been shared for this document yet.");
      return;
    }

    setDownloadMessage("");
    const { data, error } = await supabase.storage
      .from("case-documents")
      .createSignedUrl(document.file_path, 300);

    if (error || !data?.signedUrl) {
      setDownloadMessage(error?.message ?? "Unable to create a secure download link.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <ClientShell>
      {loading ? (
        <section className="premium-card text-center">
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading matter...</p>
        </section>
      ) : message || !caseRecord ? (
        <section className="premium-card">
          <p className="eyebrow text-rose-500">Matter Access</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">This matter could not be opened.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          <Link href="/client" className="btn btn-primary mt-6">Back to my matters</Link>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="premium-card">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link href="/client" className="text-sm font-semibold text-slate-500 hover:text-slate-950">← Back to my matters</Link>
                <p className="eyebrow mt-5">{caseRecord.organization_name}</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Matter {caseRecord.case_number}</h1>
                <p className="mt-3 text-sm leading-7 text-slate-600">{caseRecord.service_category}</p>
              </div>
              <span className="chip border-slate-200 bg-slate-50 text-slate-700">{caseRecord.status}</span>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{caseRecord.status}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Assigned team</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{caseRecord.assigned_to || "Your legal team"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Priority</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{caseRecord.priority}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Last updated</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{formatDate(caseRecord.updated_at)}</p>
              </div>
            </div>

            {caseRecord.decision_outcome ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                Matter outcome: {caseRecord.decision_outcome}
              </div>
            ) : null}
          </section>

          {downloadMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{downloadMessage}</div>
          ) : null}

          <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="premium-card">
              <p className="eyebrow">Shared Documents</p>
              <h2 className="mt-3 text-xl font-bold text-slate-950">Documents your legal team shared</h2>

              <div className="mt-6 space-y-3">
                {documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-500">No documents have been shared with you yet.</div>
                ) : documents.map((document) => (
                  <div key={document.document_id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">{document.name}</p>
                        {document.description ? <p className="mt-1.5 text-sm leading-6 text-slate-600">{document.description}</p> : null}
                        <p className="mt-2 text-xs font-medium text-slate-400">Status: {document.status}</p>
                      </div>
                      {document.file_path ? (
                        <button type="button" onClick={() => downloadDocument(document)} className="btn btn-secondary shrink-0">Download</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card">
              <p className="eyebrow">Updates</p>
              <h2 className="mt-3 text-xl font-bold text-slate-950">Shared activity</h2>
              <div className="mt-6 space-y-4">
                {activity.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-500">No client-visible updates have been posted yet.</p>
                ) : activity.map((item) => (
                  <div key={item.activity_id} className="border-l-2 border-slate-200 pl-4">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.detail}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">{formatDate(item.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </ClientShell>
  );
}
