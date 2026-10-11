"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import ClientShell from "@/components/ClientShell";
import { loadClientCases, loadClientWorkspace, type ClientCaseSummary, type ClientWorkspace } from "@/lib/clientWorkspace";
import { supabase } from "@/lib/supabase";

type Invoice = { id: string; case_id: string; invoice_number: string; status: string; issue_date: string; due_date: string | null; notes: string; subtotal_cents: number; amount_paid_cents: number; balance_cents: number; external_payment_url: string | null; payment_instructions: string; created_at: string; };
type InvoiceItem = { id: string; invoice_id: string; description: string; quantity: number; unit_amount_cents: number; amount_cents: number; };
type Payment = { id: string; invoice_id: string; amount_cents: number; status: string; payment_method: string; funds_destination: string; received_at: string; };
type Retainer = { id: string; case_id: string; title: string; agreement_text: string; agreement_sha256: string; status: string; client_email: string | null; sent_at: string | null; expires_at: string | null; signer_name: string | null; signed_at: string | null; consent_text: string | null; signed_pdf_path: string | null; signed_pdf_created_at: string | null; };

function money(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100); }
function date(value: string | null) {
  if (!value) return "Not set";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = dateOnly
    ? (() => {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
      })()
    : new Date(value);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}
function badge(status: string) { if (status === "paid" || status === "signed") return "border-emerald-200 bg-emerald-50 text-emerald-700"; if (status === "partially_paid" || status === "sent") return "border-blue-200 bg-blue-50 text-blue-700"; return "border-slate-200 bg-slate-50 text-slate-600"; }
function isOverdue(invoice: Invoice) { return Boolean(invoice.status !== "void" && invoice.balance_cents > 0 && invoice.due_date && invoice.due_date < new Date().toISOString().slice(0, 10)); }

