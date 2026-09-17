"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { loadClientWorkspace } from "@/lib/clientWorkspace";
import { supabase } from "@/lib/supabase";
import {
  getFirstValidationError,
  validateRequiredEmail,
  validateRequiredText,
} from "@/lib/validation";
import { loadStaffWorkspace } from "@/lib/workspace";

type PortalType = "attorney" | "client";

type AuthPortalLoginProps = {
  portal: PortalType;
};

export default function AuthPortalLogin({ portal }: AuthPortalLoginProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState("");
  const [destination, setDestination] = useState(
    portal === "attorney" ? "/app" : "/client"
  );

  const isAttorney = portal === "attorney";
  const portalLabel = isAttorney ? "Attorney & Firm Login" : "Client Login";

  async function verifyPortalAccess() {
    if (isAttorney) {
      return loadStaffWorkspace();
    }

    return loadClientWorkspace();
  }

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const requestedRedirect = params.get("redirectTo");
    const portalRoot = isAttorney ? "/app" : "/client";
    const safeRedirect =
      requestedRedirect?.startsWith(portalRoot) &&
      !requestedRedirect.startsWith("//")
        ? requestedRedirect
        : portalRoot;

    setDestination(safeRedirect);

    async function checkSession() {
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

      const access = await verifyPortalAccess();

      if (!active) {
        return;
      }

      if (access.workspace) {
        router.replace(safeRedirect);
        return;
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAttorney, router]);

  function validateForm() {
    return getFirstValidationError([
      validateRequiredEmail(email),
      validateRequiredText(password, "Password"),
    ]);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setSigningIn(true);
    setMessage("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setSigningIn(false);
      setMessage("Email or password is incorrect.");
      return;
    }

    const access = await verifyPortalAccess();

    if (!access.workspace) {
      await supabase.auth.signOut();
      setSigningIn(false);
      setMessage(
        isAttorney
          ? "This account does not have attorney or firm workspace access. If this is a client account, use Client Login."
          : "This account does not have client portal access. If you received an invitation, activate your client account first."
      );
      return;
    }

    router.replace(destination);
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full text-center animate-fade-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
            <p className="eyebrow mt-6">CivicFlow Security</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Checking account access...
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="premium-dark animate-fade-up lg:!p-10">
          <div className="w-fit rounded-2xl bg-white p-3.5 shadow-lg shadow-black/20">
            <CivicFlowLogo size="md" />
          </div>

          <p className="mt-10 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
            {portalLabel}
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white">
            {isAttorney
              ? "Your firm workspace, cases, documents, reports, and client access in one place."
              : "Secure access to the matters and documents your legal team has shared with you."}
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            {isAttorney
              ? "Only authorized firm users can enter the attorney workspace. Client accounts are kept separate."
              : "Client access is limited to matters connected to your verified CivicFlow account."}
          </p>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-slate-300">
            Looking for the other portal?{" "}
            <Link
              href={isAttorney ? "/client-login" : "/attorney-login"}
              className="font-semibold text-white underline underline-offset-4"
            >
              {isAttorney ? "Client Login" : "Attorney & Firm Login"}
            </Link>
          </div>
        </aside>

        <form
          onSubmit={handleLogin}
          noValidate
          className="premium-card animate-fade-up lg:!p-9"
        >
          <div className="border-b border-slate-100 pb-6">
            <p className="eyebrow">{portalLabel}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Sign in to CivicFlow.
            </h2>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600">
              Enter the email address and password connected to your account.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="input-label">
              Email address *
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage("");
                }}
                placeholder="name@example.com"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Password *
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setMessage("");
                }}
                placeholder="Enter password"
                className="input-field"
              />
            </label>
          </div>

          {message ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
              {message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold">
            <Link
              href={`/forgot-password?type=${portal}`}
              className="text-slate-700 transition hover:text-slate-950"
            >
              Forgot password?
            </Link>
            <Link
              href={`/forgot-email?type=${portal}`}
              className="text-slate-700 transition hover:text-slate-950"
            >
              Forgot email?
            </Link>
            {!isAttorney ? (
              <Link
                href="/client/activate"
                className="text-slate-700 transition hover:text-slate-950"
              >
                Activate client account
              </Link>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              ← Choose another portal
            </Link>

            <button
              type="submit"
              disabled={signingIn}
              className="btn btn-primary px-6 py-3"
            >
              {signingIn ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
