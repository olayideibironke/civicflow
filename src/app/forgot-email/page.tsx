"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AuthLayout, { AuthHeading } from "@/components/marketing/AuthLayout";
import { supabase } from "@/lib/supabase";
import {
  formatPhoneInput,
  getFirstValidationError,
  validateRequiredPhone,
  validateRequiredText,
} from "@/lib/validation";

type AccountType = "attorney" | "client";

export default function ForgotEmailPage() {
  const [accountType, setAccountType] = useState<AccountType>("client");
  const [organizationName, setOrganizationName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "attorney" || type === "client") {
      setAccountType(type);
    }
  }, []);

  function validateForm() {
    return getFirstValidationError([
      validateRequiredText(organizationName, "Firm or organization name"),
      validateRequiredText(fullName, "Full name"),
      validateRequiredPhone(phone),
    ]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setSubmitting(true);
    setMessage("");

    const { data, error } = await supabase.rpc("submit_account_recovery_request", {
      p_account_type: accountType,
      p_organization_name: organizationName.trim(),
      p_full_name: fullName.trim(),
      p_phone: phone,
      p_case_number: caseNumber.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReference(String(data ?? ""));
  }

  return (
    <AuthLayout variant="security" topLink={{ label: "Back to login", href: "/login" }}>
      <AuthHeading
        eyebrow="Account recovery"
        title="Do not remember your login email?"
        description="Submit a recovery request. CivicFlow will not reveal account email addresses automatically. Your request must be verified before account information is provided or changed."
      />

      {reference ? (
        <div className="mk-alert mk-alert-success mt-8" role="status">
          Your account recovery request was received. Reference: <span className="font-bold">{reference}</span>. Keep this reference for follow-up.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-9 grid gap-5">
          <fieldset>
            <legend className="mk-label">Account type</legend>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-[10px] border border-line bg-porcelain p-1">
              {([
                ["client", "Client"],
                ["attorney", "Attorney or firm user"],
              ] as [AccountType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={accountType === value}
                  onClick={() => setAccountType(value)}
                  className={`mk-focus rounded-[7px] px-3 py-2.5 text-sm font-semibold transition ${
                    accountType === value
                      ? "bg-white text-ink shadow-[0_1px_2px_rgba(8,18,42,0.1)]"
                      : "text-slate-500 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mk-label">
            Firm or organization name
            <input
              required
              value={organizationName}
              onChange={(event) => {
                setOrganizationName(event.target.value);
                setMessage("");
              }}
              placeholder="Your law firm or organization"
              className="mk-field"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="mk-label">
              Full name
              <input
                required
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setMessage("");
                }}
                placeholder="Your full name"
                className="mk-field"
              />
            </label>

            <label className="mk-label">
              Phone number
              <input
                inputMode="numeric"
                required
                value={phone}
                onChange={(event) => {
                  setPhone(formatPhoneInput(event.target.value));
                  setMessage("");
                }}
                placeholder="202-555-0198"
                className="mk-field"
              />
            </label>
          </div>

          {accountType === "client" ? (
            <label className="mk-label">
              Case number, if known{" "}
              <span className="font-normal text-slate-400">(optional)</span>
              <input
                value={caseNumber}
                onChange={(event) => setCaseNumber(event.target.value)}
                placeholder="CF-1001"
                className="mk-field"
              />
            </label>
          ) : null}

          {message ? (
            <div className="mk-alert mk-alert-error" role="alert">
              {message}
            </div>
          ) : null}

          <button type="submit" disabled={submitting} className="mk-btn mk-btn-primary mk-btn-lg mt-2 w-full">
            {submitting ? "Submitting..." : "Submit recovery request"}
          </button>
        </form>
      )}

      <div className="mt-8 border-t border-line pt-6 text-sm text-slate-600">
        Know your email?{" "}
        <Link href={`/forgot-password?type=${accountType}`} className="font-semibold text-ink hover:text-cobalt">
          Reset your password instead
        </Link>
      </div>
    </AuthLayout>
  );
}
