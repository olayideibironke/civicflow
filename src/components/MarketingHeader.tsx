"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { Icon, type IconName } from "@/components/marketing/ui";
import { supabase } from "@/lib/supabase";

type MarketingHeaderProps = {
  activePage?:
    | "home"
    | "platform"
    | "pricing"
    | "use-cases"
    | "practice-management"
    | "security"
    | "get-started";
};

type MenuLink = {
  label: string;
  href: string;
  description: string;
  icon: IconName;
};

type MenuGroup = {
  key: "product" | "solutions";
  label: string;
  activeKeys: string[];
  links: MenuLink[];
  footer: { label: string; href: string };
};

const menus: MenuGroup[] = [
  {
    key: "product",
    label: "Product",
    activeKeys: ["platform"],
    links: [
      {
        label: "Client intake",
        href: "/platform#intake",
        description: "A branded intake link that opens a matter automatically.",
        icon: "intake",
      },
      {
        label: "Matter management",
        href: "/platform#matters",
        description: "Status, assignment, notes and follow-ups on one record.",
        icon: "matter",
      },
      {
        label: "Documents and activity",
        href: "/platform#documents",
        description: "Checklists, private file storage and a case timeline.",
        icon: "document",
      },
      {
        label: "Client portal",
        href: "/platform#client-portal",
        description: "Invite clients and share only what you choose.",
        icon: "client",
      },
      {
        label: "Reporting and exports",
        href: "/platform#reporting",
        description: "Workload, follow-ups and gaps, with Excel export.",
        icon: "report",
      },
      {
        label: "Firm administration",
        href: "/platform#administration",
        description: "Matter types, intake controls and firm settings.",
        icon: "settings",
      },
    ],
    footer: { label: "Explore the platform", href: "/platform" },
  },
  {
    key: "solutions",
    label: "Solutions",
    activeKeys: ["use-cases", "practice-management"],
    links: [
      {
        label: "By practice area",
        href: "/use-cases#practice-areas",
        description: "Family, immigration, criminal defense, civil litigation.",
        icon: "building",
      },
      {
        label: "By firm size",
        href: "/use-cases#firm-size",
        description: "From solo practitioners to growing multi-attorney teams.",
        icon: "users",
      },
      {
        label: "Legal practice management",
        href: "/legal-practice-management",
        description: "How CivicFlow runs the operating side of a firm.",
        icon: "activity",
      },
    ],
    footer: { label: "See all use cases", href: "/use-cases" },
  },
];

const directLinks = [
  { label: "Pricing", href: "/pricing", key: "pricing" },
  { label: "Security", href: "/security", key: "security" },
] as const;

export default function MarketingHeader({ activePage }: MarketingHeaderProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuGroup["key"] | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

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

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    function onPointer(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setIsSignedIn(false);
    setSigningOut(false);
  }

  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140);
  }

  function cancelClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }

  const elevated = scrolled || openMenu !== null;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        elevated
          ? "border-line bg-ivory/95 backdrop-blur-md"
          : "border-transparent bg-ivory"
      }`}
    >
      <div
        ref={navRef}
        className="mk-container relative flex h-[68px] items-center justify-between gap-6"
      >
        <Link
          href="/"
          className="mk-focus shrink-0 rounded-lg transition hover:opacity-90"
          aria-label="CivicFlow home"
        >
          <CivicFlowLogo size="sm" />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden flex-1 items-center gap-1 lg:flex"
        >
          {menus.map((menu) => {
            const isOpen = openMenu === menu.key;
            const isActive = activePage
              ? menu.activeKeys.includes(activePage)
              : false;
            return (
              <div
                key={menu.key}
                onMouseEnter={() => {
                  cancelClose();
                  setOpenMenu(menu.key);
                }}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`menu-${menu.key}`}
                  onClick={() => setOpenMenu(isOpen ? null : menu.key)}
                  className={`mk-focus flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.9rem] font-medium transition ${
                    isActive || isOpen
                      ? "text-ink"
                      : "text-slate-600 hover:text-ink"
                  }`}
                >
                  {menu.label}
                  <svg
                    viewBox="0 0 12 12"
                    className={`h-2.5 w-2.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div
                  id={`menu-${menu.key}`}
                  data-open={isOpen}
                  className="mk-menu absolute left-1/2 top-[calc(100%-6px)] w-[min(760px,calc(100vw-3rem))] -translate-x-1/2 pt-2"
                >
                  <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-20px_rgba(8,18,42,0.28)]">
                    <div className="grid gap-1 p-3 sm:grid-cols-2">
                      {menu.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpenMenu(null)}
                          className="mk-focus group flex gap-3.5 rounded-xl p-3 transition hover:bg-porcelain"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-navy transition group-hover:border-cobalt/30 group-hover:text-cobalt">
                            <Icon name={link.icon} className="h-[17px] w-[17px]" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-ink">
                              {link.label}
                            </span>
                            <span className="mt-0.5 block text-[0.8rem] leading-5 text-slate-500">
                              {link.description}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-line bg-porcelain px-6 py-3.5">
                      <span className="text-[0.8rem] text-slate-500">
                        Plans from $30 per user per month
                      </span>
                      <Link
                        href={menu.footer.href}
                        onClick={() => setOpenMenu(null)}
                        className="mk-link text-[0.85rem]"
                      >
                        {menu.footer.label}
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mk-arrow h-3.5 w-3.5">
                          <path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {directLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activePage === item.key ? "page" : undefined}
              className={`mk-focus rounded-lg px-3 py-2 text-[0.9rem] font-medium transition ${
                activePage === item.key
                  ? "text-ink"
                  : "text-slate-600 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            {checkingSession ? (
              <span className="px-3 text-sm text-slate-400" aria-live="polite">
                &nbsp;
              </span>
            ) : isSignedIn ? (
              <>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="mk-focus rounded-lg px-3 py-2 text-[0.9rem] font-medium text-slate-600 transition hover:text-ink disabled:opacity-60"
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
                <Link href="/login" className="mk-btn mk-btn-outline mk-btn-sm">
                  Workspace
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="mk-focus rounded-lg px-3 py-2 text-[0.9rem] font-medium text-slate-600 transition hover:text-ink"
              >
                Log in
              </Link>
            )}
          </div>

          <Link href="/get-started" className="mk-btn mk-btn-primary mk-btn-sm">
            Get started
          </Link>

          <button
            type="button"
            className="mk-focus -mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[68px] z-40 overflow-y-auto border-t border-line bg-ivory lg:hidden"
        >
          <div className="mk-container py-6">
            {menus.map((menu) => (
              <div key={menu.key} className="border-b border-line pb-5 pt-1 [&+div]:pt-5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {menu.label}
                </p>
                <div className="mt-3 grid gap-1 sm:grid-cols-2">
                  {menu.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg py-2.5 text-[0.98rem] font-medium text-ink"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-navy">
                        <Icon name={link.icon} className="h-4 w-4" />
                      </span>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid border-b border-line py-2">
              {directLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-[1.05rem] font-semibold text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="mk-btn mk-btn-outline mk-btn-lg"
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              ) : null}
              <Link href="/login" className="mk-btn mk-btn-outline mk-btn-lg">
                {isSignedIn ? "Open workspace" : "Log in"}
              </Link>
              <Link href="/get-started" className="mk-btn mk-btn-primary mk-btn-lg">
                Get started
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Plans from $30 per user per month.
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
