"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  {
    label: "Overview",
    href: "/app",
    icon: "◆",
    match: (pathname: string) => pathname === "/app",
  },
  {
    label: "Cases",
    href: "/app/cases",
    icon: "●",
    match: (pathname: string) => pathname.startsWith("/app/cases"),
  },
  {
    label: "Public Intake",
    href: "/intake",
    icon: "✦",
    match: (pathname: string) => pathname.startsWith("/intake"),
  },
  {
    label: "Reports",
    href: "/app/reports",
    icon: "▲",
    match: (pathname: string) => pathname.startsWith("/app/reports"),
  },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)]">
      <div className="mx-auto grid max-w-[1680px] gap-6 px-5 py-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-7">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="premium-card p-0">
            <div className="premium-dark">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
                  CF
                </div>

                <div>
                  <p className="text-2xl font-black leading-none tracking-tight">
                    CivicFlow
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.34em] text-blue-100">
                    by Westforge
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
                  Active Workspace
                </p>
                <p className="mt-4 text-2xl font-black leading-tight text-white">
                  Community Services
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-slate-200">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Demo organization online
                </div>
              </div>
            </div>

            <nav className="space-y-2 p-4">
              {navigation.map((item) => {
                const active = item.match(pathname);

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
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xs ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 p-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-black text-slate-950">
                    Build status
                  </p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                    MVP
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  CivicFlow is being shaped into a premium workflow SaaS for
                  intake, cases, documents, staff assignment, and reporting.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <header className="premium-card flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-slate-400">
                Westforge SaaS Workspace
              </p>
              <p className="mt-2 text-sm font-black text-slate-700">
                Intake, documents, case management, and reporting
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/intake"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Public intake
              </Link>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/20">
                OI
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}