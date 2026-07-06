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
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import {
  getStaffDisplayName,
  loadStaffWorkspace,
  type StaffWorkspace,
} from "@/lib/workspace";

type CaseStatus =
  | "New Intake"
  | "In Review"
  | "Assigned"
  | "Waiting on Client"
  | "Completed";

type DocumentStatus = "Received" | "Missing" | "Needs Review";

type NoteType =
  | "General Update"
  | "Client Contact"
  | "Document Follow-up"
  | "Review Note"
  | "Decision Support";

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

type CaseNote = {
  id: string;
  case_id: string;
  organization_id: string;
  note: string | null;
  note_type: string | null;
  follow_up_required: boolean | null;
  follow_up_date: string | null;
  follow_up_completed: boolean | null;
  follow_up_completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
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

const noteTypeOptions: NoteType[] = [
  "General Update",
  "Client Contact",
  "Document Follow-up",
  "Review Note",
  "Decision Support",
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

function normalizeCaseNumber(value: string) {
  return value.trim().toUpperCase();
}

function normalizeStatus(value: string): CaseStatus {
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

function normalizeNoteType(value: string | null): NoteType {
  if (noteTypeOptions.includes(value as NoteType)) {
    return value as NoteType;
  }

  return "General Update";
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function isPastDue(dateValue: string | null) {
  if (!dateValue) {
    return false;
  }

  const today = getTodayDateInput();
  return dateValue < today;
}

function savedButtonClass(isSaved: boolean) {
  return isSaved ? "btn btn-primary" : "btn btn-primary";
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

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export default function DynamicCaseDetailPage() {
  const params = useParams();
  const routeCaseNumber = normalizeCaseNumber(String(params.caseNumber ?? ""));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [caseRecord, setCaseRecord] = useState<CivicCase | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [activityFeed, setActivityFeed] = useState<CaseActivity[]>([]);
  const [staffWorkspace, setStaffWorkspace] =
    useState<StaffWorkspace | null>(null);

  const [status, setStatus] = useState<CaseStatus>("New Intake");
  const [assignedTo, setAssignedTo] = useState("Unassigned");
  const [workflowSaved, setWorkflowSaved] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState("");

  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("General Update");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");
  const [noteMessageTone, setNoteMessageTone] = useState<"success" | "error">(
    "success"
  );

  const [decisionOutcome, setDecisionOutcome] = useState("Approved");
  const [decisionNote, setDecisionNote] = useState(
    "All required documents have been received and reviewed."
  );
  const [caseCompleted, setCaseCompleted] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState("new");
  const [uploadDocumentName, setUploadDocumentName] = useState(
    "Supporting records"
  );
  const [uploadDescription, setUploadDescription] = useState(
    "Document uploaded by staff for case review."
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileLabel, setSelectedFileLabel] = useState("No file selected");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

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
  const completionPercent =
    documents.length === 0
      ? 0
      : Math.round((completedDocuments / documents.length) * 100);

  const caseReadyForDecision =
    documents.length > 0 &&
    missingDocuments === 0 &&
    documentsNeedingReview === 0;

  const openFollowUps = useMemo(
    () =>
      notes.filter(
        (note) => note.follow_up_required && !note.follow_up_completed
      ),
    [notes]
  );

  const overdueFollowUps = useMemo(
    () => openFollowUps.filter((note) => isPastDue(note.follow_up_date)),
    [openFollowUps]
  );

  const staffDisplayName = useMemo(() => {
    if (staffWorkspace) {
      return getStaffDisplayName(staffWorkspace);
    }

    return assignedTo || "Staff User";
  }, [assignedTo, staffWorkspace]);

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
        detail: "Case workflow",
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
    async function loadStaffProfile() {
      const result = await loadStaffWorkspace();

      if (result.workspace) {
        setStaffWorkspace(result.workspace);
      }
    }

    loadStaffProfile();
  }, []);

  async function loadCaseData() {
    setLoading(true);
    setLoadError("");

    const { data: loadedCase, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("case_number", routeCaseNumber)
      .single();

    if (caseError || !loadedCase) {
      setLoadError(
        caseError?.message ?? `Unable to load case ${routeCaseNumber}.`
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

    const { data: loadedNotes, error: notesError } = await supabase
      .from("case_notes")
      .select("*")
      .eq("case_id", loadedCase.id)
      .order("created_at", { ascending: false });

    if (notesError) {
      setLoadError(notesError.message);
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

    const normalizedStatus = normalizeStatus(loadedCase.status);

    setCaseRecord(loadedCase as CivicCase);
    setDocuments((loadedDocuments ?? []) as CaseDocument[]);
    setNotes((loadedNotes ?? []) as CaseNote[]);
    setActivityFeed((loadedActivity ?? []) as CaseActivity[]);
    setStatus(normalizedStatus);
    setAssignedTo(loadedCase.assigned_to);
    setDecisionOutcome(loadedCase.decision_outcome ?? "Approved");
    setDecisionNote(
      loadedCase.decision_note ??
        "All required documents have been received and reviewed."
    );
    setCaseCompleted(normalizedStatus === "Completed");
    setLoading(false);
  }

  useEffect(() => {
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCaseNumber]);

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
        created_by: staffDisplayName,
      })
      .select("*")
      .single();

    if (error) {
      return;
    }

    setActivityFeed((currentActivity) => [
      data as CaseActivity,
      ...currentActivity,
    ]);
  }

  function resetUploadForm() {
    setUploadTargetId("new");
    setUploadDocumentName("Supporting records");
    setUploadDescription("Document uploaded by staff for case review.");
    setSelectedFile(null);
    setSelectedFileLabel("No file selected");
    setUploadMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetNoteForm() {
    setNewNote("");
    setNoteType("General Update");
    setFollowUpRequired(false);
    setFollowUpDate("");
  }

  function openUploadModal() {
    const firstIncompleteDocument =
      documents.find((document) => document.status !== "Received") ??
      documents[0];

    if (firstIncompleteDocument) {
      setUploadTargetId(firstIncompleteDocument.id);
      setUploadDocumentName(firstIncompleteDocument.name);
      setUploadDescription(
        firstIncompleteDocument.description ??
          "Document uploaded by staff for case review."
      );
    } else {
      resetUploadForm();
    }

    setUploadModalOpen(true);
  }

  function closeUploadModal() {
    setUploadModalOpen(false);
    resetUploadForm();
  }

  function handleUploadTargetChange(value: string) {
    setUploadTargetId(value);

    if (value === "new") {
      setUploadDocumentName("Supporting records");
      setUploadDescription("Document uploaded by staff for case review.");
      return;
    }

    const selectedDocument = documents.find((document) => document.id === value);

    if (selectedDocument) {
      setUploadDocumentName(selectedDocument.name);
      setUploadDescription(
        selectedDocument.description ??
          "Document uploaded by staff for case review."
      );
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setSelectedFileLabel("No file selected");
      return;
    }

    setSelectedFile(file);
    setSelectedFileLabel(`${file.name} · ${formatFileSize(file.size)}`);
    setUploadMessage("");
  }

  async function handleStorageUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!caseRecord) {
      setUploadMessage("Case data is not ready yet.");
      return;
    }

    if (!selectedFile) {
      setUploadMessage("Please select a file from your computer first.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    const safeFileName = sanitizeFileName(selectedFile.name);
    const filePath = `${caseRecord.organization_id}/${caseRecord.case_number}/${Date.now()}-${safeFileName}`;

    const { error: storageError } = await supabase.storage
      .from("case-documents")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        contentType: selectedFile.type || undefined,
        upsert: false,
      });

    if (storageError) {
      setUploading(false);
      setUploadMessage(storageError.message);
      return;
    }

    if (uploadTargetId === "new") {
      const { data, error } = await supabase
        .from("case_documents")
        .insert({
          case_id: caseRecord.id,
          organization_id: caseRecord.organization_id,
          name: uploadDocumentName.trim(),
          description: uploadDescription.trim(),
          status: "Needs Review",
          file_name: selectedFile.name,
          file_path: filePath,
        })
        .select("*")
        .single();

      if (error) {
        setUploading(false);
        setUploadMessage(error.message);
        return;
      }

      setDocuments((currentDocuments) => [
        ...currentDocuments,
        data as CaseDocument,
      ]);
    } else {
      const { data, error } = await supabase
        .from("case_documents")
        .update({
          description: uploadDescription.trim(),
          status: "Needs Review",
          file_name: selectedFile.name,
          file_path: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", uploadTargetId)
        .select("*")
        .single();

      if (error) {
        setUploading(false);
        setUploadMessage(error.message);
        return;
      }

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === uploadTargetId ? (data as CaseDocument) : document
        )
      );
    }

    await addActivity(
      "Document uploaded",
      `${selectedFile.name} was uploaded to Supabase Storage and marked for review.`
    );

    setCaseCompleted(false);
    setUploading(false);
    setUploadModalOpen(false);
    resetUploadForm();
  }

  async function handleDownloadDocument(document: CaseDocument) {
    if (!document.file_path) {
      setDownloadMessage("This document has no stored file attached yet.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("case-documents")
      .createSignedUrl(document.file_path, 60);

    if (error || !data?.signedUrl) {
      setDownloadMessage(error?.message ?? "Unable to create download link.");
      return;
    }

    setDownloadMessage("");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function updateDocumentStatus(
    document: CaseDocument,
    nextStatus: DocumentStatus
  ) {
    const { data, error } = await supabase
      .from("case_documents")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id)
      .select("*")
      .single();

    if (error) {
      setDecisionMessage(error.message);
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.map((currentDocument) =>
        currentDocument.id === document.id
          ? (data as CaseDocument)
          : currentDocument
      )
    );

    setCaseCompleted(false);

    await addActivity(
      "Document status updated",
      `${document.name} was marked as ${nextStatus}.`
    );
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
    setWorkflowMessage("Workflow saved in Supabase.");

    await addActivity(
      "Workflow updated",
      `Case status is now ${status}. Assigned owner is ${assignedTo}.`
    );
  }

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!caseRecord) {
      setNoteMessageTone("error");
      setNoteMessage("Case data is not ready yet.");
      return;
    }

    if (!newNote.trim()) {
      setNoteMessageTone("error");
      setNoteMessage("Internal note is required before saving.");
      return;
    }

    if (followUpRequired && !followUpDate) {
      setNoteMessageTone("error");
      setNoteMessage("Follow-up date is required when follow-up is selected.");
      return;
    }

    setSavingNote(true);
    setNoteMessage("");

    const { data, error } = await supabase
      .from("case_notes")
      .insert({
        case_id: caseRecord.id,
        organization_id: caseRecord.organization_id,
        note: newNote.trim(),
        note_type: noteType,
        follow_up_required: followUpRequired,
        follow_up_date: followUpRequired ? followUpDate : null,
        follow_up_completed: false,
        created_by: staffDisplayName,
      })
      .select("*")
      .single();

    if (error) {
      setSavingNote(false);
      setNoteMessageTone("error");
      setNoteMessage(error.message);
      return;
    }

    setNotes((currentNotes) => [data as CaseNote, ...currentNotes]);
    setSavingNote(false);
    setNoteMessageTone("success");
    setNoteMessage(
      followUpRequired
        ? "Internal note saved with follow-up tracking."
        : "Internal note saved."
    );

    await addActivity(
      followUpRequired ? "Follow-up note added" : "Internal note added",
      followUpRequired
        ? `${staffDisplayName} added a ${noteType.toLowerCase()} note with follow-up due ${formatDate(
            followUpDate
          )}.`
        : `${staffDisplayName} added a ${noteType.toLowerCase()} note.`
    );

    resetNoteForm();
  }

  async function handleToggleFollowUp(note: CaseNote) {
    const nextCompleted = !note.follow_up_completed;

    const { data, error } = await supabase
      .from("case_notes")
      .update({
        follow_up_completed: nextCompleted,
        follow_up_completed_at: nextCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", note.id)
      .select("*")
      .single();

    if (error) {
      setNoteMessageTone("error");
      setNoteMessage(error.message);
      return;
    }

    setNotes((currentNotes) =>
      currentNotes.map((currentNote) =>
        currentNote.id === note.id ? (data as CaseNote) : currentNote
      )
    );

    setNoteMessageTone("success");
    setNoteMessage(
      nextCompleted ? "Follow-up marked complete." : "Follow-up reopened."
    );

    await addActivity(
      nextCompleted ? "Follow-up completed" : "Follow-up reopened",
      nextCompleted
        ? `${staffDisplayName} completed a case follow-up.`
        : `${staffDisplayName} reopened a case follow-up.`
    );
  }

  async function handleCompleteCase() {
    if (!caseRecord) {
      return;
    }

    if (!caseReadyForDecision) {
      setDecisionMessage(
        "This case still has missing or review-needed documents."
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
          <p className="eyebrow">
            Loading Case
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Loading {routeCaseNumber}...
          </h1>
        </section>
      </AppShell>
    );
  }

  if (loadError || !caseRecord) {
    return (
      <AppShell>
        <section className="premium-card">
          <p className="eyebrow text-rose-500">
            Supabase Error
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Case could not be loaded.
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/app/cases"
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                  ← Back to cases
                </Link>

                <span
                  className={`chip ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Case {caseRecord.case_number}
              </h1>

              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                Manage workflow status, documents, internal notes, follow-ups,
                activity, and final case decision from one protected workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
              <button
                type="button"
                onClick={openUploadModal}
                className="btn btn-secondary"
              >
                Upload document
              </button>

              <Link
                href="/app/reports"
                className="btn btn-primary"
              >
                View reports
              </Link>
            </div>
          </div>

          {downloadMessage ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {downloadMessage}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="premium-card">
              <p className="eyebrow">
                {card.label}
              </p>
              <p className="mt-4 text-lg font-semibold leading-tight tracking-tight text-slate-900">
                {card.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {card.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <div className="premium-card">
              <p className="eyebrow">
                Workflow Control
              </p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                Status and assignment
              </h2>

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
                    <option>Unassigned</option>
                    <option>{staffDisplayName}</option>
                    <option>Maya Johnson</option>
                    <option>Daniel Reeves</option>
                    <option>Aisha Carter</option>
                    <option>Eligibility Review Team</option>
                  </select>
                </label>
              </div>

              {workflowMessage ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
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
                  <p className="eyebrow">
                    Internal Notes
                  </p>

                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                    Staff case notes
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Add audit-ready notes with note type, follow-up status, and
                    due dates for staff accountability.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="w-fit chip bg-slate-100 text-slate-600">
                    {notes.length} notes
                  </span>

                  <span
                    className={`w-fit chip ${
                      openFollowUps.length > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {openFollowUps.length} open follow-ups
                  </span>
                </div>
              </div>

              <form onSubmit={handleAddNote} noValidate className="mt-6">
                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="input-label">
                    Note type *
                    <select
                      required
                      value={noteType}
                      onChange={(event) =>
                        setNoteType(event.target.value as NoteType)
                      }
                      className="input-field"
                    >
                      {noteTypeOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="input-label">
                    Follow-up date
                    <input
                      type="date"
                      value={followUpDate}
                      disabled={!followUpRequired}
                      onChange={(event) => setFollowUpDate(event.target.value)}
                      className="input-field disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </label>
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={(event) => {
                      setFollowUpRequired(event.target.checked);
                      if (!event.target.checked) {
                        setFollowUpDate("");
                      }
                      setNoteMessage("");
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      Follow-up required
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Use this when staff must call, email, collect documents,
                      review records, or take another action later.
                    </span>
                  </span>
                </label>

                <label className="input-label mt-5">
                  New internal note *
                  <textarea
                    required
                    value={newNote}
                    onChange={(event) => {
                      setNewNote(event.target.value);
                      setNoteMessage("");
                    }}
                    rows={5}
                    placeholder="Add a clear staff note, client contact update, document follow-up, or review observation."
                    className="input-field resize-y leading-7"
                  />
                </label>

                {noteMessage ? (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                      noteMessageTone === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {noteMessage}
                  </div>
                ) : null}

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingNote}
                    className={savedButtonClass(savingNote)}
                  >
                    {savingNote ? "Saving note..." : "Save note"}
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {notes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="text-sm font-medium text-slate-500">
                      No internal notes have been added yet.
                    </p>
                  </div>
                ) : (
                  notes.map((note) => {
                    const normalizedType = normalizeNoteType(note.note_type);
                    const hasOpenFollowUp =
                      note.follow_up_required && !note.follow_up_completed;
                    const pastDue = hasOpenFollowUp && isPastDue(note.follow_up_date);

                    return (
                      <div
                        key={note.id}
                        className={`rounded-xl border p-5 ${
                          pastDue
                            ? "border-rose-200 bg-rose-50"
                            : hasOpenFollowUp
                              ? "border-amber-200 bg-amber-50"
                              : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="chip bg-slate-900 text-white">
                                {normalizedType}
                              </span>

                              {note.follow_up_required ? (
                                <span
                                  className={`chip ${
                                    note.follow_up_completed
                                      ? "bg-emerald-100 text-emerald-700"
                                      : pastDue
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {note.follow_up_completed
                                    ? "Follow-up completed"
                                    : pastDue
                                      ? "Follow-up overdue"
                                      : "Follow-up open"}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-3 text-sm font-semibold text-slate-900">
                              {note.created_by ?? "Staff User"}
                            </p>
                          </div>

                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {formatActivityTime(note.created_at)}
                          </p>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {note.note}
                        </p>

                        {note.follow_up_required ? (
                          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/70 bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Follow-up due
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatDate(note.follow_up_date)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleFollowUp(note)}
                              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                                note.follow_up_completed
                                  ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  : "bg-slate-950 text-white hover:bg-slate-800"
                              }`}
                            >
                              {note.follow_up_completed
                                ? "Reopen follow-up"
                                : "Mark complete"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="eyebrow">
                    Documents
                  </p>

                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                    Document checklist
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Upload real files, review documents, and download stored
                    files from Supabase Storage.
                  </p>
                </div>

                <div className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
                  {completionPercent}% complete
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>

              <div className="mt-6 grid gap-3">
                {documents.map((document) => {
                  const documentStatus = normalizeDocumentStatus(document.status);

                  return (
                    <div
                      key={document.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {document.name}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {document.description}
                          </p>

                          {document.file_name ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="chip bg-slate-100 text-slate-600">
                                File: {document.file_name}
                              </span>

                              {document.file_path ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadDocument(document)
                                  }
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  Download
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <span
                          className={`w-fit chip ${documentStatusStyles[documentStatus]}`}
                        >
                          {documentStatus}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateDocumentStatus(document, "Received")
                          }
                          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Mark received
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateDocumentStatus(document, "Needs Review")
                          }
                          className="rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                        >
                          Needs review
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateDocumentStatus(document, "Missing")
                          }
                          className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Mark missing
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="premium-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="eyebrow">
                    Final Decision
                  </p>

                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                    Close case workflow
                  </h2>
                </div>

                <span
                  className={`w-fit chip ${
                    caseCompleted || caseReadyForDecision
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
                      setDecisionOutcome(event.target.value);
                      setCaseCompleted(false);
                    }}
                    className="input-field"
                  >
                    <option>Approved</option>
                    <option>Denied</option>
                    <option>Referred</option>
                    <option>Withdrawn</option>
                  </select>
                </label>

                <div className="soft-panel px-4 py-3">
                  <p className="eyebrow">
                    Closure Status
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">
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
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
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
          </div>

          <aside className="space-y-6">
            <div className="premium-dark">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                Case Health
              </p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
                {overdueFollowUps.length > 0
                  ? "Follow-up overdue"
                  : openFollowUps.length > 0
                    ? "Follow-up pending"
                    : caseCompleted
                      ? "Case completed"
                      : caseReadyForDecision
                        ? "Ready for closure"
                        : "Documents pending"}
              </h2>

              <div className="mt-6 grid gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Missing Items
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {missingDocuments} documents
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Open Follow-ups
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {openFollowUps.length} follow-ups
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Overdue
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {overdueFollowUps.length} follow-ups
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Internal Notes
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {notes.length} notes
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Needs Review
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {documentsNeedingReview} documents
                  </p>
                </div>
              </div>
            </div>

            <div className="premium-card">
              <p className="eyebrow">
                Activity
              </p>

              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                Timeline
              </h2>

              <div className="mt-6 space-y-5">
                {activityFeed.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-slate-900" />

                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.detail}
                    </p>

                    <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
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
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-5">
                <div>
                  <p className="eyebrow">
                    Storage Upload
                  </p>

                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                    Upload document file
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Select a file from your computer and store it in Supabase
                    Storage for this case.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleStorageUpload} className="mt-6 space-y-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                />

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    File from computer
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Files are stored in the private case-documents bucket and
                    downloaded through signed links.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-primary"
                    >
                      Select file
                    </button>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500">
                      {selectedFileLabel}
                    </div>
                  </div>
                </div>

                <label className="input-label">
                  Attach to checklist item
                  <select
                    value={uploadTargetId}
                    onChange={(event) =>
                      handleUploadTargetChange(event.target.value)
                    }
                    className="input-field"
                  >
                    {documents.map((document) => (
                      <option key={document.id} value={document.id}>
                        {document.name}
                      </option>
                    ))}
                    <option value="new">Add as new document record</option>
                  </select>
                </label>

                {uploadTargetId === "new" ? (
                  <label className="input-label">
                    Document name
                    <input
                      value={uploadDocumentName}
                      onChange={(event) =>
                        setUploadDocumentName(event.target.value)
                      }
                      className="input-field"
                    />
                  </label>
                ) : null}

                <label className="input-label">
                  Description
                  <textarea
                    value={uploadDescription}
                    onChange={(event) => setUploadDescription(event.target.value)}
                    rows={4}
                    required
                    className="input-field resize-y leading-7"
                  />
                </label>

                {uploadMessage ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    {uploadMessage}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={uploading}
                    className={savedButtonClass(uploading)}
                  >
                    {uploading ? "Uploading..." : "Upload file"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}