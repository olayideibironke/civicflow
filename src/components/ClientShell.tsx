"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import {
  getClientDisplayName,
  getClientInitials,
  loadClientWorkspace,
  type ClientWorkspace,
} from "@/lib/clientWorkspace";
import { supabase } from "@/lib/supabase";

type ClientShellProps = {
  children: ReactNode;
};

const navigationItems = [
  {
    label: "My matters",
    href: "/client",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Billing & agreements",
    href: "/client/billing",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M5 4h14v16H5V4Zm3 4h8m-8 4h8m-8 4h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Account",
    href: "/client/account",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function ClientShell({ children }: ClientShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<ClientWorkspace | null>(null);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyClient() {
      const result = await loadClientWorkspace();

      if (!active) {
        return;
      }

      if (!result.workspace) {
        setMessage(result.error || "Client portal access could not be verified.");
        setChecking(false);
        return;
      }

      setWorkspace(result.workspace);
      setChecking(false);
    }

    verifyClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (!session) {
        router.replace("/client-login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const displayName = useMemo(() => getClientDisplayName(workspace), [workspace]);
  const initials = useMemo(() => getClientInitials(workspace), [workspace]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/client-login");
  }

  if (checking) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full text-center">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <p className="mt-5 text-sm font-semibold text-slate-600">Verifying client portal access...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full">
            <p className="eyebrow text-rose-500">Client Access</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Client portal access could not be verified.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/client/activate" className="btn btn-primary">Activate account</Link>
              <button type="button" onClick={handleSignOut} className="btn btn-secondary">Sign out</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="cf-workspace cf-client-workspace min-h-screen">
      <div className="cf-workspace-shell">
        <aside className="cf-workspace-sidebar">
          <div className="cf-workspace-sidebar-inner">
            <Link href="/" className="cf-workspace-brand" aria-label="CivicFlow home">
              <CivicFlowLogo size="md" inverted />
            </Link>

            <div className="cf-workspace-firm-card">
              <p className="cf-workspace-kicker text-blue-200/70">Secure client portal</p>
              <p className="mt-2 text-base font-semibold text-white">{displayName}</p>
              <p className="mt-3 text-xs leading-5 text-slate-300">
                {workspace.caseCount} matter{workspace.caseCount === 1 ? "" : "s"} shared with this account.
              </p>
            </div>

            <nav className="cf-workspace-nav" aria-label="Client portal">
              <p className="cf-workspace-nav-label">Your workspace</p>
              {navigationItems.map((item) => {
                const active =
                  item.href === "/client"
                    ? pathname === "/client" || pathname.startsWith("/client/cases/")
                    : pathname.startsWith(item.href);

                return (
                  <div key={item.href}>
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
                  <p className="mt-0.5 truncate text-xs text-slate-400">{workspace.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="cf-workspace-profile-action mt-4 w-full"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </aside>

        <section className="cf-workspace-main">
          <header className="cf-workspace-topbar">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                CivicFlow client portal
              </p>
              <h1 className="cf-workspace-page-title mt-2">
                Your legal matters
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Only information your legal team has chosen to share with you appears here.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/client/account" className="btn btn-secondary">Account</Link>
              <div className="cf-workspace-avatar cf-workspace-avatar-light">{initials}</div>
            </div>
          </header>

          <div className="cf-workspace-content animate-fade-up">{children}</div>
        </section>
      </div>
    </main>
  );
}