export default function ClientBillingPage() {
  const [workspace, setWorkspace] = useState<ClientWorkspace | null>(null);
  const [cases, setCases] = useState<ClientCaseSummary[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [signingId, setSigningId] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [archiveBusyId, setArchiveBusyId] = useState("");

  async function loadData() {
    setLoading(true); setMessage("");
    const [workspaceResult, casesResult] = await Promise.all([loadClientWorkspace(), loadClientCases()]);
    if (!workspaceResult.workspace || workspaceResult.error || casesResult.error) { setMessage(workspaceResult.error || casesResult.error || "Unable to load billing access."); setLoading(false); return; }
    const [invoiceResult, itemResult, paymentResult, retainerResult] = await Promise.all([
      supabase.from("billing_invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("billing_invoice_items").select("*").order("created_at", { ascending: true }),
      supabase.from("billing_payments").select("*").order("received_at", { ascending: false }),
      supabase.from("retainer_signature_requests").select("*").order("created_at", { ascending: false }),
    ]);
    const error = invoiceResult.error || itemResult.error || paymentResult.error || retainerResult.error;
    if (error) { setMessage(error.message); setLoading(false); return; }
    setWorkspace(workspaceResult.workspace); setCases(casesResult.cases); setInvoices((invoiceResult.data ?? []) as Invoice[]); setItems((itemResult.data ?? []) as InvoiceItem[]); setPayments((paymentResult.data ?? []) as Payment[]); setRetainers((retainerResult.data ?? []) as Retainer[]);
    if (!signerName) setSignerName(`${workspaceResult.workspace.firstName} ${workspaceResult.workspace.lastName}`.trim());
    setLoading(false);
  }

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const caseById = useMemo(() => new Map<string, ClientCaseSummary>(cases.map((matter) => [matter.case_id, matter])), [cases]);
  const itemsByInvoice = useMemo(() => { const map=new Map<string,InvoiceItem[]>(); for(const item of items) map.set(item.invoice_id,[...(map.get(item.invoice_id)??[]),item]); return map; }, [items]);
  const paymentsByInvoice = useMemo(() => { const map=new Map<string,Payment[]>(); for(const p of payments) map.set(p.invoice_id,[...(map.get(p.invoice_id)??[]),p]); return map; }, [payments]);
  const totalDue = invoices.reduce((sum, row) => sum + row.balance_cents, 0);
  const pendingSignatures = retainers.filter((row) => row.status === "sent").length;

  async function signRetainer(event: FormEvent, requestId: string) {
    event.preventDefault();
    if (!consent) return setMessage("You must consent to use an electronic signature.");
    if (!signerName.trim() || !signatureText.trim()) return setMessage("Enter your legal name and electronic signature.");
    setBusy(true); setMessage("");
    const { error } = await supabase.rpc("sign_retainer_request", { p_request_id: requestId, p_signer_name: signerName.trim(), p_signature_text: signatureText.trim(), p_consent: true });
    setBusy(false);
    if (error) return setMessage(error.message);
    setSigningId(""); setSignatureText(""); setConsent(false);

    const { error: archiveError } = await supabase.functions.invoke("render-signed-retainer", {
      body: { request_id: requestId },
    });

    setMessage(
      archiveError
        ? "Agreement signed successfully. The signature record is preserved; the PDF archive can be generated from this page."
        : "Agreement signed successfully. The exact agreement fingerprint, signing timestamp, and private signed PDF are now preserved."
    );
    await loadData();
  }

  async function openSignedRetainerPdf(retainer: Retainer) {
    setArchiveBusyId(retainer.id);
    setMessage("");

    let path = retainer.signed_pdf_path;

    if (!path) {
      const { data, error } = await supabase.functions.invoke("render-signed-retainer", {
        body: { request_id: retainer.id },
      });

      if (error || !data?.path) {
        setArchiveBusyId("");
        setMessage(error?.message ?? "Unable to prepare the signed agreement PDF.");
        return;
      }

      path = data.path as string;
      await loadData();
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("case-documents")
      .createSignedUrl(path, 60);

    setArchiveBusyId("");

    if (signedUrlError || !signedUrlData?.signedUrl) {
      setMessage(signedUrlError?.message ?? "Unable to open the signed agreement PDF.");
      return;
    }

    window.open(signedUrlData.signedUrl, "_blank", "noopener,noreferrer");
  }

  return <ClientShell><div className="space-y-6">
    <section className="premium-card"><p className="eyebrow">Billing & Agreements</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Your invoices, payments, and signature requests.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Only billing and agreements connected to matters your firm has granted you access to appear here.</p><div className="mt-5 flex flex-wrap gap-2"><a href="#invoices" className="btn btn-secondary">Invoices & payments</a><a href="#agreements" className="btn btn-secondary">Agreements</a></div></section>
    {message ? <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{message}</div> : null}
    <section className="grid gap-4 sm:grid-cols-3"><div className="premium-card !p-5"><p className="eyebrow">Balance due</p><p className="mt-3 text-2xl font-bold text-slate-950">{money(totalDue)}</p></div><div className="premium-card !p-5"><p className="eyebrow">Open invoices</p><p className="mt-3 text-2xl font-bold text-slate-950">{invoices.filter((row) => row.balance_cents > 0).length}</p></div><div className="premium-card !p-5"><p className="eyebrow">Awaiting signature</p><p className="mt-3 text-2xl font-bold text-slate-950">{pendingSignatures}</p></div></section>
    {loading ? <section className="premium-card text-center"><div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" /><p className="mt-4 text-sm text-slate-500">Loading billing and agreements...</p></section> : null}
    {!loading ? <>
      <section id="invoices" className="premium-card scroll-mt-8"><div className="border-b border-slate-100 pb-5"><p className="eyebrow">Invoices & payments</p><h2 className="mt-3 text-xl font-bold text-slate-950">Secure billing</h2></div><div className="mt-6 space-y-4">{invoices.length === 0 ? <p className="text-sm text-slate-500">Your firm has not sent any invoices to your portal yet.</p> : invoices.map((invoice) => { const matter=caseById.get(invoice.case_id); return <div key={invoice.id} className={`rounded-2xl border border-slate-200 p-5 ${invoice.balance_cents === 0 || invoice.status === "void" ? "workflow-complete-record" : ""}`}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-950">{invoice.invoice_number}</span><span className={`chip border ${isOverdue(invoice) ? "border-rose-200 bg-rose-50 text-rose-700" : badge(invoice.status)}`}>{isOverdue(invoice) ? "overdue" : invoice.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm text-slate-600">Matter {matter?.case_number} · {matter?.service_category}</p><p className="mt-1 text-xs text-slate-400">Issued {date(invoice.issue_date)} · Due {date(invoice.due_date)}</p></div><div className="grid grid-cols-3 gap-4 text-right"><div><p className="text-xs text-slate-400">Total</p><p className="mt-1 font-bold">{money(invoice.subtotal_cents)}</p></div><div><p className="text-xs text-slate-400">Paid</p><p className="mt-1 font-bold text-emerald-700">{money(invoice.amount_paid_cents)}</p></div><div><p className="text-xs text-slate-400">Due</p><p className="mt-1 font-bold">{invoice.status === "void" ? money(0) : money(invoice.balance_cents)}</p></div></div></div><div className="mt-4 space-y-2">{(itemsByInvoice.get(invoice.id) ?? []).map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"><span>{item.description}</span><strong>{money(item.amount_cents)}</strong></div>)}</div>{invoice.payment_instructions ? <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">{invoice.payment_instructions}</p> : null}{(paymentsByInvoice.get(invoice.id) ?? []).length ? <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Payment history</p>{(paymentsByInvoice.get(invoice.id) ?? []).map((p) => <p key={p.id} className="mt-2 text-sm text-slate-600">{date(p.received_at)} · {money(p.amount_cents)} · {p.payment_method} · {p.status}</p>)}</div> : null}<div className="mt-5 flex flex-wrap gap-2">{invoice.external_payment_url && invoice.balance_cents > 0 ? <a href={invoice.external_payment_url} target="_blank" rel="noreferrer" className="btn btn-primary">Pay securely</a> : null}<Link href={`/client/cases/${invoice.case_id}`} className="btn btn-secondary">Open matter</Link></div>{!invoice.external_payment_url && invoice.balance_cents > 0 ? <p className="mt-3 text-xs text-slate-400">Your firm has not attached an online payment page to this invoice.</p> : null}</div>; })}</div></section>

      <section id="agreements" className="premium-card scroll-mt-8"><div className="border-b border-slate-100 pb-5"><p className="eyebrow">Retainer agreements</p><h2 className="mt-3 text-xl font-bold text-slate-950">Review and sign</h2></div><div className="mt-6 space-y-4">{retainers.length === 0 ? <p className="text-sm text-slate-500">No signature requests are waiting for you.</p> : retainers.map((retainer) => { const matter=caseById.get(retainer.case_id); const expired=retainer.expires_at ? new Date(retainer.expires_at).getTime() <= Date.now() : false; return <div key={retainer.id} className={`rounded-2xl border border-slate-200 p-5 ${retainer.status === "signed" || retainer.status === "voided" ? "workflow-complete-record" : ""}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-950">{retainer.title}</span><span className={`chip border ${badge(retainer.status)}`}>{retainer.status}</span></div><p className="mt-2 text-sm text-slate-600">Matter {matter?.case_number}</p><p className="mt-1 text-xs text-slate-400">Document fingerprint: {retainer.agreement_sha256.slice(0,20)}...</p></div><p className="text-sm text-slate-500">{retainer.signed_at ? `Signed ${date(retainer.signed_at)}` : retainer.expires_at ? `Sign by ${date(retainer.expires_at)}` : "No expiration date"}</p></div><div className="mt-5 rounded-xl bg-slate-50 p-5"><pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{retainer.agreement_text}</pre></div>{retainer.status === "signed" ? <div className="workflow-locked mt-4 rounded-xl border p-4 text-sm text-slate-700"><strong className="text-slate-900">Signed by {retainer.signer_name}</strong><p className="mt-1">{retainer.consent_text}</p><div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={archiveBusyId === retainer.id} onClick={() => openSignedRetainerPdf(retainer)} className="btn btn-secondary">{archiveBusyId === retainer.id ? "Preparing PDF..." : retainer.signed_pdf_path ? "Download signed PDF" : "Archive signed PDF"}</button>{retainer.signed_pdf_created_at ? <span className="text-xs text-slate-500">Archived {date(retainer.signed_pdf_created_at)}</span> : null}</div></div> : null}{retainer.status === "sent" && !expired ? <div className="mt-5">{signingId !== retainer.id ? <button className="btn btn-primary" type="button" onClick={() => { setSigningId(retainer.id); setSignatureText(""); setConsent(false); }}>Review and sign</button> : <form onSubmit={(event) => signRetainer(event, retainer.id)} className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4"><label className="input-label">Legal name<input className="input-field" value={signerName} onChange={(e) => setSignerName(e.target.value)} required /></label><label className="input-label">Electronic signature<input className="input-field" value={signatureText} onChange={(e) => setSignatureText(e.target.value)} placeholder="Type your name as your signature" required /></label><label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>I consent to use an electronic signature and intend this signature to be legally binding.</span></label><div className="flex flex-wrap gap-2"><button disabled={busy} className="btn btn-primary" type="submit">{busy ? "Signing..." : "Sign agreement"}</button><button className="btn btn-secondary" type="button" onClick={() => setSigningId("")}>Cancel</button></div></form>}</div> : null}{retainer.status === "sent" && expired ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This signature request has expired. Contact your legal team for a new agreement.</p> : null}</div>; })}</div></section>
    </> : null}
  </div></ClientShell>;
}