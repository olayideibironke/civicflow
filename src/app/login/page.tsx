"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { supabase } from "@/lib/supabase";
import {
  getFirstValidationError,
  validateRequiredEmail,
  validateRequiredText,
} from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirectPath, setRedirectPath] = useState("/app");
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedRedirect = params.get("redirectTo");

    if (requestedRedirect?.startsWith("/")) {
      setRedirectPath(requestedRedirect);
    }

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace(requestedRedirect?.startsWith("/") ? requestedRedirect : "/app");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  function validateForm() {
    return getFirstValidationError([
      validateRequiredEmail(email, "Staff email"),
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

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setSigningIn(false);
      setMessage(error.message);
      return;
    }

    router.replace(redirectPath);
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full text-center animate-fade-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>

            <p className="eyebrow mt-6">CivicFlow Auth</p>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Checking staff session…
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="premium-dark animate-fade-up lg:!p-10">
          <div className="w-fit rounded-2xl bg-white p-3.5 shadow-lg shadow-black/20">
            <CivicFlowLogo size="md" />
          </div>

          <p className="mt-10 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
            Staff Access
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white">
            Sign in to manage cases, documents, reports, and workflow activity.
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            Staff email and password are required before accessing the protected
            workspace.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Encrypted Supabase authentication",
              "Organization-scoped access control",
              "Full audit trail on every case",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                  <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                    <path d="m4 8 2.5 2.5L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </aside>

        <form
          onSubmit={handleLogin}
          noValidate
          className="premium-card animate-fade-up lg:!p-9"
        >
          <div className="border-b border-slate-100 pb-6">
            <p className="eyebrow">Staff Login</p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Sign in to CivicFlow.
            </h2>

            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600">
              Enter a valid staff email address and password to continue.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="input-label">
              Staff email *
              <input
                type="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage("");
                }}
                placeholder="staff@example.com"
                className="input-field"
              />
            </label>

            <label className="input-label">
              Password *
              <input
                type="password"
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
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              ← Back home
            </Link>

            <button
              type="submit"
              disabled={signingIn}
              className="btn btn-primary px-6 py-3"
            >
              {signingIn ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}