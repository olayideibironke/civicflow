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
    icon: "◆",
  },
  {
    label: "Cases",
    href: "/app/cases",
    icon: "•",
  },
  {
    label: "Demo Requests",
    href: "/app/demo-requests",
    icon: "✦",
  },
  {
    label: "Public Intake",
    href: "/intake",
    icon: "◇",
  },
  {
    label: "Reports",
    href: "/app/reports",
    icon: "▲",
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: "●",
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
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
          <div className="premium-card w-full text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              CivicFlow Security
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Verifying staff access...
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Protected workspace pages require a signed-in staff profile.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (workspaceError) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
          <div className="premium-card w-full">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-500">
              Workspace Setup Required
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Staff profile could not be loaded.
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              {workspaceError}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Back home
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
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
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)]">
      <div className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="self-start rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur lg:sticky lg:top-8">
          <Link
            href="/"
            className="flex rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
            aria-label="CivicFlow home"
          >
            <CivicFlowLogo size="md" />
          </Link>

          <div className="mt-5 rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-5 text-white shadow-xl shadow-blue-950/20">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
              Active Workspace
            </p>

            <p className="mt-4 text-2xl font-black leading-tight">
              {workspaceName}
            </p>

            <div className="mt-5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <p className="text-sm font-bold text-slate-200">
                Organization access verified
              </p>
            </div>
          </div>

          <nav className="mt-6 grid gap-3">
            {navigationItems.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs ${
                      active ? "bg-white/15" : "bg-slate-100"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {displayName}
                  </p>
                  <p className="mt-1 truncate text-xs font-bold text-slate-500">
                    {staffRole} · {workspace?.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black transition ${
                  signingOut
                    ? "bg-slate-200 text-slate-500"
                    : "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
                } disabled:cursor-not-allowed`}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-black text-slate-950">
                Build status
              </p>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                MVP
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              CivicFlow now has workspace settings, demo request management,
              public intake, case tracking, documents, notes, follow-ups, and
              reports.
            </p>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <header className="rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-5 shadow-xl shadow-slate-200/60 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                  Westforge SaaS Workspace
                </p>

                <p className="mt-2 text-base font-black text-slate-800">
                  {workspaceName} · {staffRole}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/request-demo"
                  className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
                >
                  Demo form
                </Link>

                <Link
                  href="/intake"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Public intake
                </Link>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/15">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}