"use client";

import { useEffect } from "react";
import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";

type MarketingHeaderProps = {
  activePage?: "home" | "platform" | "pricing" | "mycase" | "clio" | "early-access";
};

const navItems = [
  { label: "Platform", href: "/platform", key: "platform" },
  { label: "Pricing", href: "/pricing", key: "pricing" },
  { label: "MyCase alternative", href: "/mycase-alternative", key: "mycase" },
  { label: "Clio alternative", href: "/clio-alternative", key: "clio" },
] as const;

export default function MarketingHeader({ activePage }: MarketingHeaderProps) {
  useEffect(() => {
    const landingKey = "civicflow_validation_landing";
    const referrerKey = "civicflow_validation_referrer";

    if (!window.sessionStorage.getItem(landingKey)) {
      const landing = `${window.location.pathname}${window.location.search}`;
      window.sessionStorage.setItem(landingKey, landing);
    }

    if (!window.sessionStorage.getItem(referrerKey)) {
      window.sessionStorage.setItem(
        referrerKey,
        document.referrer || "direct",
      );
    }
  }, []);

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

          <Link
            href="/early-access"
            className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 lg:hidden"
          >
            Early access
          </Link>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          <nav
            aria-label="Primary navigation"
            className="grid w-full grid-cols-2 gap-1 rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-1 shadow-sm sm:grid-cols-4 lg:w-auto"
          >
            {navItems.map((item) => {
              const isActive = activePage === item.key;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`min-w-0 rounded-2xl px-3 py-2.5 text-center text-xs font-black transition sm:text-sm ${
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

          <Link
            href="/early-access"
            className="hidden shrink-0 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 lg:inline-flex"
          >
            Join early access
          </Link>
        </div>
      </div>
    </header>
  );
}
