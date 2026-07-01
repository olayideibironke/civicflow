"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    label: "Public Intake",
    href: "/intake",
    icon: "✦",
  },
  {
    label: "Reports",
    href: "/app/reports",
    icon: "▲",
  },
];

function getInitials(email: string) {
  const cleanEmail = email.trim();

  if (!cleanEmail) {
    return "CF";
  }

  return cleanEmail.charAt(0).toUpperCase();
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [staffEmail, setStaffEmail] = useState("");
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

      setStaffEmail(session.user.email ?? "staff@civicflow.local");
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
        return;
      }

      setStaffEmail(session.user.email ?? "staff@civicflow.local");
      setCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const initials = useMemo(() => getInitials(staffEmail), [staffEmail]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
          <div className="premium-card w-full text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              CivicFlow Security
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Verifying staff access...
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Protected workspace pages require a signed-in staff user.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)]">
      <div className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="self-start rounded-[2rem] bg-white/85 p-6 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 backdrop-blur lg:sticky lg:top-8">
          <div className="rounded-[1.6rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-6 text-white shadow-xl shadow-blue-950/20">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-lg font-black text-slate-950">
                CF
              </div>

              <div>
                <p className="text-2xl font-black leading-none">CivicFlow</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-blue-100">
                  By Westforge
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-white/10 p-5 ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
                Active Workspace
              </p>

              <p className="mt-4 text-2xl font-black leading-tight">
                Community Services
              </p>

              <div className="mt-5 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <p className="text-sm font-bold text-slate-200">
                  Staff workspace protected
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-7 grid gap-3">
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

          <div className="mt-7 border-t border-slate-200 pt-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {staffEmail}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Signed in staff user
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

          <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-black text-slate-950">
                Build status
              </p>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                MVP
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              CivicFlow now has authenticated staff access, Supabase cases,
              public intake, document storage, reports, charts, and Excel
              exports.
            </p>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <header className="rounded-[2rem] bg-white/85 px-6 py-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                  Westforge SaaS Workspace
                </p>

                <p className="mt-2 text-base font-black text-slate-800">
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