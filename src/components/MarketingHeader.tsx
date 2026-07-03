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
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-24 max-w-[1440px] items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-2xl transition hover:opacity-90"
          aria-label="CivicFlow home"
        >
          <CivicFlowLogo size="md" />
        </Link>

        <nav className="hidden rounded-full border border-slate-200 bg-slate-50 p-1 shadow-inner shadow-slate-200/60 lg:flex">
          {marketingNavItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-5 py-3 text-sm font-black transition ${
                  active
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                    : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/intake"
            className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 md:inline-flex"
          >
            Public intake
          </Link>

          {checkingSession ? (
            <div className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-500">
              Checking...
            </div>
          ) : isSignedIn ? (
            <>
              <Link
                href="/app"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Open app
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 xl:inline-flex"
              >
                Sign out
              </button>

              <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white md:flex">
                {getInitial(staffEmail)}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              Staff login
            </Link>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white/90 px-6 py-3 lg:hidden">
        <nav className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto rounded-full border border-slate-200 bg-slate-50 p-1 shadow-inner shadow-slate-200/60">
          {marketingNavItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-white hover:text-slate-950"
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