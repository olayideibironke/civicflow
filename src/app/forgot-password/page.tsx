"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { supabase } from "@/lib/supabase";
import { validateRequiredEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateRequiredEmail(email);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setSending(true);
    setMessage("");

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setSending(false);

    if (error) {
      setMessage(
        error.message.toLowerCase().includes("rate")
          ? "Too many reset attempts. Please wait a few minutes and try again."
          : "We could not send the reset email right now. Please try again."
      );
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="rounded-2xl transition hover:opacity-90">
            <CivicFlowLogo size="md" />
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Back to login
          </Link>
        </div>

        <div className="premium-card mx-auto mt-12 max-w-xl sm:mt-16">
          <p className="eyebrow">Password Recovery</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Reset your password.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Enter the email address connected to your CivicFlow account. If an account exists, we will send password reset instructions to that address.
          </p>

          {sent ? (
            <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
              Check your inbox for the password reset message. For privacy, CivicFlow does not confirm whether a specific email address is registered.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-7">
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

              {message ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={sending}
                className="btn btn-primary mt-6 w-full py-3"
              >
                {sending ? "Sending..." : "Send reset email"}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
            Do not remember the email address?{" "}
            <Link href="/forgot-email" className="font-semibold text-slate-950 underline underline-offset-4">
              Start account recovery
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
