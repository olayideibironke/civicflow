import Link from "next/link";
import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mk-container ${className}`}>{children}</div>;
}

export function Eyebrow({
  children,
  className = "",
  tone = "cobalt",
}: {
  children: ReactNode;
  className?: string;
  tone?: "cobalt" | "light" | "muted";
}) {
  const toneClass =
    tone === "light"
      ? "!text-blue-200"
      : tone === "muted"
        ? "!text-slate-500"
        : "";
  return <p className={`mk-eyebrow ${toneClass} ${className}`}>{children}</p>;
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`mk-arrow h-3.5 w-3.5 ${className}`}
    >
      <path
        d="M3 8h9.5M8.5 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 ${className}`}
    >
      <path
        d="m5 10.5 3.2 3.2L15 7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={`${centered ? "mx-auto text-center" : ""} max-w-3xl ${className}`}
    >
      {eyebrow ? (
        <Eyebrow
          tone={tone === "dark" ? "light" : "cobalt"}
          className={centered ? "justify-center" : ""}
        >
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h2
        className={`mk-h2 mt-5 ${tone === "dark" ? "text-white" : "text-ink"}`}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={`mk-lead mt-5 ${centered ? "mx-auto" : ""} max-w-2xl ${
            tone === "dark" ? "!text-slate-300" : ""
          }`}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  arrow = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "accent" | "outline" | "light" | "ghost-dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  arrow?: boolean;
}) {
  const sizeClass = size === "lg" ? "mk-btn-lg" : size === "sm" ? "mk-btn-sm" : "";
  return (
    <Link
      href={href}
      className={`mk-btn mk-btn-${variant} ${sizeClass} ${className}`}
    >
      {children}
      {arrow ? <Arrow /> : null}
    </Link>
  );
}

export function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`mk-link text-sm ${className}`}>
      {children}
      <Arrow />
    </Link>
  );
}

export function CheckList({
  items,
  tone = "light",
  className = "",
}: {
  items: string[];
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <ul className={`grid gap-3 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className={`flex items-start gap-3 text-[0.95rem] leading-6 ${
            tone === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          <span
            className={`mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
              tone === "dark"
                ? "bg-white/10 text-blue-200"
                : "bg-cobalt-soft text-cobalt"
            }`}
          >
            <CheckIcon className="h-3 w-3" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* Small line icons used across marketing sections */
const iconPaths: Record<string, ReactNode> = {
  intake: (
    <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 20h14" />
  ),
  matter: (
    <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
  ),
  document: (
    <>
      <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  activity: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  client: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  report: <path d="M5 20V10m7 10V4m7 16v-7" />,
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8m-3 3 2 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  building: (
    <>
      <path d="M4 20V6l8-3 8 3v14" />
      <path d="M9 20v-5h6v5M8 9h1m3 0h1m3 0h1M8 12h1m3 0h1m3 0h1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5a3 3 0 0 1 0 6m2.5 8a5.5 5.5 0 0 0-3-4.9" />
    </>
  ),
  export: (
    <>
      <path d="M12 15V4m0 0-4 4m4-4 4 4" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2m0 14v2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4" />
    </>
  ),
  note: (
    <>
      <path d="M5 4h14v12l-4 4H5V4Z" />
      <path d="M15 20v-4h4M9 9h6M9 13h4" />
    </>
  ),
  recover: (
    <>
      <path d="M5 10a7 7 0 1 1 2 5M5 10V5m0 5h5" />
      <path d="M12 8v4l3 2" />
    </>
  ),
};

export type IconName = keyof typeof iconPaths;

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {iconPaths[name]}
    </svg>
  );
}

export function IconTile({
  name,
  tone = "light",
}: {
  name: IconName;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-[10px] border ${
        tone === "dark"
          ? "border-white/10 bg-white/[0.06] text-blue-200"
          : "border-line bg-white text-navy shadow-[0_1px_2px_rgba(8,18,42,0.05)]"
      }`}
    >
      <Icon name={name} className="h-[18px] w-[18px]" />
    </span>
  );
}
