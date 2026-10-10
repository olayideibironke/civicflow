"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { AuthChecking } from "@/components/marketing/AuthLayout";
import { ClientPortalScreen, DocumentChecklist } from "@/components/marketing/product";
import { Arrow } from "@/components/marketing/ui";
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
    return <AuthChecking message="Checking your account..." />;
  }

  return (
    <main className="mk relative min-h-screen overflow-hidden">
      <div className="mk-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
      <div className="mk-container relative flex h-[72px] items-center justify-between">
        <Link href="/" className="mk-focus rounded-lg transition hover:opacity-90" aria-label="CivicFlow home">
          <CivicFlowLogo size="sm" />
        </Link>
        <Link href="/" className="mk-btn mk-btn-outline mk-btn-sm">
          Back home
        </Link>
      </div>

      <section className="mk-container relative pb-20 pt-12 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mk-eyebrow justify-center">Sign in</p>
          <h1 className="mk-h2 mt-5 text-ink">Choose how you use CivicFlow.</h1>
          <p className="mk-lead mx-auto mt-5 max-w-xl">
            Attorneys and firm staff use the firm workspace. Clients use a separate portal after their law firm has invited them.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          <Link
            href="/attorney-login"
            className="mk-focus group flex flex-col overflow-hidden rounded-[18px] border border-line bg-white transition hover:border-line-strong hover:shadow-[0_24px_50px_-28px_rgba(8,18,42,0.35)]"
          >
            <div className="mk-dark relative h-44 overflow-hidden px-6 pt-6">
              <div className="mk-dark-grid absolute inset-0 opacity-60" aria-hidden="true" />
              <div className="mk-frame-float mk-ui relative mx-auto w-full max-w-[300px] translate-y-1 overflow-hidden transition duration-300 group-hover:-translate-y-0.5" aria-hidden="true">
                <DocumentChecklist compact />
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7 sm:p-8">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">For legal teams</p>
              <h2 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-ink">Attorney &amp; Firm Login</h2>
              <p className="mt-3 text-[0.95rem] leading-7 text-slate-600">
                Open your firm workspace for matters, documents, reports, staff activity and client portal controls.
              </p>
              <span className="mk-link mt-auto pt-7 text-sm">
                Continue to firm login <Arrow />
              </span>
            </div>
          </Link>

          <Link
            href="/client-login"
            className="mk-focus group flex flex-col overflow-hidden rounded-[18px] border border-line bg-white transition hover:border-line-strong hover:shadow-[0_24px_50px_-28px_rgba(8,18,42,0.35)]"
          >
            <div className="relative h-44 overflow-hidden bg-porcelain px-6 pt-6">
              <div className="mk-hairline-grid absolute inset-0" aria-hidden="true" />
              <div className="mk-frame-float mk-ui @container relative mx-auto w-full max-w-[300px] translate-y-1 overflow-hidden transition duration-300 group-hover:-translate-y-0.5" aria-hidden="true">
                <ClientPortalScreen />
              </div>
            </div>
            <div className="flex flex-1 flex-col p-7 sm:p-8">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">For clients</p>
              <h2 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-ink">Client Login</h2>
              <p className="mt-3 text-[0.95rem] leading-7 text-slate-600">
                Sign in after your attorney or law firm has sent you an invitation and you have completed account setup.
              </p>
              <span className="mk-link mt-auto pt-7 text-sm">
                Continue to client login <Arrow />
              </span>
            </div>
          </Link>
        </div>

        <div className="mx-auto mt-9 flex max-w-4xl flex-wrap justify-center gap-x-7 gap-y-3 text-sm font-medium text-slate-600">
          <Link href="/forgot-password" className="hover:text-ink">
            Forgot password?
          </Link>
          <Link href="/forgot-email" className="hover:text-ink">
            Forgot email?
          </Link>
          <Link href="/security" className="hover:text-ink">
            How we protect your account
          </Link>
        </div>
      </section>
    </main>
  );
}
