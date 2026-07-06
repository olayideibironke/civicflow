"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { supabase } from "@/lib/supabase";

const marketingNavItems = [
  {
    label: "Platform",
    href: "/platform",
  },
  {
    label: "Use cases",
    href: "/use-cases",
  },
  {
    label: "Request Demo",
    href: "/request-demo",
  },
];

function getInitial(email: string) {
  const initial = email.trim().charAt(0).toUpperCase();
  return initial || "CF";
}

export default function MarketingHeader() {
  const pathname = usePathname();

  const [checkingSession, setCheckingSession] = useState(true);
  const [staffEmail, setStaffEmail] = useState("");

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setStaffEmail(session?.user.email ?? "");
      setCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setStaffEmail(session?.user.email ?? "");
      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setStaffEmail("");
  }

  const isSignedIn = Boolean(staffEmail);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-6 px-6 py-3.5">
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-xl transition hover:opacity-90"
          aria-label="CivicFlow home"
        >
          <CivicFlowLogo size="md" />
        </Link>

        <nav className="hidden rounded-full border border-slate-200/80 bg-slate-50/80 p-1 lg:flex">
          {marketingNavItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/intake"
            className="btn btn-secondary hidden md:inline-flex"
          >
            Public intake
          </Link>

          {checkingSession ? (
            <div className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500">
              Checking…
            </div>
          ) : isSignedIn ? (
            <>
              <Link href="/app" className="btn btn-primary">
                Open app
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn-secondary hidden xl:inline-flex"
              >
                Sign out
              </button>

              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-semibold text-white ring-1 ring-white/10 md:flex">
                {getInitial(staffEmail)}
              </div>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Staff login
            </Link>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white/80 px-6 py-2.5 lg:hidden">
        <nav className="mx-auto flex max-w-[1440px] gap-1.5 overflow-x-auto rounded-full border border-slate-200/80 bg-slate-50/80 p-1">
          {marketingNavItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}