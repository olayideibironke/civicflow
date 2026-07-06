"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { supabase } from "@/lib/supabase";
import {
  formatStaffRole,
  getStaffDisplayName,
  getStaffInitials,
  loadStaffWorkspace,
  type StaffWorkspace,
} from "@/lib/workspace";

type AppShellProps = {
  children: ReactNode;
};

const navigationItems = [
  {
    label: "Overview",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Cases",
    href: "/app/cases",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Demo Requests",
    href: "/app/demo-requests",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M4 6h16v10H7l-3 3V6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Public Intake",
    href: "/intake",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/app/reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M5 20V10m7 10V4m7 16v-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [workspace, setWorkspace] = useState<StaffWorkspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyStaffSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session) {
        const redirectTo = encodeURIComponent(pathname || "/app");
        router.replace(`/login?redirectTo=${redirectTo}`);
        return;
      }

      const result = await loadStaffWorkspace();

      if (!active) {
        return;
      }

      if (result.error || !result.workspace) {
        setWorkspaceError(result.error || "Unable to load staff workspace.");
        setCheckingSession(false);
        return;
      }

      setWorkspace(result.workspace);
      setWorkspaceError("");
      setCheckingSession(false);
    }

    verifyStaffSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (!session) {
        const redirectTo = encodeURIComponent(pathname || "/app");
        router.replace(`/login?redirectTo=${redirectTo}`);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const initials = useMemo(() => getStaffInitials(workspace), [workspace]);
  const displayName = useMemo(() => getStaffDisplayName(workspace), [workspace]);
  const staffRole = workspace ? formatStaffRole(workspace.profile.role) : "Staff";
  const workspaceName = workspace?.organization.name ?? "Workspace";

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full text-center animate-fade-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>

            <p className="eyebrow mt-6">CivicFlow Security</p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Verifying staff access…
            </h1>

            <p className="mt-2.5 text-sm leading-6 text-slate-500">
              Protected workspace pages require a signed-in staff profile.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (workspaceError) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full animate-fade-up">
            <p className="eyebrow text-rose-500">Workspace Setup Required</p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Staff profile could not be loaded.
            </h1>

            <p className="mt-2.5 text-sm leading-6 text-slate-500">
              {workspaceError}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="btn btn-secondary">
                Back home
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn-primary"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
        <aside className="self-start rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[var(--shadow-md)] backdrop-blur lg:sticky lg:top-8">
          <Link
            href="/"
            className="flex items-center rounded-xl px-2 py-1.5 transition hover:opacity-90"
            aria-label="CivicFlow home"
          >
            <CivicFlowLogo size="md" />
          </Link>

          <div className="premium-dark mt-4 !rounded-xl !p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blue-200/80">
              Active Workspace
            </p>

            <p className="mt-2.5 text-lg font-bold leading-tight text-white">
              {workspaceName}
            </p>

            <div className="mt-3.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <p className="text-xs font-medium text-slate-300">
                Organization access verified
              </p>
            </div>
          </div>

          <nav className="mt-5 grid gap-1">
            <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </p>
            {navigationItems.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-400" />
                  ) : null}
                  <span
                    className={`flex shrink-0 items-center justify-center transition ${
                      active ? "text-blue-300" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 border-t border-slate-200/80 pt-5">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-semibold text-white ring-1 ring-white/10">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                    {staffRole}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="btn btn-secondary mt-3.5 w-full"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                Build status
              </p>

              <span className="chip border-amber-200 bg-amber-50 text-amber-700">
                MVP
              </span>
            </div>

            <p className="mt-2.5 text-xs leading-5 text-slate-500">
              Workspace settings, demo requests, public intake, case tracking,
              documents, notes, follow-ups, and reports.
            </p>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 shadow-[var(--shadow-sm)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Westforge SaaS Workspace
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                {workspaceName} · {staffRole}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/request-demo"
                className="btn btn-secondary hidden sm:inline-flex"
              >
                Demo form
              </Link>

              <Link href="/intake" className="btn btn-secondary">
                Public intake
              </Link>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-semibold text-white ring-1 ring-white/10">
                {initials}
              </div>
            </div>
          </header>

          <div className="animate-fade-up">{children}</div>
        </section>
      </div>
    </main>
  );
}