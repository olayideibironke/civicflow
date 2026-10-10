"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout, { AuthChecking, AuthHeading } from "@/components/marketing/AuthLayout";
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

      if (!active) return;

      if (!session) {
        setCheckingSession(false);
        return;
      }

      const access = await verifyPortalAccess();
      if (!active) return;

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
          : "This account does not have client portal access. Client accounts are created from a secure invitation sent by your law firm."
      );
      return;
    }

    router.replace(destination);
  }

  if (checkingSession) {
    return <AuthChecking message="Checking account access..." />;
  }

  return (
    <AuthLayout
      variant={isAttorney ? "staff" : "client"}
      topLink={{ label: "Choose another portal", href: "/login" }}
    >
      <AuthHeading
        eyebrow={portalLabel}
        title={isAttorney ? "Sign in to your firm workspace" : "Sign in to your client portal"}
        description={
          isAttorney
            ? "Authorized attorneys and staff can access matters, documents, reports and client portal controls."
            : "Use the email and password you created from your law firm's secure invitation."
        }
      />

      <form onSubmit={handleLogin} noValidate className="mt-9">
        <div className="grid gap-5">
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

          <label className="mk-label">
            <span className="flex items-center justify-between">
              Password
              <Link
                href={`/forgot-password?type=${portal}`}
                className="text-[0.8rem] font-medium text-cobalt hover:underline"
              >
                Forgot password?
              </Link>
            </span>
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
              className="mk-field"
            />
          </label>
        </div>

        {message ? (
          <div className="mk-alert mk-alert-error mt-5" role="alert">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={signingIn}
          className="mk-btn mk-btn-primary mk-btn-lg mt-7 w-full"
        >
          {signingIn ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Forgot the email you use?{" "}
          <Link
            href={`/forgot-email?type=${portal}`}
            className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
          >
            Recover your account
          </Link>
        </p>
      </form>

      {!isAttorney ? (
        <div className="mk-alert mk-alert-info mt-8">
          <span className="font-semibold text-ink">New client?</span> Your attorney or law firm will send you a secure invitation link when your portal is ready. Client accounts are not created from this page.
        </div>
      ) : null}

      <div className="mt-8 border-t border-line pt-6 text-sm text-slate-600">
        {isAttorney ? "Are you a client?" : "Work at a law firm?"}{" "}
        <Link
          href={isAttorney ? "/client-login" : "/attorney-login"}
          className="font-semibold text-ink hover:text-cobalt"
        >
          {isAttorney ? "Go to Client Login" : "Go to Attorney & Firm Login"}
        </Link>
      </div>
    </AuthLayout>
  );
}
