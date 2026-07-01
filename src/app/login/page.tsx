"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Enter your staff email and password.");
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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-6 py-8">
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#f8fafc_100%)] px-6 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="premium-dark">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-xl font-black text-slate-950">
              CF
            </div>

            <div>
              <p className="text-2xl font-black leading-none text-white">
                CivicFlow
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-blue-100">
                By Westforge
              </p>
            </div>
          </div>

          <p className="mt-10 text-xs font-black uppercase tracking-[0.3em] text-blue-100">
            Staff Access
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white">
            Sign in to manage cases, documents, reports, and workflow activity.
          </h1>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            Public intake remains open to clients, while internal staff tools
            are controlled through Supabase Auth.
          </p>
        </aside>

        <form onSubmit={handleLogin} className="premium-card">
          <div className="border-b border-slate-100 pb-6">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              Staff Login
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Sign in to CivicFlow.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Use the staff account created inside Supabase Authentication.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="input-label">
              Staff email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage("");
                }}
                placeholder="staff@example.com"
                className="input-field"
                required
              />
            </label>

            <label className="input-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setMessage("");
                }}
                placeholder="Enter password"
                className="input-field"
                required
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