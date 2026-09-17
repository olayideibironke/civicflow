"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { supabase } from "@/lib/supabase";
import { validateRequiredEmail, validateRequiredText } from "@/lib/validation";

export default function ClientActivatePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  async function acceptInvite(inviteToken: string) {
    setWorking(true);
    setMessage("");

    const { error } = await supabase.rpc("accept_client_portal_invite", {
      p_token: inviteToken,
    });

    if (error) {
      setWorking(false);
      setMessage(error.message);
      return false;
    }

    setWorking(false);
    router.replace("/client");
    return true;
  }

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("token")?.trim() ?? "";
    setToken(inviteToken);

    async function initialize() {
      if (!inviteToken) {
        if (active) {
          setMessage("A client invitation link is required to activate an account.");
          setChecking(false);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (session) {
        setEmail(session.user.email ?? "");
        setChecking(false);
        await acceptInvite(inviteToken);
        return;
      }

      setChecking(false);
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active || !session || !inviteToken) {
        return;
      }

      setEmail(session.user.email ?? "");
      await acceptInvite(inviteToken);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setMessage("A valid client invitation link is required.");
      return;
    }

    const emailError = validateRequiredEmail(email);
    const passwordError = validateRequiredText(password, "Password");

    if (emailError || passwordError) {
      setMessage(emailError || passwordError);
      return;
    }

    if (mode === "signup" && password.length < 12) {
      setMessage("Password must be at least 12 characters long.");
      return;
    }

    setWorking(true);
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setWorking(false);
        setMessage("Email or password is incorrect.");
        return;
      }

      await acceptInvite(token);
      return;
    }

    const redirectTo = `${window.location.origin}/client/activate?token=${encodeURIComponent(token)}`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setWorking(false);
      setMessage(error.message);
      return;
    }

    if (data.session) {
      await acceptInvite(token);
      return;
    }

    setWorking(false);
    setEmailSent(true);
  }

  if (checking) {
    return (
      <main className="min-h-screen px-6 py-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="premium-card w-full text-center">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <p className="mt-5 text-sm font-semibold text-slate-600">Checking client invitation...</p>
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
          <Link href="/client-login" className="btn btn-secondary">
            Client Login
          </Link>
        </div>

        <div className="premium-card mx-auto mt-12 max-w-xl sm:mt-16">
          <p className="eyebrow">Client Portal Activation</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Activate secure client access.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use the email address that received your CivicFlow invitation. Your account will only connect to matters specifically shared by your legal team.
          </p>

          {emailSent ? (
            <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
              Check your email and confirm your address. The confirmation link will return you here and finish connecting your client portal.
            </div>
          ) : (
            <>
              <div className="mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setMessage("");
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                >
                  New client account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setMessage("");
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold ${mode === "signin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                >
                  Existing account
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-5">
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
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    minLength={mode === "signup" ? 12 : undefined}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setMessage("");
                    }}
                    placeholder={mode === "signup" ? "At least 12 characters" : "Enter password"}
                    className="input-field"
                  />
                </label>

                {message ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
                    {message}
                  </div>
                ) : null}

                <button type="submit" disabled={working || !token} className="btn btn-primary py-3">
                  {working
                    ? "Activating..."
                    : mode === "signup"
                      ? "Create and activate account"
                      : "Sign in and activate"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
