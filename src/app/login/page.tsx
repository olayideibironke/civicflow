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
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
          <div className="premium-card w-full text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              CivicFlow Auth
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Checking staff session...
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] px-6 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-950/20">
          <div className="w-fit rounded-3xl bg-white p-4 shadow-xl shadow-blue-950/20">
            <CivicFlowLogo size="md" />
          </div>

          <p className="mt-10 text-xs font-black uppercase tracking-[0.3em] text-blue-100">
            Staff Access
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
            Sign in to manage cases, documents, reports, and workflow activity.
          </h1>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            Staff email and password are required before accessing the protected
            workspace.
          </p>
        </aside>

        <form
          onSubmit={handleLogin}
          noValidate
          className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-slate-200/70 backdrop-blur"
        >
          <div className="border-b border-slate-100 pb-6">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              Staff Login
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Sign in to CivicFlow.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
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
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
              {message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-sm font-black text-slate-500 transition hover:text-slate-950"
            >
              Back home
            </Link>

            <button
              type="submit"
              disabled={signingIn}
              className={`rounded-2xl px-6 py-3 text-sm font-black shadow-lg transition ${
                signingIn
                  ? "bg-slate-300 text-slate-600 shadow-none"
                  : "bg-slate-950 text-white shadow-slate-950/15 hover:bg-slate-800"
              } disabled:cursor-not-allowed`}
            >
              {signingIn ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}