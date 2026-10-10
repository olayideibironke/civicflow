"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AuthLayout, { AuthChecking, AuthHeading } from "@/components/marketing/AuthLayout";
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
    let recoverySeen = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" && session) {
        recoverySeen = true;
        setHasRecoverySession(true);
        setCheckingSession(false);
        return;
      }

      if (event === "INITIAL_SESSION") {
        const currentUrl = new URL(window.location.href);
        const looksLikeRecoveryLink =
          currentUrl.hash.includes("type=recovery") ||
          currentUrl.searchParams.get("type") === "recovery" ||
          currentUrl.searchParams.has("code");

        if (!looksLikeRecoveryLink) {
          setHasRecoverySession(false);
          setCheckingSession(false);
        }
      }
    });

    const timeout = window.setTimeout(() => {
      if (!active || recoverySeen) {
        return;
      }

      setHasRecoverySession(false);
      setCheckingSession(false);
    }, 3000);

    return () => {
      active = false;
      window.clearTimeout(timeout);
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
    return <AuthChecking message="Checking reset link..." />;
  }

  return (
    <AuthLayout variant="security" topLink={{ label: "Login", href: "/login" }}>
      <AuthHeading eyebrow="Account security" title="Choose a new password" />

      {complete ? (
        <div className="mt-8">
          <div className="mk-alert mk-alert-success" role="status">
            Your password has been updated. Sign in again with your new password.
          </div>
          <Link href="/login" className="mk-btn mk-btn-primary mk-btn-lg mt-6 w-full">
            Return to login
          </Link>
        </div>
      ) : !hasRecoverySession ? (
        <div className="mt-8">
          <div className="mk-alert mk-alert-warn" role="alert">
            This reset link is missing, invalid, or expired. Request a new password reset email.
          </div>
          <Link href="/forgot-password" className="mk-btn mk-btn-primary mk-btn-lg mt-6 w-full">
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-9 grid gap-5">
          <label className="mk-label">
            New password
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
              className="mk-field"
            />
          </label>

          <label className="mk-label">
            Confirm new password
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
              className="mk-field"
            />
          </label>

          <p className="text-[0.82rem] text-slate-500">Use at least 12 characters. A longer passphrase is stronger.</p>

          {message ? (
            <div className="mk-alert mk-alert-error" role="alert">
              {message}
            </div>
          ) : null}

          <button type="submit" disabled={saving} className="mk-btn mk-btn-primary mk-btn-lg w-full">
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
