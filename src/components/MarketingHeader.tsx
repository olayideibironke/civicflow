"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { supabase } from "@/lib/supabase";

type MarketingHeaderProps = {
  activePage?:
    | "home"
    | "platform"
    | "pricing"
    | "use-cases"
    | "practice-management"
    | "get-started";
};

const navItems = [
  { label: "Platform", href: "/platform", key: "platform" },
  { label: "Pricing", href: "/pricing", key: "pricing" },
  { label: "Use cases", href: "/use-cases", key: "use-cases" },
  {
    label: "Practice management",
    href: "/legal-practice-management",
    key: "practice-management",
  },
] as const;

export default function MarketingHeader({ activePage }: MarketingHeaderProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const landingKey = "civicflow_landing";
    const referrerKey = "civicflow_referrer";

    if (!window.sessionStorage.getItem(landingKey)) {
      window.sessionStorage.setItem(
        landingKey,
        `${window.location.pathname}${window.location.search}`,
      );
    }

    if (!window.sessionStorage.getItem(referrerKey)) {
      window.sessionStorage.setItem(
        referrerKey,
        document.referrer || "direct",
      );
    }

    let active = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setIsSignedIn(Boolean(session));
      setCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsSignedIn(Boolean(session));
      setCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setIsSignedIn(false);
    setSigningOut(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-6 px-5 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 transition hover:opacity-90"
          aria-label="CivicFlow home"
        >
          <CivicFlowLogo size="md" />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {navItems.map((item) => {
            const isActive = activePage === item.key;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition ${
                  isActive
                    ? "text-slate-950"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          {checkingSession ? (
            <span className="hidden text-sm font-semibold text-slate-400 sm:inline">
              Checking account...
            </span>
          ) : isSignedIn ? (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Workspace
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="hidden rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-950 disabled:opacity-60 sm:inline-flex"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Login
            </Link>
          )}

          <Link
            href="/get-started"
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Get started
          </Link>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex gap-5 overflow-x-auto border-t border-slate-100 px-5 py-3 text-sm font-semibold text-slate-500 lg:hidden"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap transition ${
              activePage === item.key
                ? "text-slate-950"
                : "hover:text-slate-950"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
