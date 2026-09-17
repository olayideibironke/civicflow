"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { loadClientWorkspace } from "@/lib/clientWorkspace";
import { supabase } from "@/lib/supabase";
import { loadStaffWorkspace } from "@/lib/workspace";

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function routeExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session) {
        setCheckingSession(false);
        return;
      }

      const staff = await loadStaffWorkspace();

      if (!active) {
        return;
      }

      if (staff.workspace) {
        router.replace("/app");
        return;
      }

      const client = await loadClientWorkspace();

      if (!active) {
        return;
      }

      if (client.workspace) {
        router.replace("/client");
        return;
      }

      setCheckingSession(false);
    }

    routeExistingSession();

    return () => {
      active = false;
    };
  }, [router]);

  if (checkingSession) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full text-center animate-fade-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
            <p className="eyebrow mt-6">CivicFlow Access</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Checking your account...
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="rounded-2xl transition hover:opacity-90">
            <CivicFlowLogo size="md" />
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back home
          </Link>
        </div>

        <div className="mx-auto mt-12 max-w-4xl text-center sm:mt-16">
          <p className="eyebrow">Secure Sign In</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Choose your CivicFlow portal.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Firm users and clients enter separate protected workspaces so each account only reaches the information it is authorized to use.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <Link
            href="/attorney-login"
            className="premium-card group block transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M5 20h14M7 20V9h10v11M9 9V6h6v3M10 13h4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="eyebrow mt-6">For legal teams</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
              Attorney & Firm Login
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Access cases, documents, reports, client portal controls, and firm settings.
            </p>
            <span className="mt-6 inline-flex text-sm font-bold text-slate-950">
              Open firm login →
            </span>
          </Link>

          <Link
            href="/client-login"
            className="premium-card group block transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="eyebrow mt-6">For clients</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
              Client Login
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              View the matters, updates, and documents your legal team has shared with you.
            </p>
            <span className="mt-6 inline-flex text-sm font-bold text-slate-950">
              Open client login →
            </span>
          </Link>
        </div>

        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
          <Link href="/forgot-password" className="hover:text-slate-950">
            Forgot password?
          </Link>
          <Link href="/forgot-email" className="hover:text-slate-950">
            Forgot email?
          </Link>
          <Link href="/client/activate" className="hover:text-slate-950">
            Activate client account
          </Link>
        </div>
      </section>
    </main>
  );
}
