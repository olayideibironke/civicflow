"use client";

import { useEffect, useState, type FormEvent } from "react";
import AuthLayout, { AuthChecking, AuthHeading } from "@/components/marketing/AuthLayout";
import { useRouter } from "next/navigation";
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
    return <AuthChecking message="Checking client invitation..." />;
  }

  return (
    <AuthLayout variant="client" topLink={{ label: "Client Login", href: "/client-login" }}>
      <AuthHeading
        eyebrow="Client portal activation"
        title="Activate secure client access"
        description="Use the email address that received your CivicFlow invitation. Your account will only connect to matters specifically shared by your legal team."
      />

      {emailSent ? (
        <div className="mk-alert mk-alert-success mt-8" role="status">
          Check your email and confirm your address. The confirmation link will return you here and finish connecting your client portal.
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-1 rounded-[10px] border border-line bg-porcelain p-1" role="group" aria-label="Account type">
            <button
              type="button"
              aria-pressed={mode === "signup"}
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
              className={`mk-focus rounded-[7px] px-3 py-2.5 text-sm font-semibold transition ${mode === "signup" ? "bg-white text-ink shadow-[0_1px_2px_rgba(8,18,42,0.1)]" : "text-slate-500 hover:text-ink"}`}
            >
              New client account
            </button>
            <button
              type="button"
              aria-pressed={mode === "signin"}
              onClick={() => {
                setMode("signin");
                setMessage("");
              }}
              className={`mk-focus rounded-[7px] px-3 py-2.5 text-sm font-semibold transition ${mode === "signin" ? "bg-white text-ink shadow-[0_1px_2px_rgba(8,18,42,0.1)]" : "text-slate-500 hover:text-ink"}`}
            >
              Existing account
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-5">
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
              Password
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
                className="mk-field"
              />
            </label>

            {message ? (
              <div className="mk-alert mk-alert-error" role="alert">
                {message}
              </div>
            ) : null}

            <button type="submit" disabled={working || !token} className="mk-btn mk-btn-primary mk-btn-lg w-full">
              {working
                ? "Activating..."
                : mode === "signup"
                  ? "Create and activate account"
                  : "Sign in and activate"}
            </button>
          </form>
        </>
      )}

      <div className="mt-8 border-t border-line pt-6 text-sm leading-6 text-slate-600">
        Invitation links are single-use and expire after seven days. If yours has expired, ask your law firm to send a new one.
      </div>
    </AuthLayout>
  );
}
