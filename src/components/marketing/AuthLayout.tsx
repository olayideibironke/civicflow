import Link from "next/link";
import type { ReactNode } from "react";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import {
  ClientPortalScreen,
  DocumentChecklist,
  FloatCard,
} from "@/components/marketing/product";
import { Icon, type IconName } from "@/components/marketing/ui";

type AsideVariant = "staff" | "client" | "security";

const asideCopy: Record<
  AsideVariant,
  { eyebrow: string; title: string; text: string; points: [IconName, string][] }
> = {
  staff: {
    eyebrow: "Firm workspace",
    title: "Your matters, documents and follow-ups, right where you left them.",
    text: "Authorized attorneys and staff sign in to the firm workspace. Data is isolated to your firm and protected on every request.",
    points: [
      ["building", "Records isolated to your firm"],
      ["lock", "Private document storage"],
      ["users", "Separate from the client portal"],
    ],
  },
  client: {
    eyebrow: "Client portal",
    title: "A secure view of the matters your legal team shares with you.",
    text: "Your law firm decides what appears here. You can review status, your assigned team, and the documents and updates they have shared.",
    points: [
      ["key", "Access begins with your firm's invitation"],
      ["eye", "Only shared items are visible"],
      ["lock", "Documents download through secure links"],
    ],
  },
  security: {
    eyebrow: "Account security",
    title: "Account recovery that protects you first.",
    text: "CivicFlow never reveals login emails automatically. Every recovery request is handled in a way that keeps your account and your clients' information safe.",
    points: [
      ["shield", "No account details disclosed automatically"],
      ["clock", "Time-limited password reset links"],
      ["key", "Passwords of at least 12 characters"],
    ],
  },
};

export default function AuthLayout({
  variant,
  topLink,
  children,
}: {
  variant: AsideVariant;
  topLink?: { label: string; href: string };
  children: ReactNode;
}) {
  const copy = asideCopy[variant];

  return (
    <main className="mk min-h-screen lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      {/* Brand panel */}
      <aside className="mk-dark relative hidden overflow-hidden lg:flex lg:flex-col">
        <div className="mk-dark-grid mk-fade-mask pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-1 flex-col px-12 py-10 xl:px-16">
          <Link href="/" className="mk-focus w-fit rounded-lg" aria-label="CivicFlow home">
            <CivicFlowLogo size="sm" inverted />
          </Link>
          <div className="mt-auto max-w-md pt-16">
            <p className="mk-eyebrow !text-blue-200">{copy.eyebrow}</p>
            <p className="mk-display mt-5 text-[2.35rem] leading-[1.1] text-white">{copy.title}</p>
            <p className="mt-5 text-[0.98rem] leading-7 text-slate-300">{copy.text}</p>
          </div>
          <div className="relative mt-12 max-w-[440px]">
            {variant === "client" ? (
              <FloatCard label="Client portal preview" className="mk-frame-on-dark @container overflow-hidden">
                <ClientPortalScreen />
              </FloatCard>
            ) : (
              <FloatCard label="Document checklist preview" className="mk-frame-on-dark overflow-hidden">
                <DocumentChecklist compact />
              </FloatCard>
            )}
          </div>
          <ul className="mt-12 grid gap-3 border-t border-white/10 pt-8">
            {copy.points.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <Icon name={icon} className="h-4 w-4 text-blue-200" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form column */}
      <section className="flex min-h-screen flex-col">
        <div className="mk-container flex h-[72px] items-center justify-between !max-w-none lg:!px-12">
          <Link href="/" className="mk-focus rounded-lg lg:invisible" aria-label="CivicFlow home">
            <CivicFlowLogo size="sm" />
          </Link>
          {topLink ? (
            <Link href={topLink.href} className="mk-btn mk-btn-outline mk-btn-sm">
              {topLink.label}
            </Link>
          ) : null}
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16 pt-6 sm:px-8">
          <div className="w-full max-w-[460px]">{children}</div>
        </div>
        <div className="mk-container flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-[0.8rem] text-slate-500 !max-w-none lg:!px-12">
          <p>© {new Date().getFullYear()} Westforge</p>
          <div className="flex gap-5">
            <Link href="/security" className="hover:text-ink">Security</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <Link href="/" className="hover:text-ink">Home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-cobalt">{eyebrow}</p>
      <h1 className="mk-display mt-3 text-[2.1rem] leading-[1.12] text-ink">{title}</h1>
      {description ? (
        <p className="mt-3 text-[0.95rem] leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

export function AuthChecking({ message }: { message: string }) {
  return (
    <main className="mk flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        <CivicFlowLogo size="sm" showText={false} />
        <span className="mk-spinner mt-8" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-slate-600" role="status">
          {message}
        </p>
      </div>
    </main>
  );
}
