"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { supabase } from "@/lib/supabase";

type MarketingHeaderProps = {
  activePage?: "home" | "platform" | "use-cases" | "request-demo";
};

const navItems = [
  {
    label: "Platform",
    href: "/platform",
    key: "platform",
  },
  {
    label: "Use cases",
    href: "/use-cases",
    key: "use-cases",
  },
  {
    label: "Request Demo",
    href: "/request-demo",
    key: "request-demo",
  },
] as const;

export default function MarketingHeader({ activePage }: MarketingHeaderProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setIsSignedIn(Boolean(data.session));
      setCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
      setCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsSignedIn(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/92 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link
            href="/"
            className="min-w-0 shrink-0 rounded-2xl transition hover:opacity-90"
            aria-label="CivicFlow home"
          >
            <CivicFlowLogo size="md" />
          </Link>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <Link
              href="/intake/community-services"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Intake
            </Link>

            <Link
              href={isSignedIn ? "/app" : "/login"}
              className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              {checkingSession ? "App" : isSignedIn ? "App" : "Login"}
            </Link>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          <nav
            aria-label="Primary navigation"
            className="grid w-full grid-cols-3 rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-1 shadow-sm lg:w-auto lg:min-w-[430px]"
          >
            {navItems.map((item) => {
              const isActive = activePage === item.key;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`min-w-0 rounded-2xl px-2 py-2.5 text-center text-xs font-black transition sm:text-sm ${
                    isActive
                      ? "bg-white text-slate-950 shadow-md shadow-slate-200/80"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              href="/intake/community-services"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Public intake
            </Link>

            <Link
              href={isSignedIn ? "/app" : "/login"}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
            >
              {checkingSession ? "Open app" : isSignedIn ? "Open app" : "Staff login"}
            </Link>

            {isSignedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}