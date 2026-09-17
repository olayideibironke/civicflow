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
    <main className="min-h-screen">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-8">
        <aside className="self-start rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[var(--shadow-md)] backdrop-blur lg:sticky lg:top-8">
          <Link href="/" className="flex items-center rounded-xl px-2 py-1.5 transition hover:opacity-90" aria-label="CivicFlow home">
            <CivicFlowLogo size="md" />
          </Link>

          <div className="premium-dark mt-4 !rounded-xl !p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blue-200/80">Client Portal</p>
            <p className="mt-2.5 text-lg font-bold leading-tight text-white">{displayName}</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              {workspace.caseCount} matter{workspace.caseCount === 1 ? "" : "s"} connected to this account
            </p>
          </div>

          <nav className="mt-5 grid gap-1">
            {navigationItems.map((item) => {
              const active = item.href === "/client" ? pathname === "/client" || pathname.startsWith("/client/cases/") : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  {active ? <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-400" /> : null}
                  <span className={active ? "text-blue-300" : "text-slate-400"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 border-t border-slate-200/80 pt-5">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">{initials}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{workspace.email}</p>
                </div>
              </div>
              <button type="button" onClick={handleSignOut} disabled={signingOut} className="btn btn-secondary mt-3.5 w-full">
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 shadow-[var(--shadow-sm)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Secure Client Portal</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Only information your legal team shares with you appears here.</p>
            </div>
            <Link href="/client/account" className="btn btn-secondary">Account settings</Link>
          </header>
          <div className="animate-fade-up">{children}</div>
        </section>
      </div>
    </main>
  );
}
