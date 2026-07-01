"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

type CaseStatus =
  | "New Intake"
  | "In Review"
  | "Assigned"
  | "Waiting on Client"
  | "Completed";

type DocumentStatus = "Received" | "Missing" | "Needs Review";

type DecisionOutcome = "Approved" | "Denied" | "Referred" | "Withdrawn";

type DocumentItem = {
  id: string;
  name: string;
  description: string;
  status: DocumentStatus;
  fileName?: string;
};

type ActivityItem = {
  title: string;
  detail: string;
  time: string;
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

const initialDocuments: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Photo identification",
    description: "Government-issued ID or equivalent verification document.",
    status: "Received",
    fileName: "photo-id.pdf",
  },
  {
    id: "doc-2",
    name: "Proof of address",
    description: "Utility bill, lease, official mail, or another address record.",
    status: "Received",
    fileName: "proof-of-address.pdf",
  },
  {
    id: "doc-3",
    name: "Program eligibility form",
    description: "Signed client intake or eligibility questionnaire.",
    status: "Missing",
  },
  {
    id: "doc-4",
    name: "Supporting records",
    description: "Additional records requested by the assigned staff member.",
    status: "Missing",
  },
];

const initialActivityFeed: ActivityItem[] = [
  {
    title: "Case created",
    detail: "Public intake submission created case CF-1001.",
    time: "Today · 9:12 AM",
  },
  {
    title: "Initial document review",
    detail: "Two documents were marked ready for staff review.",
    time: "Today · 9:26 AM",
  },
  {
    title: "Routed to review team",
    detail: "Case moved into the Eligibility Review queue.",
    time: "Today · 10:04 AM",
  },
];

const summaryCards = [
  {
    label: "Client",
    value: "Angela Brooks",
    detail: "angela.brooks@example.org",
  },
  {
    label: "Service Type",
    value: "Eligibility Review",
    detail: "Document verification",
  },
  {
    label: "Priority",
    value: "Medium",
    detail: "Response target: 3 business days",
  },
  {
    label: "Created",
    value: "Jun 30, 2026",
    detail: "Public intake submission",
  },
];

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function savedButtonClass(isSaved: boolean) {
  return isSaved
    ? "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-300 px-5 text-sm font-black text-slate-600 shadow-none"
    : "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800";
}

export default function CaseDetailPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<CaseStatus>("In Review");
  const [assignedTo, setAssignedTo] = useState("Maya Johnson");
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [activityFeed, setActivityFeed] =
    useState<ActivityItem[]>(initialActivityFeed);

  const [internalNote, setInternalNote] = useState(
    "Client appears eligible for initial review. Missing signed eligibility form before final decision."
  );

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
    missingDocuments === 0 && documentsNeedingReview === 0;

  const completionPercent = Math.round(
    (completedDocuments / documents.length) * 100
  );

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId),
    [documents, selectedDocumentId]
  );

  function addActivity(title: string, detail: string) {
    setActivityFeed((currentActivity) => [
      {
        title,
        detail,
        time: "Just now",
      },
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

  function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFileName) {
      setUploadError("Please select a file from your computer first.");
      return;
    }

    const newDocument: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: documentName.trim(),
      description: documentDescription.trim(),
      status: "Needs Review",
      fileName: selectedFileName,
    };

    setDocuments((currentDocuments) => [newDocument, ...currentDocuments]);

    addActivity(
      "Document uploaded",
      `${selectedFileName} was attached as ${newDocument.name} and marked for staff review.`
    );

    setCaseSaved(false);
    setWorkflowSaved(false);
    setCaseCompleted(false);
    setUploadModalOpen(false);
    resetUploadForm();
    setCaseMessage("Document selected and added to case activity.");
  }

  function updateDocumentStatus(nextStatus: DocumentStatus) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === selectedDocument.id
          ? { ...document, status: nextStatus }
          : document
      )
    );

    addActivity(
      "Document status updated",
      `${selectedDocument.name} was marked as ${nextStatus}. ${reviewNote}`
    );

    setSelectedDocumentId("");
    setReviewNote("Document reviewed by staff and updated in the case checklist.");
    setCaseSaved(false);
    setCaseCompleted(false);
    setCaseMessage(`${selectedDocument.name} marked as ${nextStatus}.`);
  }

  function handleCaseSave() {
    setCaseSaved(true);
    setCaseMessage("Case saved successfully.");
    addActivity(
      "Case saved",
      `Case CF-1001 was saved by ${assignedTo}.`
    );
  }

  function handleWorkflowSave() {
    setWorkflowSaved(true);
    setWorkflowMessage("Workflow status and assignment saved.");
    addActivity(
      "Workflow updated",
      `Case status is now ${status}. Assigned owner is ${assignedTo}.`
    );
  }

  function handleNoteSave() {
    setNoteSaved(true);
    setNoteMessage("Internal staff note saved.");
    addActivity("Staff note saved", "Internal note was updated by staff.");
  }

  function handleCompleteCase() {
    if (!caseReadyForDecision) {
      setDecisionMessage(
        "Complete all document review items before closing the case."
      );
      return;
    }

    setStatus("Completed");
    setCaseCompleted(true);
    setWorkflowSaved(false);
    setCaseSaved(false);

    setDecisionMessage(`Case completed with outcome: ${decisionOutcome}.`);

    addActivity(
      "Case completed",
      `Final outcome: ${decisionOutcome}. ${decisionNote}`
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
                Case CF-1001
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                A staff-ready case workspace for managing client information,
                assignment, document requirements, notes, status movement, and
                case history.
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
                className={caseSaved ? savedButtonClass(true) : savedButtonClass(false)}
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
                    keep the service workflow organized.
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
                    Click any document to review it and update its status.
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
                {documents.map((document) => (
                  <button
                    type="button"
                    key={document.id}
                    onClick={() => setSelectedDocumentId(document.id)}
                    className="flex w-full items-start gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                        document.status === "Received"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : document.status === "Needs Review"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-white text-transparent"
                      }`}
                    >
                      {document.status === "Needs Review" ? "!" : "✓"}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="block text-base font-black text-slate-950">
                          {document.name}
                        </span>

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${documentStatusStyles[document.status]}`}
                        >
                          {document.status}
                        </span>
                      </span>

                      <span className="mt-2 block text-sm leading-6 text-slate-500">
                        {document.description}
                      </span>

                      {document.fileName ? (
                        <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          Attached file: {document.fileName}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
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
                {activityFeed.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-slate-950" />

                    <p className="text-sm font-black text-slate-950">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.detail}
                    </p>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      {item.time}
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
                    Select a file from your computer, classify it, and add it to
                    the case checklist.
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
                    Choose a PDF, image, Word document, or spreadsheet from your
                    device.
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
                    Review the attached document, update the status, and record
                    the action in the case timeline.
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
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${documentStatusStyles[selectedDocument.status]}`}
                    >
                      {selectedDocument.status}
                    </span>
                  </div>

                  {selectedDocument.fileName ? (
                    <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700">
                      Attached file: {selectedDocument.fileName}
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