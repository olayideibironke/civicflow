"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setHasRecoverySession(Boolean(session));
      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 12) {
      setMessage("Password must be at least 12 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setSaving(false);
      setMessage(error.message);
      return;
    }

    await supabase.auth.signOut();
    setSaving(false);
    setComplete(true);
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full text-center">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <p className="mt-5 text-sm font-semibold text-slate-600">Checking reset link...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="rounded-2xl transition hover:opacity-90">
            <CivicFlowLogo size="md" />
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Login
          </Link>
        </div>

        <div className="premium-card mx-auto mt-12 max-w-xl sm:mt-16">
          <p className="eyebrow">Account Security</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Choose a new password.
          </h1>

          {complete ? (
            <div className="mt-7">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
                Your password has been updated. Sign in again with your new password.
              </div>
              <Link href="/login" className="btn btn-primary mt-6 w-full py-3">
                Return to login
              </Link>
            </div>
          ) : !hasRecoverySession ? (
            <div className="mt-7">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                This reset link is missing, invalid, or expired. Request a new password reset email.
              </div>
              <Link href="/forgot-password" className="btn btn-primary mt-6 w-full py-3">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-7 grid gap-5">
              <label className="input-label">
                New password *
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setMessage("");
                  }}
                  placeholder="At least 12 characters"
                  className="input-field"
                />
              </label>

              <label className="input-label">
                Confirm new password *
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setMessage("");
                  }}
                  placeholder="Re-enter new password"
                  className="input-field"
                />
              </label>

              {message ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {message}
                </div>
              ) : null}

              <button type="submit" disabled={saving} className="btn btn-primary py-3">
                {saving ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
