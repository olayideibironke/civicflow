"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type CaseStatus =
  | "New Intake"
  | "In Review"
  | "Assigned"
  | "Waiting on Client"
  | "Completed";

type DocumentStatus = "Received" | "Missing" | "Needs Review";

type DecisionOutcome = "Approved" | "Denied" | "Referred" | "Withdrawn";

type CivicCase = {
  id: string;
  organization_id: string;
  case_number: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string | null;
  client_phone: string | null;
  service_category: string;
  priority: string;
  status: string;
  assigned_to: string;
  summary: string | null;
  source: string;
  decision_outcome: string | null;
  decision_note: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CaseDocument = {
  id: string;
  case_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
};

type CaseActivity = {
  id: string;
  case_id: string;
  organization_id: string;
  title: string;
  detail: string;
  created_by: string | null;
  created_at: string;
};

const statusOptions: CaseStatus[] = [
  "New Intake",
  "In Review",
  "Assigned",
  "Waiting on Client",
  "Completed",
];

const decisionOptions: DecisionOutcome[] = [
  "Approved",
  "Denied",
  "Referred",
  "Withdrawn",
];

const statusStyles: Record<CaseStatus, string> = {
  "New Intake": "border-blue-200 bg-blue-50 text-blue-700",
  "In Review": "border-amber-200 bg-amber-50 text-amber-700",
  Assigned: "border-purple-200 bg-purple-50 text-purple-700",
  "Waiting on Client": "border-orange-200 bg-orange-50 text-orange-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const documentStatusStyles: Record<DocumentStatus, string> = {
  Received: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Missing: "border-slate-200 bg-white text-slate-400",
  "Needs Review": "border-amber-200 bg-amber-50 text-amber-700",
};

function savedButtonClass(isSaved: boolean) {
  return isSaved
    ? "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-300 px-5 text-sm font-black text-slate-600 shadow-none"
    : "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800";
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeCaseStatus(value: string): CaseStatus {
  if (statusOptions.includes(value as CaseStatus)) {
    return value as CaseStatus;
  }

  return "New Intake";
}

function normalizeDocumentStatus(value: string): DocumentStatus {
  if (value === "Received" || value === "Missing" || value === "Needs Review") {
    return value;
  }

  return "Missing";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatActivityTime(value: string) {
  const createdAt = new Date(value);
  const now = new Date();
  const differenceInMinutes = Math.floor(
    (now.getTime() - createdAt.getTime()) / 60000
  );

  if (differenceInMinutes < 2) {
    return "Just now";
  }

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} minutes ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(createdAt);
}

export default function CaseDetailPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [caseRecord, setCaseRecord] = useState<CivicCase | null>(null);
  const [status, setStatus] = useState<CaseStatus>("In Review");
  const [assignedTo, setAssignedTo] = useState("Maya Johnson");
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [activityFeed, setActivityFeed] = useState<CaseActivity[]>([]);

  const [internalNote, setInternalNote] = useState("");
  const [caseSaved, setCaseSaved] = useState(false);
  const [workflowSaved, setWorkflowSaved] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [caseCompleted, setCaseCompleted] = useState(false);

  const [caseMessage, setCaseMessage] = useState("");
  const [workflowMessage, setWorkflowMessage] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [reviewNote, setReviewNote] = useState(
    "Document reviewed by staff and updated in the case checklist."
  );

  const [documentName, setDocumentName] = useState("Program eligibility form");
  const [documentDescription, setDocumentDescription] = useState(
    "Signed client eligibility form uploaded by staff."
  );
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileSize, setSelectedFileSize] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [decisionOutcome, setDecisionOutcome] =
    useState<DecisionOutcome>("Approved");
  const [decisionNote, setDecisionNote] = useState(
    "All required documents have been reviewed. Case is ready for final decision."
  );

  const completedDocuments = useMemo(
    () => documents.filter((document) => document.status === "Received").length,
    [documents]
  );

  const documentsNeedingReview = useMemo(
    () =>
      documents.filter((document) => document.status === "Needs Review").length,
    [documents]
  );

  const missingDocuments = documents.length - completedDocuments;
  const caseReadyForDecision =
    documents.length > 0 &&
    missingDocuments === 0 &&
    documentsNeedingReview === 0;

  const completionPercent =
    documents.length === 0
      ? 0
      : Math.round((completedDocuments / documents.length) * 100);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId),
    [documents, selectedDocumentId]
  );

  const summaryCards = useMemo(() => {
    if (!caseRecord) {
      return [];
    }

    return [
      {
        label: "Client",
        value: `${caseRecord.client_first_name} ${caseRecord.client_last_name}`,
        detail: caseRecord.client_email ?? "No email on file",
      },
      {
        label: "Service Type",
        value: caseRecord.service_category,
        detail: "Document verification",
      },
      {
        label: "Priority",
        value: caseRecord.priority,
        detail: "Response target: 3 business days",
      },
      {
        label: "Created",
        value: formatDate(caseRecord.created_at),
        detail: caseRecord.source,
      },
    ];
  }, [caseRecord]);

  useEffect(() => {
    async function loadCaseData() {
      setLoading(true);
      setLoadError("");

      const { data: loadedCase, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("case_number", "CF-1001")
        .single();

      if (caseError || !loadedCase) {
        setLoadError(
          caseError?.message ?? "Unable to load case CF-1001 from Supabase."
        );
        setLoading(false);
        return;
      }

      const { data: loadedDocuments, error: documentsError } = await supabase
        .from("case_documents")
        .select("*")
        .eq("case_id", loadedCase.id)
        .order("created_at", { ascending: true });

      if (documentsError) {
        setLoadError(documentsError.message);
        setLoading(false);
        return;
      }

      const { data: loadedActivity, error: activityError } = await supabase
        .from("case_activity")
        .select("*")
        .eq("case_id", loadedCase.id)
        .order("created_at", { ascending: false });

      if (activityError) {
        setLoadError(activityError.message);
        setLoading(false);
        return;
      }

      const normalizedStatus = normalizeCaseStatus(loadedCase.status);

      setCaseRecord(loadedCase as CivicCase);
      setStatus(normalizedStatus);
      setAssignedTo(loadedCase.assigned_to);
      setInternalNote(loadedCase.summary ?? "");
      setDecisionOutcome(
        (loadedCase.decision_outcome as DecisionOutcome | null) ?? "Approved"
      );
      setDecisionNote(
        loadedCase.decision_note ??
          "All required documents have been reviewed. Case is ready for final decision."
      );
      setCaseCompleted(normalizedStatus === "Completed");
      setDocuments((loadedDocuments ?? []) as CaseDocument[]);
      setActivityFeed((loadedActivity ?? []) as CaseActivity[]);
      setLoading(false);
    }

    loadCaseData();
  }, []);

  async function addActivity(title: string, detail: string) {
    if (!caseRecord) {
      return;
    }

    const { data, error } = await supabase
      .from("case_activity")
      .insert({
        case_id: caseRecord.id,
        organization_id: caseRecord.organization_id,
        title,
        detail,
        created_by: "Demo Staff",
      })
      .select("*")
      .single();

    if (error) {
      setCaseMessage(error.message);
      return;
    }

    setActivityFeed((currentActivity) => [
      data as CaseActivity,
      ...currentActivity,
    ]);
  }

  function resetUploadForm() {
    setDocumentName("Program eligibility form");
    setDocumentDescription("Signed client eligibility form uploaded by staff.");
    setSelectedFileName("");
    setSelectedFileSize("");
    setUploadError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function closeUploadModal() {
    setUploadModalOpen(false);
    resetUploadForm();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName("");
      setSelectedFileSize("");
      return;
    }

    setSelectedFileName(file.name);
    setSelectedFileSize(formatFileSize(file.size));
    setUploadError("");
  }

  async function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!caseRecord) {
      setUploadError("Case data is not ready yet.");
      return;
    }

    if (!selectedFileName) {
      setUploadError("Please select a file from your computer first.");
      return;
    }

    const { data, error } = await supabase
      .from("case_documents")
      .insert({
        case_id: caseRecord.id,
        organization_id: caseRecord.organization_id,
        name: documentName.trim(),
        description: documentDescription.trim(),
        status: "Needs Review",
        file_name: selectedFileName,
      })
      .select("*")
      .single();

    if (error) {
      setUploadError(error.message);
      return;
    }

    const newDocument = data as CaseDocument;

    setDocuments((currentDocuments) => [...currentDocuments, newDocument]);

    await addActivity(
      "Document uploaded",
      `${selectedFileName} was attached as ${newDocument.name} and marked for staff review.`
    );

    setCaseSaved(false);
    setWorkflowSaved(false);
    setCaseCompleted(false);
    setUploadModalOpen(false);
    resetUploadForm();
    setCaseMessage("Document selected and added to Supabase case activity.");
  }

  async function updateDocumentStatus(nextStatus: DocumentStatus) {
    if (!selectedDocument) {
      return;
    }

    const { data, error } = await supabase
      .from("case_documents")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedDocument.id)
      .select("*")
      .single();

    if (error) {
      setCaseMessage(error.message);
      return;
    }

    const updatedDocument = data as CaseDocument;

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === updatedDocument.id ? updatedDocument : document
      )
    );

    await addActivity(
      "Document status updated",
      `${selectedDocument.name} was marked as ${nextStatus}. ${reviewNote}`
    );

    setSelectedDocumentId("");
    setReviewNote("Document reviewed by staff and updated in the case checklist.");
    setCaseSaved(false);
    setCaseCompleted(false);
    setCaseMessage(`${selectedDocument.name} marked as ${nextStatus}.`);
  }

  async function handleCaseSave() {
    if (!caseRecord) {
      return;
    }

    const { data, error } = await supabase
      .from("cases")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseRecord.id)
      .select("*")
      .single();

    if (error) {
      setCaseMessage(error.message);
      return;
    }

    setCaseRecord(data as CivicCase);
    setCaseSaved(true);
    setCaseMessage("Case saved successfully in Supabase.");

    await addActivity("Case saved", `Case ${caseRecord.case_number} was saved.`);
  }

  async function handleWorkflowSave() {
    if (!caseRecord) {
      return;
    }

    const { data, error } = await supabase
      .from("cases")
      .update({
        status,
        assigned_to: assignedTo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseRecord.id)
      .select("*")
      .single();

    if (error) {
      setWorkflowMessage(error.message);
      return;
    }

    setCaseRecord(data as CivicCase);
    setWorkflowSaved(true);
    setWorkflowMessage("Workflow status and assignment saved in Supabase.");

    await addActivity(
      "Workflow updated",
      `Case status is now ${status}. Assigned owner is ${assignedTo}.`
    );
  }

  async function handleNoteSave() {
    if (!caseRecord) {
      return;
    }

    const { error: noteError } = await supabase.from("case_notes").insert({
      case_id: caseRecord.id,
      organization_id: caseRecord.organization_id,
      note: internalNote,
      created_by: assignedTo,
    });

    if (noteError) {
      setNoteMessage(noteError.message);
      return;
    }

    const { data, error: caseError } = await supabase
      .from("cases")
      .update({
        summary: internalNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseRecord.id)
      .select("*")
      .single();

    if (caseError) {
      setNoteMessage(caseError.message);
      return;
    }

    setCaseRecord(data as CivicCase);
    setNoteSaved(true);
    setNoteMessage("Internal staff note saved in Supabase.");

    await addActivity("Staff note saved", "Internal note was updated by staff.");
  }

  async function handleCompleteCase() {
    if (!caseRecord) {
      return;
    }

    if (!caseReadyForDecision) {
      setDecisionMessage(
        "Complete all document review items before closing the case."
      );
      return;
    }

    const { data, error } = await supabase
      .from("cases")
      .update({
        status: "Completed",
        decision_outcome: decisionOutcome,
        decision_note: decisionNote,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseRecord.id)
      .select("*")
      .single();

    if (error) {
      setDecisionMessage(error.message);
      return;
    }

    setCaseRecord(data as CivicCase);
    setStatus("Completed");
    setCaseCompleted(true);
    setWorkflowSaved(false);
    setCaseSaved(false);
    setDecisionMessage(`Case completed with outcome: ${decisionOutcome}.`);

    await addActivity(
      "Case completed",
      `Final outcome: ${decisionOutcome}. ${decisionNote}`
    );
  }

  if (loading) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Loading Case
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Connecting to Supabase...
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            CivicFlow is loading the case record, documents, and activity
            timeline from the database.
          </p>
        </section>
      </AppShell>
    );
  }

  if (loadError || !caseRecord) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-500">
            Supabase Error
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Case could not be loaded.
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {loadError || "No case record was found."}
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="premium-card">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/app/cases"
                  className="text-sm font-black text-slate-500 transition hover:text-slate-950"
                >
                  ← Back to cases
                </Link>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Case {caseRecord.case_number}
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                This case workspace is now connected to Supabase for case data,
                document records, notes, workflow updates, and activity history.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex h-12 min-w-40 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Upload document
              </button>

              <button
                type="button"
                onClick={handleCaseSave}
                disabled={caseSaved}
                className={savedButtonClass(caseSaved)}
              >
                {caseSaved ? "Saved" : "Save case"}
              </button>
            </div>
          </div>

          {caseMessage ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
              {caseMessage}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                {card.label}
              </p>

              <p className="mt-4 text-2xl font-black leading-tight tracking-tight text-slate-950">
                {card.value}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {card.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-6">
            <div className="premium-card">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Workflow Control
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Status and assignment
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Move the case through review, assign staff ownership, and
                    save the workflow directly to Supabase.
                  </p>
                </div>

                <div className="soft-panel px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Current owner
                  </p>
                  <p className="mt-2 text-sm font-black leading-5 text-slate-900">
                    {assignedTo}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="input-label">
                  Case status
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as CaseStatus);
                      setWorkflowSaved(false);
                    }}
                    className="input-field"
                  >
                    {statusOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="input-label">
                  Assigned staff
                  <select
                    value={assignedTo}
                    onChange={(event) => {
                      setAssignedTo(event.target.value);
                      setWorkflowSaved(false);
                    }}
                    className="input-field"
                  >
                    <option>Maya Johnson</option>
                    <option>Daniel Reeves</option>
                    <option>Aisha Carter</option>
                    <option>Eligibility Review Team</option>
                  </select>
                </label>
              </div>

              {workflowMessage ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  {workflowMessage}
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleWorkflowSave}
                  disabled={workflowSaved}
                  className={savedButtonClass(workflowSaved)}
                >
                  {workflowSaved ? "Workflow saved" : "Save workflow"}
                </button>
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Documents
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Document checklist
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Click any document to review it and update its Supabase
                    status.
                  </p>
                </div>

                <div className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">
                  {completionPercent}% complete
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-950 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>

              <div className="mt-6 grid gap-3">
                {documents.map((document) => {
                  const documentStatus = normalizeDocumentStatus(document.status);

                  return (
                    <button
                      type="button"
                      key={document.id}
                      onClick={() => setSelectedDocumentId(document.id)}
                      className="flex w-full items-start gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span
                        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                          documentStatus === "Received"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : documentStatus === "Needs Review"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-white text-transparent"
                        }`}
                      >
                        {documentStatus === "Needs Review" ? "!" : "✓"}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="block text-base font-black text-slate-950">
                            {document.name}
                          </span>

                          <span
                            className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${documentStatusStyles[documentStatus]}`}
                          >
                            {documentStatus}
                          </span>
                        </span>

                        <span className="mt-2 block text-sm leading-6 text-slate-500">
                          {document.description}
                        </span>

                        {document.file_name ? (
                          <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            Attached file: {document.file_name}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Final Decision
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Close case workflow
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Complete the case after all required documents are received
                    and reviewed.
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-black ${
                    caseCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : caseReadyForDecision
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {caseCompleted
                    ? "Completed"
                    : caseReadyForDecision
                      ? "Ready"
                      : "Needs review"}
                </span>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="input-label">
                  Decision outcome
                  <select
                    value={decisionOutcome}
                    onChange={(event) => {
                      setDecisionOutcome(event.target.value as DecisionOutcome);
                      setCaseCompleted(false);
                    }}
                    className="input-field"
                  >
                    {decisionOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <div className="soft-panel px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Closure Status
                  </p>
                  <p className="mt-2 text-sm font-black leading-5 text-slate-900">
                    {caseCompleted
                      ? "Case closed"
                      : caseReadyForDecision
                        ? "All documents cleared"
                        : "Documents still pending"}
                  </p>
                </div>
              </div>

              <label className="input-label mt-6">
                Decision note
                <textarea
                  value={decisionNote}
                  onChange={(event) => {
                    setDecisionNote(event.target.value);
                    setCaseCompleted(false);
                  }}
                  rows={4}
                  className="input-field resize-y leading-7"
                />
              </label>

              {decisionMessage ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  {decisionMessage}
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleCompleteCase}
                  disabled={caseCompleted}
                  className={savedButtonClass(caseCompleted)}
                >
                  {caseCompleted ? "Case completed" : "Complete case"}
                </button>
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Internal Notes
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Staff note
              </h2>

              <textarea
                value={internalNote}
                onChange={(event) => {
                  setInternalNote(event.target.value);
                  setNoteSaved(false);
                }}
                rows={5}
                className="input-field mt-5 resize-y leading-7"
              />

              {noteMessage ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  {noteMessage}
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleNoteSave}
                  disabled={noteSaved}
                  className={savedButtonClass(noteSaved)}
                >
                  {noteSaved ? "Note saved" : "Save note"}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
                Case Health
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                {caseCompleted
                  ? "Case completed"
                  : caseReadyForDecision
                    ? "Ready for closure"
                    : "Ready for next review"}
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                This panel tracks the operational blockers preventing a case
                from final decision and closure.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    SLA Target
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    3 business days
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Missing Items
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {missingDocuments} documents
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Needs Review
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {documentsNeedingReview} documents
                  </p>
                </div>
              </div>
            </div>

            <div className="premium-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                Activity
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Timeline
              </h2>

              <div className="mt-6 space-y-5">
                {activityFeed.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-slate-950" />

                    <p className="text-sm font-black text-slate-950">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.detail}
                    </p>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      {formatActivityTime(item.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {uploadModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-5 py-8 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Document Upload
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Add document to case
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Select a file from your computer, classify it, and save the
                    document record to Supabase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-500 transition hover:bg-slate-50"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="mt-6 space-y-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                />

                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="text-base font-black text-slate-950">
                    File from computer
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This step saves file metadata now. Supabase Storage will
                    store the actual file contents in the next phase.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
                    >
                      Select file
                    </button>

                    {selectedFileName ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                        {selectedFileName} · {selectedFileSize}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
                        No file selected
                      </div>
                    )}
                  </div>

                  {uploadError ? (
                    <p className="mt-3 text-sm font-black text-rose-600">
                      {uploadError}
                    </p>
                  ) : null}
                </div>

                <label className="input-label">
                  Document name
                  <select
                    value={documentName}
                    onChange={(event) => setDocumentName(event.target.value)}
                    className="input-field"
                  >
                    <option>Program eligibility form</option>
                    <option>Supporting records</option>
                    <option>Photo identification</option>
                    <option>Proof of address</option>
                    <option>Referral letter</option>
                    <option>Client authorization form</option>
                  </select>
                </label>

                <label className="input-label">
                  Description
                  <textarea
                    value={documentDescription}
                    onChange={(event) =>
                      setDocumentDescription(event.target.value)
                    }
                    rows={4}
                    required
                    className="input-field resize-y leading-7"
                  />
                </label>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
                  >
                    Add document
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {selectedDocument ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-5 py-8 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                    Document Review
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {selectedDocument.name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Review the document record, update the status, and save the
                    activity to Supabase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDocumentId("")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-500 transition hover:bg-slate-50"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        Current status
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedDocument.description}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${
                        documentStatusStyles[
                          normalizeDocumentStatus(selectedDocument.status)
                        ]
                      }`}
                    >
                      {normalizeDocumentStatus(selectedDocument.status)}
                    </span>
                  </div>

                  {selectedDocument.file_name ? (
                    <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700">
                      Attached file: {selectedDocument.file_name}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
                      No file attached yet.
                    </div>
                  )}
                </div>

                <label className="input-label">
                  Review note
                  <textarea
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    rows={4}
                    className="input-field resize-y leading-7"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => updateDocumentStatus("Received")}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700"
                  >
                    Mark received
                  </button>

                  <button
                    type="button"
                    onClick={() => updateDocumentStatus("Needs Review")}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-amber-500 px-4 text-sm font-black text-white shadow-lg shadow-amber-500/15 transition hover:bg-amber-600"
                  >
                    Needs review
                  </button>

                  <button
                    type="button"
                    onClick={() => updateDocumentStatus("Missing")}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
                  >
                    Mark missing
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}