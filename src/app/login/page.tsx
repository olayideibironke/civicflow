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

      if (!active) return;

      if (!session) {
        setCheckingSession(false);
        return;
      }

      const staff = await loadStaffWorkspace();
      if (!active) return;

      if (staff.workspace) {
        router.replace("/app");
        return;
      }

      const client = await loadClientWorkspace();
      if (!active) return;

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
      <main className="min-h-screen bg-slate-50 px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <p className="mt-5 text-sm font-semibold text-slate-600">Checking your account...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="transition hover:opacity-90">
            <CivicFlowLogo size="md" />
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back home
          </Link>
        </div>

        <div className="mx-auto mt-14 max-w-3xl text-center sm:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CivicFlow Login</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Choose how you use CivicFlow.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Attorneys and firm staff use the firm workspace. Clients use a separate portal after their attorney or law firm has invited them.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
          <Link
            href="/attorney-login"
            className="group border-b border-slate-200 p-7 transition hover:bg-slate-50 md:border-b-0 md:border-r sm:p-9"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">For legal teams</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
              Attorney & Firm Login
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Open your firm workspace for matters, documents, reports, staff activity, and client portal controls.
            </p>
            <span className="mt-7 inline-flex text-sm font-semibold text-slate-950">
              Continue to firm login <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
            </span>
          </Link>

          <Link
            href="/client-login"
            className="group p-7 transition hover:bg-slate-50 sm:p-9"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">For clients</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
              Client Login
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Sign in after your attorney or law firm has sent you an invitation and you have completed account setup.
            </p>
            <span className="mt-7 inline-flex text-sm font-semibold text-slate-950">
              Continue to client login <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        </div>

        <div className="mx-auto mt-7 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
          <Link href="/forgot-password" className="hover:text-slate-950">
            Forgot password?
          </Link>
          <Link href="/forgot-email" className="hover:text-slate-950">
            Forgot email?
          </Link>
        </div>
      </section>
    </main>
  );
}
