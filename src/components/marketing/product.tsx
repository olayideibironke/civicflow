/*
 * Product compositions for the public site.
 * Every screen mirrors a real CivicFlow view: labels, statuses, fields and
 * actions come from the authenticated app. Records shown are illustrative.
 */
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

type Tone = "slate" | "blue" | "amber" | "rose" | "emerald" | "navy" | "violet";

const pillTones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  navy: "bg-navy text-white border-navy",
  violet: "bg-indigo-50 text-indigo-700 border-indigo-100",
};

export function Pill({
  tone = "slate",
  children,
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`mk-ui-pill ${pillTones[tone]}`}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" /> : null}
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  "New Intake": "blue",
  "In Review": "violet",
  Assigned: "navy",
  "Waiting on Client": "amber",
  Completed: "emerald",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <Pill tone={statusTone[status] ?? "slate"} dot>
      {status}
    </Pill>
  );
}

const priorityTone: Record<string, Tone> = {
  Urgent: "rose",
  High: "amber",
  Medium: "slate",
  Low: "slate",
};

export function PriorityPill({ priority }: { priority: string }) {
  return <Pill tone={priorityTone[priority] ?? "slate"}>{priority}</Pill>;
}

function Avatar({ initials, tone = "navy" }: { initials: string; tone?: "navy" | "stone" }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9.5px] font-semibold ${
        tone === "navy" ? "bg-navy text-white" : "bg-stone-200 text-stone-700"
      }`}
    >
      {initials}
    </span>
  );
}

function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </p>
  );
}

function Panel({
  label,
  title,
  action,
  children,
  className = "",
}: {
  label?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mk-panel rounded-[10px] border border-slate-200/90 bg-white p-3.5 ${className}`}>
      {label || title || action ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {label ? <PanelLabel>{label}</PanelLabel> : null}
            {title ? <p className="mt-0.5 text-[12.5px] font-semibold text-slate-900">{title}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function MiniButton({
  children,
  variant = "outline",
}: {
  children: ReactNode;
  variant?: "outline" | "dark" | "blue";
}) {
  const v =
    variant === "dark"
      ? "bg-navy text-white border-navy"
      : variant === "blue"
        ? "bg-cobalt text-white border-cobalt"
        : "bg-white text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[10.5px] font-semibold ${v}`}>
      {children}
    </span>
  );
}

function Bar({ value, tone = "navy" }: { value: number; tone?: "navy" | "blue" | "amber" | "emerald" }) {
  const c =
    tone === "blue"
      ? "bg-cobalt"
      : tone === "amber"
        ? "bg-amber-400"
        : tone === "emerald"
          ? "bg-emerald-500"
          : "bg-navy";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${c}`} style={{ width: `${value}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Frames                                                              */
/* ------------------------------------------------------------------ */

export function AppWindow({
  url = "civicflowapp.org/app",
  children,
  className = "",
  onDark = false,
  label,
}: {
  url?: string;
  children: ReactNode;
  className?: string;
  onDark?: boolean;
  label: string;
}) {
  return (
    <figure
      role="img"
      aria-label={label}
      className={`mk-frame mk-ui @container ${onDark ? "mk-frame-on-dark" : ""} ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-200/80 bg-[#f7f7f5] px-3.5 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="mx-auto flex min-w-0 max-w-[340px] flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 text-[10.5px] text-slate-500">
          <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 shrink-0 text-slate-400" fill="none" aria-hidden="true">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="truncate">{url}</span>
        </div>
        <div className="w-[42px]" aria-hidden="true" />
      </div>
      <div aria-hidden="true">{children}</div>
    </figure>
  );
}

export function FloatCard({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={`mk-frame-float mk-ui ${className}`}
    >
      <div aria-hidden={label ? "true" : undefined}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Staff workspace shell                                               */
/* ------------------------------------------------------------------ */

const sidebarItems = [
  "Overview",
  "Cases",
  "Client Portal",
  "Client Intake",
  "Reports",
  "Settings",
] as const;

type SidebarItem = (typeof sidebarItems)[number];

function SidebarGlyph({ name }: { name: SidebarItem }) {
  const p: Record<SidebarItem, ReactNode> = {
    Overview: <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" fill="currentColor" stroke="none" />,
    Cases: <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />,
    "Client Portal": (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 8h5M18.5 5.5v5" />
      </>
    ),
    "Client Intake": <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />,
    Reports: <path d="M5 20V10m7 10V4m7 16v-7" />,
    Settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2m0 14v2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5">
      {p[name]}
    </svg>
  );
}

function Logomark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-[7px] bg-navy text-white ${className}`}>
      <svg viewBox="0 0 64 64" className="h-[76%] w-[76%]" aria-hidden="true">
        <path d="M45.5 12H24.5C16.5 12 11 17.5 11 25.5V38.5C11 46.5 16.5 52 24.5 52H45.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />
        <path d="M18 24C24 24 24 18.5 31.5 18.5H40" fill="none" stroke="#5b83f5" strokeLinecap="round" strokeWidth="5" />
        <path d="M18 32H45" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
        <path d="M18 40C24 40 24 45.5 31.5 45.5H40" fill="none" stroke="#5b83f5" strokeLinecap="round" strokeWidth="5" />
      </svg>
    </span>
  );
}

export function StaffShell({
  active,
  firm = "Harper & Lane Law",
  children,
}: {
  active: SidebarItem;
  firm?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex bg-[#f6f7f9]">
      <aside className="hidden w-[184px] shrink-0 border-r border-slate-200/80 bg-white p-3 @2xl:block">
        <div className="flex items-center gap-2 px-1">
          <Logomark />
          <span className="text-[12.5px] font-bold tracking-tight text-slate-900">CivicFlow</span>
        </div>
        <div className="mt-3 rounded-lg bg-midnight p-2.5 text-white">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-blue-200/80">Active Workspace</p>
          <p className="mt-1 truncate text-[11.5px] font-semibold">{firm}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[9.5px] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Firm access verified
          </p>
        </div>
        <p className="mt-4 px-2 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <nav className="mt-1.5 grid gap-0.5">
          {sidebarItems.map((item) => {
            const isActive = item === active;
            return (
              <span
                key={item}
                className={`relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] font-medium ${
                  isActive ? "bg-navy text-white" : "text-slate-600"
                }`}
              >
                {isActive ? <span className="absolute left-0 top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-r bg-blue-400" /> : null}
                <span className={isActive ? "text-blue-300" : "text-slate-400"}>
                  <SidebarGlyph name={item} />
                </span>
                {item}
              </span>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-3.5 @2xl:p-5">{children}</div>
    </div>
  );
}

function ScreenHeader({
  label,
  title,
  actions,
}: {
  label: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <PanelLabel>{label}</PanelLabel>
        <p className="mt-0.5 text-[16px] font-semibold tracking-tight text-slate-900 @2xl:text-[18px]">{title}</p>
      </div>
      {actions ? <div className="flex gap-1.5">{actions}</div> : null}
    </div>
  );
}

function Kpi({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "rose" | "amber" }) {
  return (
    <div className="rounded-[10px] border border-slate-200/90 bg-white p-3">
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1 text-[20px] font-semibold tracking-tight ${
          tone === "rose" ? "text-rose-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {note ? <p className="text-[9.5px] text-slate-400">{note}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

export function DashboardScreen() {
  return (
    <StaffShell active="Overview">
      <ScreenHeader
        label="Operations Dashboard"
        title="Staff command center"
        actions={
          <>
            <MiniButton>Client intake</MiniButton>
            <MiniButton variant="dark">+ Create case</MiniButton>
          </>
        }
      />
      <div className="mt-3.5 grid grid-cols-2 gap-2 @xl:grid-cols-4">
        <Kpi label="Open Cases" value="38" note="Across all stages" />
        <Kpi label="Open Follow-ups" value="14" note="Assigned to staff" />
        <Kpi label="Overdue Follow-ups" value="3" tone="rose" note="Past due date" />
        <Kpi label="Document Gaps" value="9" tone="amber" note="Missing items" />
      </div>
      <div className="mt-3 grid gap-3 @3xl:grid-cols-[1.35fr_1fr]">
        <Panel label="Needs Attention" title="Matters requiring action">
          <div className="grid gap-1.5">
            {[
              ["CF-1052", "Rivera, Daniela", "Family Law", "Overdue follow-up", "rose"],
              ["CF-1049", "Okafor, Chidi", "Immigration", "Open follow-up", "amber"],
              ["CF-1055", "Brennan, Tess", "Civil Litigation", "Unassigned", "slate"],
              ["CF-1047", "Haddad, Omar", "Criminal Defense", "Open follow-up", "amber"],
            ].map(([num, name, type, badge, tone]) => (
              <div key={num} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/60 px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-semibold text-slate-900">
                    <span className="text-slate-400">{num}</span> &nbsp;{name}
                  </p>
                  <p className="text-[10px] text-slate-500">{type}</p>
                </div>
                <Pill tone={tone as Tone}>{badge}</Pill>
              </div>
            ))}
          </div>
        </Panel>
        <Panel label="Workflow Queues" title="Case stages">
          <div className="grid gap-2.5">
            {[
              ["New Intake", 6, 30, "blue"],
              ["In Review", 11, 55, "navy"],
              ["Waiting on Client", 7, 36, "amber"],
              ["Completed", 19, 90, "emerald"],
            ].map(([stage, count, w, tone]) => (
              <div key={stage as string}>
                <div className="mb-1 flex justify-between text-[10.5px]">
                  <span className="font-medium text-slate-600">{stage}</span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
                <Bar value={w as number} tone={tone as "navy"} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </StaffShell>
  );
}

const queueRows = [
  {
    num: "CF-1052",
    name: "Daniela Rivera",
    type: "Family Law",
    who: "Maya Johnson",
    status: "Waiting on Client",
    priority: "High",
    follow: "2 open · 1 overdue",
    gaps: "1 missing",
    source: "Client Intake",
  },
  {
    num: "CF-1049",
    name: "Chidi Okafor",
    type: "Immigration",
    who: "Daniel Reeves",
    status: "In Review",
    priority: "Medium",
    follow: "1 open",
    gaps: "None",
    source: "Staff Created",
  },
  {
    num: "CF-1055",
    name: "Tess Brennan",
    type: "Civil Litigation",
    who: "Unassigned",
    status: "New Intake",
    priority: "Urgent",
    follow: "None",
    gaps: "3 missing",
    source: "Client Intake",
  },
];

export function CaseQueueScreen({ rows = 3 }: { rows?: number }) {
  return (
    <StaffShell active="Cases">
      <ScreenHeader
        label="Case Queue"
        title="Cases and follow-up workload"
        actions={<MiniButton variant="dark">+ New case</MiniButton>}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 @lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] text-slate-400 @lg:col-span-1">
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Search name, case number, staff...
        </div>
        {["Status: All", "Priority: All", "Attention: Open Follow-ups"].map((f) => (
          <div key={f} className="truncate rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] font-medium text-slate-600">
            {f}
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[10px] text-slate-400">Showing {rows} of 38 cases</p>
      <div className="mt-1.5 grid gap-2">
        {queueRows.slice(0, rows).map((r) => (
          <div key={r.num} className="rounded-[10px] border border-slate-200/90 bg-white p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">{r.num}</span>
              <StatusPill status={r.status} />
              <PriorityPill priority={r.priority} />
              {r.who === "Unassigned" ? <Pill tone="slate">Unassigned</Pill> : null}
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-slate-900">{r.name}</p>
            <p className="text-[10.5px] text-slate-500">
              {r.type} · Assigned to {r.who}
            </p>
            <div className="mt-2.5 hidden grid-cols-3 gap-1.5 @lg:grid">
              {[
                ["Follow-ups", r.follow],
                ["Document Gaps", r.gaps],
                ["Created / Source", r.source],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md bg-slate-50 px-2 py-1.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">{k}</p>
                  <p className="mt-0.5 text-[10.5px] font-medium text-slate-700">{v}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </StaffShell>
  );
}

const checklist = [
  ["Photo identification", "Received", "File: id-front.pdf"],
  ["Engagement agreement", "Received", "File: engagement-signed.pdf"],
  ["Client intake form", "Needs Review", "File: intake-form.pdf"],
  ["Supporting records", "Missing", "Awaiting client upload"],
] as const;

function docTone(s: string): Tone {
  return s === "Received" ? "emerald" : s === "Missing" ? "rose" : "amber";
}

export function DocumentChecklist({ compact = false }: { compact?: boolean }) {
  return (
    <Panel
      label="Documents"
      title="Document checklist"
      action={<MiniButton>Upload document</MiniButton>}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex-1">
          <Bar value={50} tone="emerald" />
        </div>
        <span className="text-[10.5px] font-semibold text-slate-700">50% complete</span>
      </div>
      <div className="grid gap-1.5">
        {checklist.slice(0, compact ? 3 : 4).map(([name, status, file]) => (
          <div key={name} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                  <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11.5px] font-semibold text-slate-900">{name}</p>
                <p className="truncate text-[10px] text-slate-400">{file}</p>
              </div>
            </div>
            <Pill tone={docTone(status)}>{status}</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const timeline = [
  ["Document status updated", "Engagement agreement marked Received", "Today, 10:42"],
  ["Internal note added", "Client Contact · follow-up due Oct 14", "Today, 9:15"],
  ["Document uploaded", "id-front.pdf attached to Photo identification", "Yesterday"],
  ["Workflow updated", "Status set to In Review · Assigned to Maya Johnson", "Oct 8"],
  ["Case created", "Matter created from client intake", "Oct 7"],
];

export function ActivityTimeline({ items = 4 }: { items?: number }) {
  return (
    <Panel label="Activity" title="Timeline">
      <ol className="relative grid gap-3 pl-4">
        <span className="absolute bottom-1 left-[4px] top-1 w-px bg-slate-200" />
        {timeline.slice(0, items).map(([title, detail, when], i) => (
          <li key={title} className="relative">
            <span
              className={`absolute -left-4 top-[3px] h-[9px] w-[9px] rounded-full border-2 border-white ${
                i === 0 ? "bg-cobalt" : "bg-slate-300"
              }`}
            />
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[11.5px] font-semibold text-slate-900">{title}</p>
              <p className="shrink-0 text-[9.5px] text-slate-400">{when}</p>
            </div>
            <p className="text-[10.5px] text-slate-500">{detail}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function NoteCard() {
  return (
    <Panel label="Internal Notes" title="Staff case notes">
      <div className="rounded-md border border-slate-100 bg-slate-50/70 p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="blue">Client Contact</Pill>
          <Pill tone="amber" dot>
            Follow-up open
          </Pill>
        </div>
        <p className="mt-2 text-[11px] leading-[1.5] text-slate-700">
          Spoke with client about the remaining records. She will upload the lease and pay statements by Friday.
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Avatar initials="MJ" /> Maya Johnson · Follow-up Oct 14
          </span>
          <MiniButton>Mark complete</MiniButton>
        </div>
      </div>
    </Panel>
  );
}

export function CaseHealthCard() {
  return (
    <Panel label="Case Health">
      <div className="grid gap-1.5">
        {[
          ["Missing Items", "1", "rose"],
          ["Needs Review", "1", "amber"],
          ["Open Follow-ups", "2", "slate"],
          ["Overdue", "0", "slate"],
          ["Internal Notes", "6", "slate"],
        ].map(([k, v, t]) => (
          <div key={k} className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5">
            <span className="text-[10.5px] text-slate-600">{k}</span>
            <span
              className={`text-[11.5px] font-semibold ${
                t === "rose" ? "text-rose-600" : t === "amber" ? "text-amber-600" : "text-slate-900"
              }`}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function CaseDetailScreen() {
  return (
    <StaffShell active="Cases">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-slate-400">← Back to cases</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[17px] font-semibold tracking-tight text-slate-900">Case CF-1052</p>
            <StatusPill status="In Review" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <MiniButton>View reports</MiniButton>
          <MiniButton variant="dark">Upload document</MiniButton>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 @xl:grid-cols-4">
        {[
          ["Client", "Daniela Rivera"],
          ["Service Type", "Family Law"],
          ["Priority", "High"],
          ["Created", "Oct 7, 2026"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[10px] border border-slate-200/90 bg-white px-3 py-2.5">
            <p className="text-[9.5px] font-medium text-slate-400">{k}</p>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 @3xl:grid-cols-[1.45fr_1fr]">
        <div className="grid gap-3">
          <Panel label="Workflow Control" title="Status and assignment">
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <div>
                <p className="text-[9.5px] font-medium text-slate-500">Case status</p>
                <div className="mt-1 rounded-md border border-slate-200 px-2 py-1.5 text-[10.5px] font-medium">In Review</div>
              </div>
              <div>
                <p className="text-[9.5px] font-medium text-slate-500">Assigned staff</p>
                <div className="mt-1 truncate rounded-md border border-slate-200 px-2 py-1.5 text-[10.5px] font-medium">Maya Johnson</div>
              </div>
              <MiniButton variant="dark">Save workflow</MiniButton>
            </div>
          </Panel>
          <DocumentChecklist />
        </div>
        <div className="hidden gap-3 @3xl:grid">
          <CaseHealthCard />
          <ActivityTimeline items={3} />
        </div>
      </div>
    </StaffShell>
  );
}

export function IntakeFormCard() {
  const field = (label: string, value: string, wide = false) => (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[10px] font-semibold text-slate-600">{label}</p>
      <div className="mt-1 truncate rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800">
        {value}
      </div>
    </div>
  );
  return (
    <div className="p-4 @md:p-5">
      <div className="flex items-center gap-2">
        <Logomark className="h-7 w-7" />
        <div>
          <p className="text-[12px] font-semibold text-slate-900">Harper &amp; Lane Law</p>
          <p className="text-[10px] text-slate-500">Client intake</p>
        </div>
      </div>
      <p className="mt-3.5 text-[15px] font-semibold tracking-tight text-slate-900">Tell us about your matter</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {field("First name *", "Tess")}
        {field("Last name *", "Brennan")}
        {field("Email address *", "tess.brennan@email.com")}
        {field("Phone number *", "(202) 555-0147")}
        {field("Matter type *", "Civil Litigation")}
        {field("Priority *", "Urgent")}
        <div className="col-span-2">
          <p className="text-[10px] font-semibold text-slate-600">Matter details *</p>
          <div className="mt-1 h-12 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] leading-[1.45] text-slate-800">
            Contract dispute with a former contractor. Hearing notice received last week.
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <MiniButton variant="dark">Submit intake</MiniButton>
      </div>
    </div>
  );
}

export function IntakeArrivalCard() {
  return (
    <div className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <PanelLabel>Case Queue</PanelLabel>
        <Pill tone="blue" dot>
          New Intake
        </Pill>
      </div>
      <p className="mt-2 text-[13px] font-semibold text-slate-900">CF-1055 · Tess Brennan</p>
      <p className="text-[10.5px] text-slate-500">Civil Litigation · Source: Client Intake</p>
      <div className="mt-2.5 grid gap-1">
        {["Photo identification", "Proof of address", "Client intake form", "Supporting records"].map((d) => (
          <div key={d} className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-600">{d}</span>
            <span className="font-semibold text-rose-600">Missing</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 border-t border-slate-100 pt-2 text-[10px] text-slate-400">Document checklist created automatically</p>
    </div>
  );
}

export function ClientAccessCard() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <PanelLabel>Client Portal</PanelLabel>
          <p className="mt-0.5 text-[13px] font-semibold text-slate-900">Control client access matter by matter</p>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/70 p-2.5">
        <p className="text-[10px] font-semibold text-slate-600">Client email *</p>
        <div className="mt-1 flex gap-1.5">
          <div className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10.5px]">daniela.rivera@email.com</div>
          <MiniButton variant="dark">Create secure invitation</MiniButton>
        </div>
        <p className="mt-1.5 text-[9.5px] text-slate-400">Single-use link · expires in 7 days</p>
      </div>
      <div className="mt-3 grid gap-3 @md:grid-cols-2">
        <div>
          <p className="text-[10.5px] font-semibold text-slate-900">Shared Documents</p>
          <p className="text-[9.5px] text-slate-400">Choose client-visible documents</p>
          <div className="mt-1.5 grid gap-1">
            {[
              ["Engagement agreement", true],
              ["Photo identification", true],
              ["Client intake form", false],
            ].map(([d, on]) => (
              <Check key={d as string} label={d as string} on={on as boolean} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10.5px] font-semibold text-slate-900">Shared Updates</p>
          <p className="text-[9.5px] text-slate-400">Choose client-visible activity</p>
          <div className="mt-1.5 grid gap-1">
            {[
              ["Case created", true],
              ["Workflow updated", true],
              ["Document status updated", false],
            ].map(([d, on]) => (
              <Check key={d as string} label={d as string} on={on as boolean} />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-md bg-slate-50 px-2.5 py-1.5 text-[9.5px] text-slate-500">
        A document stays private until you explicitly share it. Internal notes are never shared.
      </p>
    </div>
  );
}

function Check({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-100 bg-white px-2 py-1.5">
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
          on ? "border-cobalt bg-cobalt text-white" : "border-slate-300 bg-white"
        }`}
      >
        {on ? (
          <svg viewBox="0 0 20 20" fill="none" className="h-2.5 w-2.5">
            <path d="m5 10.5 3.2 3.2L15 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="truncate text-[10.5px] text-slate-700">{label}</span>
      <span className={`ml-auto shrink-0 text-[9px] font-semibold ${on ? "text-cobalt" : "text-slate-400"}`}>
        {on ? "Shared" : "Private"}
      </span>
    </div>
  );
}

export function ClientPortalScreen() {
  return (
    <div className="bg-[#f6f7f9]">
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Logomark />
          <div>
            <p className="text-[12px] font-semibold text-slate-900">Client Portal</p>
            <p className="text-[9.5px] text-slate-400">1 matter connected to this account</p>
          </div>
        </div>
        <div className="hidden gap-3 text-[10.5px] font-medium text-slate-500 @md:flex">
          <span className="text-slate-900">My matters</span>
          <span>Account</span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] text-slate-400">Harper &amp; Lane Law</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className="text-[16px] font-semibold tracking-tight text-slate-900">Matter CF-1052</p>
          <StatusPill status="In Review" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Assigned team", "Maya Johnson"],
            ["Priority", "High"],
            ["Last updated", "Today"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-slate-200/90 bg-white px-2.5 py-2">
              <p className="text-[9px] text-slate-400">{k}</p>
              <p className="truncate text-[11px] font-semibold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 @lg:grid-cols-2">
          <Panel label="Shared Documents" title="Documents your legal team shared">
            {["Engagement agreement", "Photo identification"].map((d) => (
              <div key={d} className="mb-1.5 flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5 last:mb-0">
                <span className="truncate text-[11px] font-medium text-slate-800">{d}</span>
                <span className="text-[10px] font-semibold text-cobalt">Download</span>
              </div>
            ))}
          </Panel>
          <Panel label="Updates" title="Shared activity">
            {[
              ["Workflow updated", "Status set to In Review"],
              ["Case created", "Your matter was opened"],
            ].map(([t, d]) => (
              <div key={t} className="mb-2 last:mb-0">
                <p className="text-[11px] font-semibold text-slate-900">{t}</p>
                <p className="text-[10px] text-slate-500">{d}</p>
              </div>
            ))}
          </Panel>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[9.5px] text-slate-400">
          <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Only information your legal team shares with you appears here.
        </p>
      </div>
    </div>
  );
}

function TrendChart() {
  const created = [3, 5, 4, 6, 5, 7, 6];
  const completed = [1, 2, 3, 2, 4, 3, 5];
  const max = 8;
  const pts = (arr: number[]) =>
    arr.map((v, i) => `${(i / (arr.length - 1)) * 280 + 10},${100 - (v / max) * 84}`).join(" ");
  return (
    <svg viewBox="0 0 300 110" className="h-auto w-full" aria-hidden="true">
      {[20, 46, 72, 98].map((y) => (
        <line key={y} x1="10" x2="290" y1={y} y2={y} stroke="#eef0f3" strokeWidth="1" />
      ))}
      <polyline points={pts(created)} fill="none" stroke="#0f1e3d" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts(completed)} fill="none" stroke="#2f5bea" strokeWidth="2" strokeDasharray="0" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
      {created.map((v, i) => (
        <circle key={`c${i}`} cx={(i / 6) * 280 + 10} cy={100 - (v / max) * 84} r="2.4" fill="#0f1e3d" />
      ))}
      {completed.map((v, i) => (
        <circle key={`d${i}`} cx={(i / 6) * 280 + 10} cy={100 - (v / max) * 84} r="2.4" fill="#2f5bea" />
      ))}
    </svg>
  );
}

function Donut({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#eef0f3" strokeWidth="9" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="#0f1e3d"
        strokeWidth="9"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="38" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0f172a">
        {value}%
      </text>
      <text x="40" y="51" textAnchor="middle" fontSize="7.5" fill="#94a3b8">
        Closed
      </text>
    </svg>
  );
}

export function ReportsScreen() {
  return (
    <StaffShell active="Reports">
      <ScreenHeader
        label="Reports"
        title="Performance dashboard"
        actions={<MiniButton variant="dark">Download Excel report</MiniButton>}
      />
      <div className="mt-3 grid grid-cols-3 gap-2 @3xl:grid-cols-6">
        <Kpi label="Open Cases" value="38" />
        <Kpi label="Completed" value="19" />
        <Kpi label="Avg Cycle" value="12d" />
        <Kpi label="Open Follow-ups" value="14" />
        <Kpi label="Overdue" value="3" tone="rose" />
        <Kpi label="Document Gaps" value="9" tone="amber" />
      </div>
      <div className="mt-3 grid gap-3 @3xl:grid-cols-[1.5fr_1fr]">
        <Panel
          label="7-Day Trend"
          title="Intake and closure activity"
          action={
            <div className="flex gap-2.5 text-[9.5px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-navy" />
                Created
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-3 rounded-full bg-cobalt" />
                Completed
              </span>
            </div>
          }
        >
          <TrendChart />
        </Panel>
        <div className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-1">
          <Panel label="Completion Mix" title="Closed vs open cases">
            <div className="flex items-center gap-3">
              <Donut value={33} />
              <div className="grid gap-1 text-[10.5px]">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2 w-2 rounded-sm bg-navy" /> Completed
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2 w-2 rounded-sm bg-slate-200" /> Open
                </span>
              </div>
            </div>
          </Panel>
          <Panel label="Staff Workload" title="Open case ownership">
            <div className="grid gap-2">
              {[
                ["Maya Johnson", 72],
                ["Daniel Reeves", 54],
                ["Aisha Carter", 38],
              ].map(([n, w]) => (
                <div key={n as string}>
                  <div className="mb-1 flex justify-between text-[10px]">
                    <span className="text-slate-600">{n}</span>
                  </div>
                  <Bar value={w as number} tone="blue" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </StaffShell>
  );
}

export function ExportCard() {
  const sheets = [
    "Summary",
    "Cases",
    "Documents",
    "Follow-up Status",
    "Staff Workload",
    "Document Gaps",
    "7 Day Trend",
  ];
  return (
    <div className="p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">XLSX</span>
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-semibold text-slate-900">CivicFlow_Report_2026-10-10.xlsx</p>
          <p className="text-[9.5px] text-slate-400">Excel workbook · 11 sheets</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {sheets.map((s) => (
          <span key={s} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9.5px] text-slate-600">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SettingsCard() {
  return (
    <div className="p-4">
      <PanelLabel>Settings</PanelLabel>
      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">Firm settings</p>
      <div className="mt-3 grid gap-2.5">
        <div>
          <p className="text-[10px] font-semibold text-slate-600">Firm name *</p>
          <div className="mt-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px]">Harper &amp; Lane Law</div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-2">
          <span className="text-[11px] font-medium text-slate-800">Client intake enabled</span>
          <span className="flex h-4 w-7 items-center rounded-full bg-cobalt p-0.5">
            <span className="ml-auto h-3 w-3 rounded-full bg-white" />
          </span>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-600">Default matter types *</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {["Criminal Defense", "Family Law", "Immigration", "Civil Litigation", "General Legal Matter"].map((t) => (
              <span key={t} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-700">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-2">
          <p className="text-[10px] font-semibold text-slate-600">Intake link</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-[10.5px] text-slate-500">civicflowapp.org/intake/harper-lane</span>
            <MiniButton>Copy link</MiniButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InviteLinkCard() {
  return (
    <div className="p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cobalt-soft text-cobalt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
            <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </svg>
        </span>
        <div>
          <p className="text-[11.5px] font-semibold text-slate-900">Client activation link</p>
          <p className="text-[9.5px] text-slate-400">Pending · expires in 7 days</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-500">
          /client/activate?token=••••••••••••
        </span>
        <MiniButton>Copy link</MiniButton>
      </div>
    </div>
  );
}

export function UploadDocumentCard() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-slate-900">Upload document file</p>
        <span className="text-[13px] leading-none text-slate-400">×</span>
      </div>
      <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3 py-4 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 text-slate-400" aria-hidden="true">
          <path d="M12 15V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
        </svg>
        <p className="mt-1.5 text-[11px] font-semibold text-slate-800">Select file</p>
        <p className="text-[9.5px] text-slate-400">PDF, PNG, JPG, DOC, DOCX, XLS, XLSX</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5 text-center text-[10px] font-semibold">
        <span className="rounded bg-white py-1 text-slate-900 shadow-sm">Attach to checklist item</span>
        <span className="py-1 text-slate-500">Add as new document record</span>
      </div>
      <div className="mt-2.5">
        <p className="text-[10px] font-semibold text-slate-600">Checklist item</p>
        <div className="mt-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px]">Supporting records</div>
      </div>
      <div className="mt-3 flex justify-end">
        <MiniButton variant="dark">Upload file</MiniButton>
      </div>
    </div>
  );
}

export function DecisionCard() {
  return (
    <div className="p-4">
      <PanelLabel>Final Decision</PanelLabel>
      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">Close case workflow</p>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {["Approved", "Denied", "Referred", "Withdrawn"].map((o, i) => (
          <span
            key={o}
            className={`rounded-md border px-2 py-1.5 text-center text-[10.5px] font-semibold ${
              i === 0 ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {o}
          </span>
        ))}
      </div>
      <div className="mt-2.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] text-slate-500">
        Decision note
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[10px] font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        All required documents received
      </p>
      <div className="mt-3 flex justify-end">
        <MiniButton variant="dark">Complete case</MiniButton>
      </div>
    </div>
  );
}

export function MatterCard({
  num,
  name,
  type,
  status,
  priority,
  owner,
  meta,
}: {
  num: string;
  name: string;
  type: string;
  status: string;
  priority: string;
  owner: string;
  meta?: string;
}) {
  return (
    <div className="p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-400">{num}</span>
        <StatusPill status={status} />
        <PriorityPill priority={priority} />
      </div>
      <p className="mt-1.5 text-[13px] font-semibold text-slate-900">{name}</p>
      <p className="text-[10.5px] text-slate-500">
        {type} · Assigned to {owner}
      </p>
      {meta ? (
        <p className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-[10.5px] font-medium text-slate-600">{meta}</p>
      ) : null}
    </div>
  );
}

export function FollowUpList() {
  return (
    <div className="p-3.5">
      <PanelLabel>Upcoming Follow-ups</PanelLabel>
      <p className="mt-0.5 text-[12.5px] font-semibold text-slate-900">Due dates</p>
      <div className="mt-2.5 grid gap-1.5">
        {[
          ["CF-1047", "Document Follow-up", "Today", "rose"],
          ["CF-1049", "Client Contact", "Oct 12", "amber"],
          ["CF-1052", "Review Note", "Oct 14", "slate"],
        ].map(([n, t, d, tone]) => (
          <div key={n} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-900">{n}</p>
              <p className="truncate text-[10px] text-slate-500">{t}</p>
            </div>
            <Pill tone={tone as Tone}>{d}</Pill>
          </div>
        ))}
      </div>
    </div>
  );
}
