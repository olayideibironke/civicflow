"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";
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

        <div className="premium-card mx-auto mt-12 max-w-2xl sm:mt-16">
          <p className="eyebrow">Account Recovery</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Do not remember your login email?
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Submit a recovery request. CivicFlow will not reveal account email addresses automatically. Your request must be verified before account information is provided or changed.
          </p>

          {reference ? (
            <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
              Your account recovery request was received. Reference: <span className="font-bold">{reference}</span>. Keep this reference for follow-up.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-7 grid gap-5">
              <label className="input-label">
                Account type *
                <select
                  value={accountType}
                  onChange={(event) => setAccountType(event.target.value as AccountType)}
                  className="input-field"
                >
                  <option value="client">Client</option>
                  <option value="attorney">Attorney or firm user</option>
                </select>
              </label>

              <label className="input-label">
                Firm or organization name *
                <input
                  required
                  value={organizationName}
                  onChange={(event) => {
                    setOrganizationName(event.target.value);
                    setMessage("");
                  }}
                  placeholder="Your law firm or organization"
                  className="input-field"
                />
              </label>

              <label className="input-label">
                Full name *
                <input
                  required
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setMessage("");
                  }}
                  placeholder="Your full name"
                  className="input-field"
                />
              </label>

              <label className="input-label">
                Phone number *
                <input
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={(event) => {
                    setPhone(formatPhoneInput(event.target.value));
                    setMessage("");
                  }}
                  placeholder="202-555-0198"
                  className="input-field"
                />
              </label>

              {accountType === "client" ? (
                <label className="input-label">
                  Case number, if known
                  <input
                    value={caseNumber}
                    onChange={(event) => setCaseNumber(event.target.value)}
                    placeholder="CF-1001"
                    className="input-field"
                  />
                </label>
              ) : null}

              {message ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {message}
                </div>
              ) : null}

              <button type="submit" disabled={submitting} className="btn btn-primary py-3">
                {submitting ? "Submitting..." : "Submit recovery request"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
