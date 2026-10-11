"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { loadStaffWorkspace, type StaffWorkspace } from "@/lib/workspace";

type Matter = {
  id: string;
  organization_id: string;
  case_number: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string | null;
  service_category: string;
  status: string;
};

type Invoice = {
  id: string;
  organization_id: string;
  case_id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  notes: string;
  subtotal_cents: number;
  amount_paid_cents: number;
  balance_cents: number;
  external_payment_url: string | null;
  payment_instructions: string;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
};

type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_amount_cents: number;
  amount_cents: number;
};

type Payment = {
  id: string;
  invoice_id: string;
  amount_cents: number;
  status: string;
  payment_method: string;
  funds_destination: string;
  memo: string;
  received_at: string;
};

type Retainer = {
  id: string;
  organization_id: string;
  case_id: string;
  title: string;
  agreement_text: string;
  agreement_sha256: string;
  status: string;
  client_email: string | null;
  sent_at: string | null;
  expires_at: string | null;
  signer_name: string | null;
  signer_email: string | null;
  signed_at: string | null;
  signed_pdf_path: string | null;
  signed_pdf_created_at: string | null;
  created_at: string;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);
}

function shortDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrencyInput(value: string) {
  const sanitized = value.replace(/[^\d.]/g, "");
  if (!sanitized) return "";

  const firstDot = sanitized.indexOf(".");
  const hasDecimal = firstDot >= 0;
  const wholeRaw = hasDecimal ? sanitized.slice(0, firstDot) : sanitized;
  const decimalRaw = hasDecimal
    ? sanitized.slice(firstDot + 1).replace(/\./g, "").slice(0, 2)
    : "";

  const normalizedWhole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const groupedWhole = normalizedWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return "$" + groupedWhole + (hasDecimal ? "." + decimalRaw : "");
}

