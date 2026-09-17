"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ClientShell from "@/components/ClientShell";
import { loadClientWorkspace, type ClientWorkspace } from "@/lib/clientWorkspace";
import { supabase } from "@/lib/supabase";
import { getFirstValidationError, validateRequiredText } from "@/lib/validation";

export default function ClientAccountPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<ClientWorkspace | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      const result = await loadClientWorkspace();
      if (!active || !result.workspace) return;

      setWorkspace(result.workspace);
      setFirstName(result.workspace.firstName);
      setLastName(result.workspace.lastName);
    }

    loadAccount();
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = getFirstValidationError([
      validateRequiredText(firstName, "First name"),
      validateRequiredText(lastName, "Last name"),
    ]);

    if (validationError) {
      setProfileMessage(validationError);
      return;
    }

    setSavingProfile(true);
    setProfileMessage("");
    const { error } = await supabase.rpc("update_my_profile", {
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
    });
    setSavingProfile(false);

    if (error) {
      setProfileMessage(error.message);
      return;
    }

    setProfileMessage("Profile saved.");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword) {
      setPasswordMessage("Current password is required.");
      return;
    }

    if (newPassword.length < 12) {
      setPasswordMessage("New password must be at least 12 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    setPasswordMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      currentPassword,
    });

    setChangingPassword(false);

    if (error) {
      setPasswordMessage(error.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated.");
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace?.email) {
      setDeleteMessage("Account email could not be loaded.");
      return;
    }

    if (!deletePassword) {
      setDeleteMessage("Current password is required before deleting your account.");
      return;
    }

    if (deleteConfirmation !== "DELETE") {
      setDeleteMessage("Type DELETE exactly to confirm account deletion.");
      return;
    }

    setDeleting(true);
    setDeleteMessage("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: workspace.email,
      password: deletePassword,
    });

    if (authError) {
      setDeleting(false);
      setDeleteMessage("Current password is incorrect.");
      return;
    }

    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: { confirmation: "DELETE" },
    });

    if (error) {
      setDeleting(false);
      setDeleteMessage(error.message);
      return;
    }

    if (data?.error) {
      setDeleting(false);
      setDeleteMessage(String(data.error));
      return;
    }

    await supabase.auth.signOut();
    router.replace("/?account=deleted");
  }

  return (
    <ClientShell>
      <div className="space-y-6">
        <section className="premium-card">
          <p className="eyebrow">Account Settings</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Manage your client account</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Update your profile, change your password, or close your CivicFlow client login.
          </p>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-2">
          <form onSubmit={saveProfile} noValidate className="premium-card">
            <p className="eyebrow">Profile</p>
            <h2 className="mt-3 text-xl font-bold text-slate-950">Personal information</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Your login email is managed through CivicFlow authentication.</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="input-label">
                First name *
                <input value={firstName} onChange={(event) => { setFirstName(event.target.value); setProfileMessage(""); }} className="input-field" required />
              </label>
              <label className="input-label">
                Last name *
                <input value={lastName} onChange={(event) => { setLastName(event.target.value); setProfileMessage(""); }} className="input-field" required />
              </label>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Login email</p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900">{workspace?.email || "Loading..."}</p>
            </div>

            {profileMessage ? <p className="mt-4 text-sm font-medium text-slate-600">{profileMessage}</p> : null}
            <button type="submit" disabled={savingProfile} className="btn btn-primary mt-6">{savingProfile ? "Saving..." : "Save profile"}</button>
          </form>

          <form onSubmit={changePassword} noValidate className="premium-card">
            <p className="eyebrow">Security</p>
            <h2 className="mt-3 text-xl font-bold text-slate-950">Change password</h2>
            <div className="mt-6 grid gap-5">
              <label className="input-label">Current password *<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setPasswordMessage(""); }} className="input-field" required /></label>
              <label className="input-label">New password *<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setPasswordMessage(""); }} className="input-field" minLength={12} required placeholder="At least 12 characters" /></label>
              <label className="input-label">Confirm new password *<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setPasswordMessage(""); }} className="input-field" minLength={12} required /></label>
            </div>
            {passwordMessage ? <p className="mt-4 text-sm font-medium text-slate-600">{passwordMessage}</p> : null}
            <button type="submit" disabled={changingPassword} className="btn btn-primary mt-6">{changingPassword ? "Updating..." : "Change password"}</button>
          </form>
        </section>

        <form onSubmit={deleteAccount} noValidate className="premium-card border-rose-200">
          <p className="eyebrow text-rose-600">Delete Account</p>
          <h2 className="mt-3 text-xl font-bold text-slate-950">Close your CivicFlow client login</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            This deletes your authentication account and client portal access. It does not delete legal matter records that a law firm must retain or is otherwise permitted to keep.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="input-label">Current password *<input type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => { setDeletePassword(event.target.value); setDeleteMessage(""); }} className="input-field" required /></label>
            <label className="input-label">Type DELETE to confirm *<input value={deleteConfirmation} onChange={(event) => { setDeleteConfirmation(event.target.value); setDeleteMessage(""); }} className="input-field" required /></label>
          </div>

          {deleteMessage ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{deleteMessage}</div> : null}
          <button type="submit" disabled={deleting} className="mt-6 rounded-xl bg-rose-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:opacity-50">{deleting ? "Deleting..." : "Delete my account"}</button>
        </form>
      </div>
    </ClientShell>
  );
}
