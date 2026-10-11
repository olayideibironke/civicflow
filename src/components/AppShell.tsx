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

type NavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Cases",
    href: "/app/cases",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Billing & Retainers",
    href: "/app/billing",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="M4 5h16v14H4V5Zm3 4h10M7 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Conflict Check",
    href: "/app/conflicts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m14 14 5 5M10 7v3l2 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Client Portal",
    href: "/app/client-access",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 8h5M18.5 5.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Client Intake",
    href: "/intake",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/app/reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="M5 20V10m7 10V4m7 16v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Account",
    href: "/app/account",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

const platformItems: NavigationItem[] = [
  {
    label: "Firm Inquiries",
    href: "/app/firm-inquiries",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="M4 6h16v10H7l-3 3V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Account Recovery",
    href: "/app/account-recovery",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="M5 10a7 7 0 1 1 2 5M5 10V5m0 5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

      if (!active) return;

      if (!session) {
        const redirectTo = encodeURIComponent(pathname || "/app");
        router.replace(`/attorney-login?redirectTo=${redirectTo}`);
        return;
      }

      const result = await loadStaffWorkspace();
      if (!active) return;

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
      if (!active) return;
      if (!session) router.replace("/attorney-login");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const initials = useMemo(() => getStaffInitials(workspace), [workspace]);
  const displayName = useMemo(() => getStaffDisplayName(workspace), [workspace]);
  const staffRole = workspace ? formatStaffRole(workspace.profile.role) : "Staff";
  const workspaceName = workspace?.organization.name ?? "Legal Workspace";
  const visibleNavigation = useMemo(
    () => workspace?.isPlatformAdmin ? [...navigationItems, ...platformItems] : navigationItems,
    [workspace?.isPlatformAdmin]
  );

  const activeNavigationItem = useMemo(
    () =>
      visibleNavigation.find((item) =>
        item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href)
      ),
    [pathname, visibleNavigation]
  );

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/attorney-login");
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
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Verifying firm access...</h1>
            <p className="mt-2.5 text-sm leading-6 text-slate-500">Protected firm pages require an authorized attorney or staff account.</p>
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
            <p className="eyebrow text-rose-500">Firm Access Required</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">This account cannot open the firm workspace.</h1>
            <p className="mt-2.5 text-sm leading-6 text-slate-500">{workspaceError}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/client" className="btn btn-secondary">Client portal</Link>
              <button type="button" onClick={handleSignOut} className="btn btn-primary">Sign out</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="cf-workspace min-h-screen">
      <div className="cf-workspace-shell">
        <aside className="cf-workspace-sidebar">
          <div className="cf-workspace-sidebar-inner">
            <Link
              href="/"
              className="cf-workspace-brand"
              aria-label="CivicFlow home"
            >
              <CivicFlowLogo size="md" inverted />
            </Link>

            <div className="cf-workspace-firm-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="cf-workspace-kicker text-blue-200/70">Firm workspace</p>
                  <p className="mt-2 truncate text-base font-semibold text-white">{workspaceName}</p>
                </div>
                <span className="cf-workspace-live-dot" aria-hidden="true" />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-300">
                Secure matter management for your legal team.
              </p>
            </div>

            <nav className="cf-workspace-nav" aria-label="Firm workspace">
              <p className="cf-workspace-nav-label">Practice</p>
              {visibleNavigation.map((item) => {
                const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                const showControls = item.href === "/app/settings";
                const showPlatform = item.href === "/app/firm-inquiries";

                return (
                  <div key={item.href}>
                    {showControls ? <p className="cf-workspace-nav-label mt-5">Firm controls</p> : null}
                    {showPlatform ? <p className="cf-workspace-nav-label mt-5">Westforge admin</p> : null}
                    <Link
                      href={item.href}
                      className={`cf-workspace-nav-item ${active ? "is-active" : ""}`}
                    >
                      <span className="cf-workspace-nav-icon">{item.icon}</span>
                      <span>{item.label}</span>
                      {active ? <span className="cf-workspace-nav-active" aria-hidden="true" /> : null}
                    </Link>
                  </div>
                );
              })}
            </nav>

            <div className="cf-workspace-profile">
              <div className="flex items-center gap-3">
                <div className="cf-workspace-avatar">{initials}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{staffRole}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/app/account" className="cf-workspace-profile-action">
                  Account
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="cf-workspace-profile-action"
                >
                  {signingOut ? "Signing out" : "Sign out"}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section className="cf-workspace-main">
          <header className="cf-workspace-topbar">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
                <span>{workspaceName}</span>
                <span aria-hidden="true">/</span>
                <span className="text-cobalt">{activeNavigationItem?.label ?? "Workspace"}</span>
              </div>
              <div className="mt-2 flex items-end gap-3">
                <h1 className="cf-workspace-page-title">
                  {activeNavigationItem?.label ?? "Legal workspace"}
                </h1>
                <span className="mb-1 hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.67rem] font-semibold text-emerald-700 sm:inline-flex">
                  Firm access verified
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/app/conflicts" className="btn btn-secondary hidden md:inline-flex">
                Conflict check
              </Link>
              <Link href="/app/cases/new" className="btn btn-primary">
                New matter
              </Link>
              <div className="cf-workspace-avatar cf-workspace-avatar-light">{initials}</div>
            </div>
          </header>

          <div className="cf-workspace-content animate-fade-up">{children}</div>
        </section>
      </div>
    </main>
  );
}