function dollarsToCents(value: string) {
  const normalized = value.replace(/[$,\s]/g, "");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

function badge(status: string) {
  if (status === "paid" || status === "signed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "partially_paid" || status === "sent") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "void" || status === "voided" || status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function BillingPage() {
  const [requestedMatterId, setRequestedMatterId] = useState("");
  const [workspace, setWorkspace] = useState<StaffWorkspace | null>(null);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [archiveBusyId, setArchiveBusyId] = useState("");

  const [invoiceCaseId, setInvoiceCaseId] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("Legal services");
  const [invoiceQuantity, setInvoiceQuantity] = useState("1");
  const [invoiceRate, setInvoiceRate] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoicePaymentUrl, setInvoicePaymentUrl] = useState("");
  const [invoicePaymentInstructions, setInvoicePaymentInstructions] = useState("");
  const [editingInvoiceDraft, setEditingInvoiceDraft] = useState(false);

  const [itemInvoiceId, setItemInvoiceId] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemRate, setItemRate] = useState("");

  const [paymentInvoiceId, setPaymentInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [paymentDestination, setPaymentDestination] = useState("operating");
  const [paymentMemo, setPaymentMemo] = useState("");

  const [retainerCaseId, setRetainerCaseId] = useState("");
  const [retainerTitle, setRetainerTitle] = useState("Retainer Agreement");
  const [retainerEmail, setRetainerEmail] = useState("");
  const [retainerExpires, setRetainerExpires] = useState("");
  const [retainerText, setRetainerText] = useState("");
  const [editingRetainerDraft, setEditingRetainerDraft] = useState(false);

  async function loadData(preferredMatterId = requestedMatterId) {
    setLoading(true);
    setMessage("");

    const workspaceResult = await loadStaffWorkspace();
    if (!workspaceResult.workspace) {
      setMessage(workspaceResult.error || "Unable to load firm workspace.");
      setLoading(false);
      return;
    }

    const [matterResult, invoiceResult, itemResult, paymentResult, retainerResult] = await Promise.all([
      supabase.from("cases").select("id, organization_id, case_number, client_first_name, client_last_name, client_email, service_category, status").order("created_at", { ascending: false }),
      supabase.from("billing_invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("billing_invoice_items").select("*").order("created_at", { ascending: true }),
      supabase.from("billing_payments").select("*").order("received_at", { ascending: false }),
      supabase.from("retainer_signature_requests").select("*").order("created_at", { ascending: false }),
    ]);

    const firstError = matterResult.error || invoiceResult.error || itemResult.error || paymentResult.error || retainerResult.error;
    if (firstError) {
      setMessage(firstError.message);
      setLoading(false);
      return;
    }

    const loadedMatters = (matterResult.data ?? []) as Matter[];
    setWorkspace(workspaceResult.workspace);
    setMatters(loadedMatters);
    setInvoices((invoiceResult.data ?? []) as Invoice[]);
    setItems((itemResult.data ?? []) as InvoiceItem[]);
    setPayments((paymentResult.data ?? []) as Payment[]);
    setRetainers((retainerResult.data ?? []) as Retainer[]);

    const requestedMatter = loadedMatters.find((matter) => matter.id === preferredMatterId);
    const defaultMatter = requestedMatter ?? loadedMatters[0];

    if (!invoiceCaseId && defaultMatter) setInvoiceCaseId(defaultMatter.id);
    if (!retainerCaseId && defaultMatter) {
      setRetainerCaseId(defaultMatter.id);
      setRetainerEmail(defaultMatter.client_email ?? "");
    }
    setLoading(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preferredMatterId = params.get("matter")?.trim() ?? "";
    setRequestedMatterId(preferredMatterId);
    loadData(preferredMatterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matterById = useMemo(() => new Map<string, Matter>(matters.map((matter) => [matter.id, matter])), [matters]);
  const itemsByInvoice = useMemo(() => {
    const map = new Map<string, InvoiceItem[]>();
    for (const item of items) map.set(item.invoice_id, [...(map.get(item.invoice_id) ?? []), item]);
    return map;
  }, [items]);
  const paymentsByInvoice = useMemo(() => {
    const map = new Map<string, Payment[]>();
    for (const payment of payments) map.set(payment.invoice_id, [...(map.get(payment.invoice_id) ?? []), payment]);
    return map;
  }, [payments]);

  const draftInvoices = invoices.filter((invoice) => invoice.status === "draft");
  const payableInvoices = invoices.filter((invoice) => invoice.status === "sent" || invoice.status === "partially_paid");
  const outstanding = payableInvoices.reduce((sum, invoice) => sum + invoice.balance_cents, 0);
  const collected = invoices.reduce((sum, invoice) => sum + invoice.amount_paid_cents, 0);
  const overdueInvoices = payableInvoices.filter((invoice) => invoice.due_date && invoice.due_date < new Date().toISOString().slice(0, 10));
  const awaitingSignature = retainers.filter((retainer) => retainer.status === "sent").length;
  const draftInvoiceForSelectedMatter = useMemo(
    () =>
      invoices.find(
        (invoice) => invoice.case_id === invoiceCaseId && invoice.status === "draft"
      ) ?? null,
    [invoices, invoiceCaseId]
  );
  const primaryDraftItem = draftInvoiceForSelectedMatter
    ? (itemsByInvoice.get(draftInvoiceForSelectedMatter.id) ?? [])[0] ?? null
    : null;

  const invoiceFieldsLocked = Boolean(draftInvoiceForSelectedMatter) && !editingInvoiceDraft;
  const invoiceFormDescription =
    draftInvoiceForSelectedMatter && !editingInvoiceDraft
      ? primaryDraftItem?.description ?? "Legal services"
      : invoiceDescription;
  const invoiceFormQuantity =
    draftInvoiceForSelectedMatter && !editingInvoiceDraft
      ? String(primaryDraftItem?.quantity ?? 1)
      : invoiceQuantity;
  const invoiceFormRate =
    draftInvoiceForSelectedMatter && !editingInvoiceDraft
      ? formatCurrencyInput(String((primaryDraftItem?.unit_amount_cents ?? 0) / 100))
      : invoiceRate;
  const invoiceFormDueDate =
    draftInvoiceForSelectedMatter && !editingInvoiceDraft
      ? draftInvoiceForSelectedMatter.due_date ?? ""
      : invoiceDueDate;
  const invoiceFormPaymentUrl =
    draftInvoiceForSelectedMatter && !editingInvoiceDraft
      ? draftInvoiceForSelectedMatter.external_payment_url ?? ""
      : invoicePaymentUrl;
  const invoiceFormPaymentInstructions =
    draftInvoiceForSelectedMatter && !editingInvoiceDraft
      ? draftInvoiceForSelectedMatter.payment_instructions ?? ""
      : invoicePaymentInstructions;
  const invoiceFormNotes =
    draftInvoiceForSelectedMatter && !editingInvoiceDraft
      ? draftInvoiceForSelectedMatter.notes ?? ""
      : invoiceNotes;
  const activeRetainerForSelectedMatter = useMemo(
    () =>
      retainers.find(
        (retainer) =>
          retainer.case_id === retainerCaseId && retainer.status !== "voided"
      ) ?? null,
    [retainers, retainerCaseId]
  );

  const retainerCreateLabel = activeRetainerForSelectedMatter
    ? activeRetainerForSelectedMatter.status === "draft"
      ? editingRetainerDraft
        ? "Save draft changes"
        : "Edit draft"
      : activeRetainerForSelectedMatter.status === "sent"
        ? "Sent for signature"
        : activeRetainerForSelectedMatter.status === "signed"
          ? "Agreement signed"
          : "Retainer already exists"
    : busy
      ? "Working..."
      : "Create retainer draft";

  const retainerFieldsLocked =
    Boolean(activeRetainerForSelectedMatter) &&
    !(activeRetainerForSelectedMatter?.status === "draft" && editingRetainerDraft);

  const retainerFormTitle =
    activeRetainerForSelectedMatter && !editingRetainerDraft
      ? activeRetainerForSelectedMatter.title
      : retainerTitle;
  const retainerFormEmail =
    activeRetainerForSelectedMatter && !editingRetainerDraft
      ? activeRetainerForSelectedMatter.client_email ?? ""
      : retainerEmail;
  const retainerFormExpires =
    activeRetainerForSelectedMatter && !editingRetainerDraft
      ? activeRetainerForSelectedMatter.expires_at?.slice(0, 10) ?? ""
      : retainerExpires;
  const retainerFormText =
    activeRetainerForSelectedMatter && !editingRetainerDraft
      ? activeRetainerForSelectedMatter.agreement_text
      : retainerText;


  async function createInvoice(event: FormEvent) {
    event.preventDefault();
    if (!invoiceCaseId) return setMessage("Choose a matter first.");
    if (draftInvoiceForSelectedMatter) {
      return setMessage("This matter already has a draft invoice. Edit or send the existing draft instead of creating a duplicate.");
    }
    const unitAmount = dollarsToCents(invoiceRate);
    if (unitAmount <= 0) return setMessage("Enter a valid invoice rate.");
    if (invoicePaymentUrl && !invoicePaymentUrl.startsWith("https://")) return setMessage("Payment links must begin with https://");

    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("create_billing_invoice", {
      p_case_id: invoiceCaseId,
      p_due_date: invoiceDueDate || null,
      p_notes: invoiceNotes,
      p_description: invoiceDescription,
      p_quantity: Number(invoiceQuantity),
      p_unit_amount_cents: unitAmount,
      p_external_payment_url: invoicePaymentUrl || null,
      p_payment_instructions: invoicePaymentInstructions,
    });
    setBusy(false);
    if (error) return setMessage(error.message);

    setMessage("Draft invoice created. The completed draft is now locked below.");
    await loadData();
  }

  function beginInvoiceDraftEdit() {
    if (!draftInvoiceForSelectedMatter) return;
    const firstItem = (itemsByInvoice.get(draftInvoiceForSelectedMatter.id) ?? [])[0];

    setInvoiceDescription(firstItem?.description ?? "Legal services");
    setInvoiceQuantity(String(firstItem?.quantity ?? 1));
    setInvoiceRate(formatCurrencyInput(String((firstItem?.unit_amount_cents ?? 0) / 100)));
    setInvoiceDueDate(draftInvoiceForSelectedMatter.due_date ?? "");
    setInvoiceNotes(draftInvoiceForSelectedMatter.notes ?? "");
    setInvoicePaymentUrl(draftInvoiceForSelectedMatter.external_payment_url ?? "");
    setInvoicePaymentInstructions(draftInvoiceForSelectedMatter.payment_instructions ?? "");
    setItemInvoiceId(draftInvoiceForSelectedMatter.id);
    setEditingInvoiceDraft(true);
    setMessage("");
  }

  async function updateInvoiceDraft(event: FormEvent) {
    event.preventDefault();
    const invoice = draftInvoiceForSelectedMatter;
    if (!invoice) return;

    const firstItem = (itemsByInvoice.get(invoice.id) ?? [])[0];
    const unitAmount = dollarsToCents(invoiceRate);
    if (unitAmount <= 0) return setMessage("Enter a valid invoice rate.");
    if (invoicePaymentUrl && !invoicePaymentUrl.startsWith("https://")) {
      return setMessage("Payment links must begin with https://");
    }

    setBusy(true);
    setMessage("");

    const invoiceResult = await supabase
      .from("billing_invoices")
      .update({
        due_date: invoiceDueDate || null,
        notes: invoiceNotes,
        external_payment_url: invoicePaymentUrl || null,
        payment_instructions: invoicePaymentInstructions,
      })
      .eq("id", invoice.id)
      .eq("status", "draft");

    if (invoiceResult.error) {
      setBusy(false);
      return setMessage(invoiceResult.error.message);
    }

    if (firstItem) {
      const itemResult = await supabase
        .from("billing_invoice_items")
        .update({
          description: invoiceDescription.trim() || "Legal services",
          quantity: Number(invoiceQuantity),
          unit_amount_cents: unitAmount,
        })
        .eq("id", firstItem.id)
        .eq("invoice_id", invoice.id);

      if (itemResult.error) {
        setBusy(false);
        return setMessage(itemResult.error.message);
      }
    }

    setBusy(false);
    setEditingInvoiceDraft(false);
    setMessage("Draft invoice updated.");
    await loadData();
  }

  async function addLineItem(event: FormEvent) {
    event.preventDefault();
    if (!editingInvoiceDraft || !draftInvoiceForSelectedMatter) {
      return setMessage("Choose Edit draft before adding another line item.");
    }
    const invoice = invoices.find((row) => row.id === itemInvoiceId);
    if (!invoice) return setMessage("Choose a draft invoice.");
    const unitAmount = dollarsToCents(itemRate);
    if (unitAmount <= 0 || !itemDescription.trim()) return setMessage("Enter a description and valid rate.");

    setBusy(true);
    const { error } = await supabase.from("billing_invoice_items").insert({
      invoice_id: invoice.id,
      organization_id: invoice.organization_id,
      case_id: invoice.case_id,
      description: itemDescription.trim(),
      quantity: Number(itemQuantity),
      unit_amount_cents: unitAmount,
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setItemDescription("");
    setItemRate("");
    setMessage("Line item added.");
    await loadData();
  }

  async function updateInvoiceStatus(invoiceId: string, status: "sent" | "void") {
    setBusy(true);
    const { error } = await supabase.from("billing_invoices").update({ status }).eq("id", invoiceId);
    setBusy(false);
    if (error) return setMessage(error.message);
    setEditingInvoiceDraft(false);
    setMessage(status === "sent" ? "Invoice sent to the client portal." : "Invoice voided.");
    await loadData();
  }

  async function recordPayment(event: FormEvent) {
    event.preventDefault();
    const invoice = invoices.find((row) => row.id === paymentInvoiceId);
    if (!invoice || !workspace) return setMessage("Choose an outstanding invoice.");
    const amount = dollarsToCents(paymentAmount);
    if (amount <= 0) return setMessage("Enter a valid payment amount.");
    if (amount > invoice.balance_cents) return setMessage(`Payment cannot exceed the remaining balance of ${money(invoice.balance_cents)}.`);

    setBusy(true);
    const { error } = await supabase.from("billing_payments").insert({
      invoice_id: invoice.id,
      organization_id: invoice.organization_id,
      case_id: invoice.case_id,
      amount_cents: amount,
      status: "succeeded",
      payment_method: paymentMethod,
      processor: "manual",
      funds_destination: paymentDestination,
      memo: paymentMemo.trim(),
      created_by: workspace.profile.id,
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setPaymentAmount("");
    setPaymentMemo("");
    setMessage("Payment recorded and invoice balance recalculated.");
    await loadData();
  }

  async function createRetainer(event: FormEvent) {
    event.preventDefault();
    const matter = matterById.get(retainerCaseId);
    if (!matter || !workspace) return setMessage("Choose a matter first.");
    if (activeRetainerForSelectedMatter) {
      return setMessage(
        `This matter already has a ${activeRetainerForSelectedMatter.status} retainer. Use the existing retainer below instead of creating a duplicate.`
      );
    }
    if (!retainerText.trim()) return setMessage("Agreement text is required.");

    setBusy(true);
    const { error } = await supabase.from("retainer_signature_requests").insert({
      organization_id: matter.organization_id,
      case_id: matter.id,
      title: retainerTitle.trim() || "Retainer Agreement",
      agreement_text: retainerText.trim(),
      client_email: retainerEmail.trim() || matter.client_email,
      expires_at: retainerExpires ? new Date(`${retainerExpires}T23:59:59`).toISOString() : null,
      created_by: workspace.profile.id,
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setRetainerText("");
    setMessage("Retainer draft created with a SHA-256 document fingerprint.");
    await loadData();
  }

  function beginRetainerDraftEdit() {
    if (!activeRetainerForSelectedMatter || activeRetainerForSelectedMatter.status !== "draft") return;
    setRetainerTitle(activeRetainerForSelectedMatter.title);
    setRetainerEmail(activeRetainerForSelectedMatter.client_email ?? "");
    setRetainerExpires(activeRetainerForSelectedMatter.expires_at?.slice(0, 10) ?? "");
    setRetainerText(activeRetainerForSelectedMatter.agreement_text);
    setEditingRetainerDraft(true);
    setMessage("");
  }

  async function updateRetainerDraft(event: FormEvent) {
    event.preventDefault();
    const retainer = activeRetainerForSelectedMatter;
    if (!retainer || retainer.status !== "draft") return;
    if (!retainerText.trim()) return setMessage("Agreement text is required.");

    setBusy(true);
    setMessage("");
    const { error } = await supabase
      .from("retainer_signature_requests")
      .update({
        title: retainerTitle.trim() || "Retainer Agreement",
        client_email: retainerEmail.trim() || null,
        expires_at: retainerExpires ? new Date(`${retainerExpires}T23:59:59`).toISOString() : null,
        agreement_text: retainerText.trim(),
      })
      .eq("id", retainer.id)
      .eq("status", "draft");

    setBusy(false);
    if (error) return setMessage(error.message);

    setEditingRetainerDraft(false);
    setMessage("Retainer draft updated. The agreement fingerprint was recalculated.");
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
        setMessage(error?.message ?? "Unable to archive the signed agreement PDF.");
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

  async function updateRetainerStatus(id: string, status: "sent" | "voided") {
    setBusy(true);
    const { error } = await supabase.from("retainer_signature_requests").update({ status }).eq("id", id);
    setBusy(false);
    if (error) return setMessage(error.message);
    setMessage(status === "sent" ? "Retainer is now available in the client portal for signature." : "Retainer voided.");
    await loadData();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card overflow-hidden">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <p className="eyebrow">Billing & Retainers</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Move a matter from engagement to payment in one workspace.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Create invoices, expose the firm&apos;s secure hosted payment page, record payments, and send immutable retainer agreements for client signature.</p>
            </div>
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Payment handling</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">CivicFlow does not store card data. Firms can attach their own HTTPS payment page, including a legal-payment provider when trust funds are involved.</p>
            </div>
          </div>
        </section>

        {message ? <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{message}</div> : null}

        {requestedMatterId && matterById.get(requestedMatterId) ? (
          <section className="rounded-2xl border border-blue-200 bg-blue-50/70 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Matter context</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {matterById.get(requestedMatterId)?.case_number} · {matterById.get(requestedMatterId)?.client_first_name} {matterById.get(requestedMatterId)?.client_last_name}
                </p>
              </div>
              <Link href={`/app/cases/${encodeURIComponent(matterById.get(requestedMatterId)?.case_number ?? "")}`} className="btn btn-secondary">
                Back to matter
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="premium-card !p-5"><p className="eyebrow">Outstanding</p><p className="mt-3 text-2xl font-bold text-slate-950">{money(outstanding)}</p></div>
          <div className="premium-card !p-5"><p className="eyebrow">Collected</p><p className="mt-3 text-2xl font-bold text-emerald-700">{money(collected)}</p></div>
          <div className="premium-card !p-5"><p className="eyebrow">Open invoices</p><p className="mt-3 text-2xl font-bold text-slate-950">{payableInvoices.length}</p><p className="mt-2 text-xs text-slate-500">{overdueInvoices.length ? `${overdueInvoices.length} overdue` : "None overdue"}</p></div>
          <div className="premium-card !p-5"><p className="eyebrow">Awaiting signature</p><p className="mt-3 text-2xl font-bold text-slate-950">{awaitingSignature}</p></div>
        </section>

        {loading ? <section className="premium-card text-center"><div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" /><p className="mt-4 text-sm text-slate-500">Loading commercial workflow...</p></section> : null}

        {!loading && matters.length === 0 ? (
          <section className="premium-card"><p className="eyebrow">No matters yet</p><h2 className="mt-3 text-xl font-bold text-slate-950">Billing starts from a matter.</h2><p className="mt-3 text-sm leading-7 text-slate-600">Create or receive a client matter first, then return here to invoice and send a retainer.</p><Link href="/intake" className="btn btn-primary mt-5">Open client intake</Link></section>
        ) : null}

        {!loading && matters.length > 0 ? (
          <>
            <section className="grid gap-6 2xl:grid-cols-2">
              <form
                id="new-invoice"
                onSubmit={editingInvoiceDraft ? updateInvoiceDraft : createInvoice}
                className="premium-card scroll-mt-8 space-y-5"
              >
                <div><p className="eyebrow">New Invoice</p><h2 className="mt-3 text-xl font-bold text-slate-950">Create a matter-linked invoice</h2></div>
                <label className="input-label">
                  Matter
                  <select
                    className="input-field"
                    value={invoiceCaseId}
                    onChange={(e) => {
                      setInvoiceCaseId(e.target.value);
                      setEditingInvoiceDraft(false);
                    }}
                  >
                    {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.case_number} · {matter.client_first_name} {matter.client_last_name}</option>)}
                  </select>
                </label>

                <div className={draftInvoiceForSelectedMatter ? "workflow-locked rounded-2xl border p-4 space-y-5" : "space-y-5"}>
                  {draftInvoiceForSelectedMatter ? (
                    <div className="flex flex-col gap-3 border-b border-slate-300/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {draftInvoiceForSelectedMatter.invoice_number} is already saved as a draft.
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          The saved values stay visible and locked. Edit the draft intentionally or send it from the billing ledger below.
                        </p>
                      </div>
                      <a href="#invoice-ledger" className="btn btn-secondary">View draft invoice</a>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="input-label sm:col-span-2">Line item<input className="input-field" value={invoiceFormDescription} onChange={(e) => setInvoiceDescription(e.target.value)} disabled={busy || invoiceFieldsLocked} required /></label>
                    <label className="input-label">Quantity<input className="input-field" type="number" min="0.01" step="0.01" value={invoiceFormQuantity} onChange={(e) => setInvoiceQuantity(e.target.value)} disabled={busy || invoiceFieldsLocked} required /></label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="input-label">Rate / amount<input className="input-field" type="text" inputMode="decimal" placeholder="$750.00" value={invoiceFormRate} onChange={(e) => setInvoiceRate(formatCurrencyInput(e.target.value))} disabled={busy || invoiceFieldsLocked} required /></label>
                    <label className="input-label">Due date<input className="input-field" type="date" value={invoiceFormDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} disabled={busy || invoiceFieldsLocked} /></label>
                  </div>
                  <label className="input-label">Secure payment page<input className="input-field" type="url" placeholder="https://..." value={invoiceFormPaymentUrl} onChange={(e) => setInvoicePaymentUrl(e.target.value)} disabled={busy || invoiceFieldsLocked} /><span className="mt-1 text-xs font-normal text-slate-400">Optional. Use the firm&apos;s own hosted LawPay, Stripe, or other HTTPS payment page.</span></label>
                  <label className="input-label">Payment instructions<textarea className="input-field min-h-24" value={invoiceFormPaymentInstructions} onChange={(e) => setInvoicePaymentInstructions(e.target.value)} placeholder="Optional instructions visible to the client." disabled={busy || invoiceFieldsLocked} /></label>
                  <label className="input-label">Invoice note<textarea className="input-field min-h-24" value={invoiceFormNotes} onChange={(e) => setInvoiceNotes(e.target.value)} disabled={busy || invoiceFieldsLocked} /></label>

                  {!draftInvoiceForSelectedMatter ? (
                    <button disabled={busy} className="btn btn-primary" type="submit">{busy ? "Working..." : "Create draft invoice"}</button>
                  ) : editingInvoiceDraft ? (
                    <button disabled={busy} className="btn btn-primary" type="submit">{busy ? "Saving..." : "Save draft changes"}</button>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={beginInvoiceDraftEdit}>Edit draft</button>
                  )}
                </div>
              </form>

              <form
                id="new-retainer"
                onSubmit={activeRetainerForSelectedMatter?.status === "draft" ? updateRetainerDraft : createRetainer}
                className="premium-card scroll-mt-8 space-y-5"
              >
                <div><p className="eyebrow">Retainer eSignature</p><h2 className="mt-3 text-xl font-bold text-slate-950">Prepare an agreement for secure client signing</h2></div>
                <label className="input-label">Matter<select className="input-field" value={retainerCaseId} onChange={(e) => { const id=e.target.value; setRetainerCaseId(id); setRetainerEmail(matterById.get(id)?.client_email ?? ""); setEditingRetainerDraft(false); }}>{matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.case_number} · {matter.client_first_name} {matter.client_last_name}</option>)}</select></label>

                <div className={activeRetainerForSelectedMatter ? "workflow-locked rounded-2xl border p-4 space-y-5" : "space-y-5"}>
                  {activeRetainerForSelectedMatter ? (
                    <div className="flex flex-col gap-3 border-b border-slate-300/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">This retainer workflow is already on record.</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Status: {activeRetainerForSelectedMatter.status.replaceAll("_", " ")}. Completed values stay visible and locked instead of returning to an empty form.
                        </p>
                      </div>
                      <a href="#retainer-queue" className="btn btn-secondary">View existing retainer</a>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="input-label">Agreement title<input className="input-field" value={retainerFormTitle} onChange={(e) => setRetainerTitle(e.target.value)} disabled={busy || retainerFieldsLocked} required /></label>
                    <label className="input-label">Client email<input className="input-field" type="email" value={retainerFormEmail} onChange={(e) => setRetainerEmail(e.target.value)} disabled={busy || retainerFieldsLocked} /></label>
                  </div>
                  <label className="input-label">Signature deadline<input className="input-field" type="date" value={retainerFormExpires} onChange={(e) => setRetainerExpires(e.target.value)} disabled={busy || retainerFieldsLocked} /></label>
                  <label className="input-label">Agreement text<textarea className="input-field min-h-64 font-mono text-xs leading-6" value={retainerFormText} onChange={(e) => setRetainerText(e.target.value)} placeholder="Paste or draft the retainer agreement here..." disabled={busy || retainerFieldsLocked} required /></label>
                  <p className="workflow-lock-note text-xs leading-5 text-slate-500">Once sent, the agreement text is locked. CivicFlow fingerprints the exact text with SHA-256 and records the signing event, signer, consent, and timestamp.</p>

                  {!activeRetainerForSelectedMatter ? (
                    <button disabled={busy} className="btn btn-primary" type="submit">{retainerCreateLabel}</button>
                  ) : activeRetainerForSelectedMatter.status === "draft" ? (
                    <button
                      disabled={busy}
                      className="btn btn-primary"
                      type={editingRetainerDraft ? "submit" : "button"}
                      onClick={editingRetainerDraft ? undefined : beginRetainerDraftEdit}
                    >
                      {busy ? "Working..." : retainerCreateLabel}
                    </button>
                  ) : (
                    <button disabled className="btn btn-primary" type="button">{retainerCreateLabel}</button>
                  )}
                </div>
              </form>
            </section>

            <section className="grid gap-6 2xl:grid-cols-2">
              <form onSubmit={addLineItem} className={`premium-card space-y-4 ${draftInvoiceForSelectedMatter && !editingInvoiceDraft ? "workflow-locked" : ""}`}>
                <div><p className="eyebrow">Draft invoice</p><h2 className="mt-3 text-xl font-bold text-slate-950">Add another line item</h2></div>
                <label className="input-label">Invoice<select className="input-field" value={itemInvoiceId} onChange={(e) => setItemInvoiceId(e.target.value)} disabled={!editingInvoiceDraft}><option value="">Select draft invoice</option>{draftInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · {matterById.get(invoice.case_id)?.case_number}</option>)}</select></label>
                <div className="grid gap-4 sm:grid-cols-3"><label className="input-label sm:col-span-2">Description<input className="input-field" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} disabled={!editingInvoiceDraft} /></label><label className="input-label">Qty<input className="input-field" type="number" min="0.01" step="0.01" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} disabled={!editingInvoiceDraft} /></label></div>
                <label className="input-label">Rate / amount<input className="input-field" type="text" inputMode="decimal" placeholder="$750.00" value={itemRate} onChange={(e) => setItemRate(formatCurrencyInput(e.target.value))} disabled={!editingInvoiceDraft} /></label>
                <button disabled={busy || !itemInvoiceId || !editingInvoiceDraft} className="btn btn-secondary" type="submit">{editingInvoiceDraft ? "Add line item" : "Edit draft to add line items"}</button>
              </form>

              <form onSubmit={recordPayment} className="premium-card space-y-4">
                <div><p className="eyebrow">Payment record</p><h2 className="mt-3 text-xl font-bold text-slate-950">Record funds received</h2></div>
                <label className="input-label">Invoice<select className="input-field" value={paymentInvoiceId} onChange={(e) => setPaymentInvoiceId(e.target.value)}><option value="">Select outstanding invoice</option>{payableInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · balance {money(invoice.balance_cents)}</option>)}</select></label>
                <div className="grid gap-4 sm:grid-cols-3"><label className="input-label">Amount<input className="input-field" type="text" inputMode="decimal" placeholder="$0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(formatCurrencyInput(e.target.value))} /></label><label className="input-label">Method<select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="manual">Manual</option><option value="card">Card</option><option value="ach">ACH</option><option value="check">Check</option><option value="cash">Cash</option><option value="other">Other</option></select></label><label className="input-label">Destination<select className="input-field" value={paymentDestination} onChange={(e) => setPaymentDestination(e.target.value)}><option value="operating">Operating</option><option value="trust">Trust / IOLTA record</option></select></label></div>
                <label className="input-label">Memo<input className="input-field" value={paymentMemo} onChange={(e) => setPaymentMemo(e.target.value)} /></label>
                <p className="text-xs leading-5 text-amber-700">Selecting Trust / IOLTA records where funds went. CivicFlow does not initiate or certify a trust-account transfer.</p>
                <button disabled={busy || !paymentInvoiceId} className="btn btn-secondary" type="submit">Record payment</button>
              </form>
            </section>

            <section id="invoice-ledger" className="premium-card scroll-mt-8">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Invoices</p><h2 className="mt-3 text-xl font-bold text-slate-950">Firm billing ledger</h2></div><p className="text-sm text-slate-500">{invoices.length} invoice{invoices.length === 1 ? "" : "s"}</p></div>
              <div className="mt-6 space-y-4">
                {invoices.length === 0 ? <p className="text-sm text-slate-500">No invoices yet.</p> : invoices.map((invoice) => {
                  const matter = matterById.get(invoice.case_id);
                  return <div key={invoice.id} className={`rounded-2xl border border-slate-200 p-5 ${invoice.status === "draft" ? "" : "workflow-complete-record"}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-950">{invoice.invoice_number}</span><span className={`chip border ${badge(invoice.status)}`}>{invoice.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm text-slate-600">{matter?.case_number} · {matter?.client_first_name} {matter?.client_last_name}</p><p className="mt-1 text-xs text-slate-400">Issued {shortDate(invoice.issue_date)} · Due {shortDate(invoice.due_date)}</p></div><div className="grid grid-cols-3 gap-4 text-right"><div><p className="text-xs text-slate-400">Total</p><p className="mt-1 font-bold text-slate-950">{money(invoice.subtotal_cents)}</p></div><div><p className="text-xs text-slate-400">Paid</p><p className="mt-1 font-bold text-emerald-700">{money(invoice.amount_paid_cents)}</p></div><div><p className="text-xs text-slate-400">Balance</p><p className="mt-1 font-bold text-slate-950">{money(invoice.balance_cents)}</p></div></div></div>
                    <div className="mt-4 space-y-2">{(itemsByInvoice.get(invoice.id) ?? []).map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"><span>{item.description} · {Number(item.quantity)} × {money(item.unit_amount_cents)}</span><strong>{money(item.amount_cents)}</strong></div>)}</div>
                    {(paymentsByInvoice.get(invoice.id) ?? []).length > 0 ? <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Payment history</p>{(paymentsByInvoice.get(invoice.id) ?? []).map((payment) => <p key={payment.id} className="mt-2 text-sm text-slate-600">{shortDate(payment.received_at)} · {money(payment.amount_cents)} · {payment.payment_method} · {payment.funds_destination} · {payment.status}</p>)}</div> : null}
                    <div className="mt-5 flex flex-wrap gap-2">{invoice.status === "draft" ? <button disabled={busy} onClick={() => updateInvoiceStatus(invoice.id, "sent")} className="btn btn-primary" type="button">Send to client</button> : null}{invoice.status !== "paid" && invoice.status !== "void" ? <button disabled={busy} onClick={() => updateInvoiceStatus(invoice.id, "void")} className="btn btn-secondary" type="button">Void invoice</button> : null}<Link href={`/app/cases/${encodeURIComponent(matter?.case_number ?? "")}`} className="btn btn-secondary">Open matter</Link>{invoice.external_payment_url ? <a href={invoice.external_payment_url} target="_blank" rel="noreferrer" className="btn btn-secondary">Open payment page</a> : null}</div>
                  </div>;
                })}
              </div>
            </section>

            <section id="retainer-queue" className="premium-card scroll-mt-8">
              <div className="border-b border-slate-100 pb-5"><p className="eyebrow">Retainers</p><h2 className="mt-3 text-xl font-bold text-slate-950">Signature queue</h2></div>
              <div className="mt-6 space-y-4">{retainers.length === 0 ? <p className="text-sm text-slate-500">No retainers yet.</p> : retainers.map((retainer) => { const matter=matterById.get(retainer.case_id); return <div key={retainer.id} className={`rounded-2xl border border-slate-200 p-5 ${retainer.status === "draft" ? "" : "workflow-complete-record"}`}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-950">{retainer.title}</span><span className={`chip border ${badge(retainer.status)}`}>{retainer.status}</span></div><p className="mt-2 text-sm text-slate-600">{matter?.case_number} · {matter?.client_first_name} {matter?.client_last_name}</p><p className="mt-1 text-xs text-slate-400">SHA-256 {retainer.agreement_sha256.slice(0, 18)}...</p></div><div className="text-sm text-slate-500">{retainer.signed_at ? <>Signed {shortDate(retainer.signed_at)} by <strong className="text-slate-800">{retainer.signer_name}</strong></> : retainer.sent_at ? <>Sent {shortDate(retainer.sent_at)}</> : <>Draft created {shortDate(retainer.created_at)}</>}</div></div><details className="mt-4 rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-700">View agreement text</summary><pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-600">{retainer.agreement_text}</pre></details><div className="mt-5 flex flex-wrap gap-2">{retainer.status === "draft" ? <button disabled={busy} onClick={() => updateRetainerStatus(retainer.id, "sent")} className="btn btn-primary" type="button">Send for signature</button> : null}{retainer.status === "draft" || retainer.status === "sent" ? <button disabled={busy} onClick={() => updateRetainerStatus(retainer.id, "voided")} className="btn btn-secondary" type="button">Void</button> : null}{retainer.status === "signed" ? <button disabled={archiveBusyId === retainer.id} onClick={() => openSignedRetainerPdf(retainer)} className="btn btn-primary" type="button">{archiveBusyId === retainer.id ? "Preparing PDF..." : retainer.signed_pdf_path ? "Download signed PDF" : "Archive signed PDF"}</button> : null}<Link href={`/app/cases/${encodeURIComponent(matter?.case_number ?? "")}`} className="btn btn-secondary">Open matter</Link></div>{retainer.signed_pdf_created_at ? <p className="mt-3 text-xs text-slate-400">Signed PDF archived {shortDate(retainer.signed_pdf_created_at)} in private case documents.</p> : null}</div>; })}</div>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}