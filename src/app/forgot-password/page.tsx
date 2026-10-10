"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import AuthLayout, { AuthHeading } from "@/components/marketing/AuthLayout";
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
    <AuthLayout variant="security" topLink={{ label: "Back to login", href: "/login" }}>
      <AuthHeading
        eyebrow="Password recovery"
        title="Reset your password"
        description="Enter the email address connected to your CivicFlow account. If an account exists, we will send password reset instructions to that address."
      />

      {sent ? (
        <div className="mk-alert mk-alert-success mt-8" role="status">
          Check your inbox for the password reset message. For privacy, CivicFlow does not confirm whether a specific email address is registered.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-9">
          <label className="mk-label">
            Email address
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
              className="mk-field"
            />
          </label>

          {message ? (
            <div className="mk-alert mk-alert-error mt-5" role="alert">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="mk-btn mk-btn-primary mk-btn-lg mt-7 w-full"
          >
            {sending ? "Sending..." : "Send reset email"}
          </button>
        </form>
      )}

      <div className="mt-8 border-t border-line pt-6 text-sm text-slate-600">
        Do not remember the email address?{" "}
        <Link href="/forgot-email" className="font-semibold text-ink hover:text-cobalt">
          Start account recovery
        </Link>
      </div>
    </AuthLayout>
  );
}
