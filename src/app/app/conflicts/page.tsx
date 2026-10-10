"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { loadStaffWorkspace, type StaffWorkspace } from "@/lib/workspace";

type Matter = { id: string; organization_id: string; case_number: string; client_first_name: string; client_last_name: string; service_category: string; };
type ConflictMatch = { source_type: string; case_id: string; case_number: string; matched_name: string; party_role: string; matched_email: string | null; match_reason: string; score: number; };
type Party = { id: string; case_id: string; party_type: string; name: string; aliases: string[]; email: string | null; phone: string | null; created_at: string; };

function matchTone(score: number) {
  return score >= 90
    ? { label: "Strong record match", className: "border-rose-200 bg-rose-50 text-rose-800" }
    : { label: "Possible record match", className: "border-amber-200 bg-amber-50 text-amber-800" };
}

export default function ConflictsPage() {
  const searchParams = useSearchParams();
  const requestedMatterId = searchParams.get("matter")?.trim() ?? "";
  const requestedQuery = searchParams.get("q")?.trim() ?? "";
  const [workspace, setWorkspace] = useState<StaffWorkspace | null>(null);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [query, setQuery] = useState(requestedQuery);
  const [matches, setMatches] = useState<ConflictMatch[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [partyCaseId, setPartyCaseId] = useState("");
  const [partyType, setPartyType] = useState("opposing_party");
  const [partyName, setPartyName] = useState("");
  const [partyAliases, setPartyAliases] = useState("");
  const [partyEmail, setPartyEmail] = useState("");
  const [partyPhone, setPartyPhone] = useState("");
  const [partyNotes, setPartyNotes] = useState("");

  async function loadData() {
    const ws = await loadStaffWorkspace();
    if (!ws.workspace) return setMessage(ws.error || "Unable to load workspace.");
    const [matterResult, partyResult] = await Promise.all([
      supabase.from("cases").select("id, organization_id, case_number, client_first_name, client_last_name, service_category").order("created_at", { ascending: false }),
      supabase.from("case_parties").select("id, case_id, party_type, name, aliases, email, phone, created_at").order("created_at", { ascending: false }).limit(25),
    ]);
    if (matterResult.error || partyResult.error) return setMessage(matterResult.error?.message || partyResult.error?.message || "Unable to load conflict data.");
    const loaded = (matterResult.data ?? []) as Matter[];
    setWorkspace(ws.workspace);
    setMatters(loaded);
    setParties((partyResult.data ?? []) as Party[]);
    const requestedMatter = loaded.find((matter) => matter.id === requestedMatterId);
    if (!partyCaseId && (requestedMatter || loaded[0])) setPartyCaseId((requestedMatter || loaded[0]).id);
  }

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function runSearch(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return setMessage("Enter at least two characters.");
    setBusy(true); setMessage("");
    const { data, error } = await supabase.rpc("search_conflicts", { p_query: query.trim() });
    setBusy(false);
    if (error) return setMessage(error.message);
    setMatches((data ?? []) as ConflictMatch[]);
    setMessage((data ?? []).length ? "Potential matches found. Review them before opening or accepting the matter." : "No potential matches were found in the current firm records.");
  }

  async function addParty(event: FormEvent) {
    event.preventDefault();
    const matter = matters.find((row) => row.id === partyCaseId);
    if (!matter || !workspace) return setMessage("Choose a matter first.");
    if (!partyName.trim()) return setMessage("Party name is required.");
    setBusy(true);
    const { error } = await supabase.from("case_parties").insert({
      organization_id: matter.organization_id,
      case_id: matter.id,
      party_type: partyType,
      name: partyName.trim(),
      aliases: partyAliases.split(",").map((value) => value.trim()).filter(Boolean),
      email: partyEmail.trim() || null,
      phone: partyPhone.trim() || null,
      notes: partyNotes.trim(),
      created_by: workspace.profile.id,
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setPartyName(""); setPartyAliases(""); setPartyEmail(""); setPartyPhone(""); setPartyNotes("");
    setMessage("Party added to the matter and is now included in future conflict checks.");
    await loadData();
  }

  const matterById = new Map<string, Matter>(matters.map((matter) => [matter.id, matter]));

  return <AppShell><div className="space-y-6">
    <section className="premium-card"><p className="eyebrow">Conflict Check</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Search the firm&apos;s matters before you take the next case.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">CivicFlow checks existing client names and emails plus opposing parties, related parties, organizations, witnesses, and aliases your firm records.</p>{requestedMatterId && matterById.get(requestedMatterId) ? <div className="mt-5 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-blue-950">Working from matter {matterById.get(requestedMatterId)?.case_number} · {matterById.get(requestedMatterId)?.client_first_name} {matterById.get(requestedMatterId)?.client_last_name}</p><Link className="btn btn-secondary" href={`/app/cases/${encodeURIComponent(matterById.get(requestedMatterId)?.case_number ?? "")}`}>Back to matter</Link></div> : null}</section>
    {message ? <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{message}</div> : null}
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,.8fr)]">
      <div className="premium-card">
        <form onSubmit={runSearch}><p className="eyebrow">Search</p><h2 className="mt-3 text-xl font-bold text-slate-950">Name, alias, organization, or email</h2><div className="mt-5 flex flex-col gap-3 sm:flex-row"><input className="input-field flex-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Example: Jordan Lee or northstar@example.com" /><button disabled={busy} className="btn btn-primary" type="submit">{busy ? "Checking..." : "Run conflict check"}</button></div></form>
        <div className="mt-7 space-y-3">{matches.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-500">Search results will appear here. A match is a review signal, not a legal determination that a conflict exists.</div> : matches.map((match, index) => { const tone=matchTone(match.score); return <div key={`${match.source_type}-${match.case_id}-${match.matched_name}-${index}`} className={`rounded-xl border p-4 ${tone.className}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-950">{match.matched_name}</span><span className="chip bg-white/80 text-slate-700">{match.party_role}</span><span className="chip bg-white/80 text-slate-700">{tone.label}</span></div><p className="mt-2 text-sm text-slate-700">{match.match_reason}{match.matched_email ? ` · ${match.matched_email}` : ""}</p><p className="mt-1 text-xs text-slate-500">Matter {match.case_number}. Review the underlying matter before making a conflict determination.</p></div><Link className="btn btn-secondary" href={`/app/cases/${encodeURIComponent(match.case_number)}`}>Review matter</Link></div></div>; })}</div>
      </div>

      <form onSubmit={addParty} className="premium-card space-y-4"><div><p className="eyebrow">Conflict record</p><h2 className="mt-3 text-xl font-bold text-slate-950">Add a party to an existing matter</h2></div><label className="input-label">Matter<select className="input-field" value={partyCaseId} onChange={(e) => setPartyCaseId(e.target.value)}>{matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.case_number} · {matter.client_first_name} {matter.client_last_name}</option>)}</select></label><label className="input-label">Relationship<select className="input-field" value={partyType} onChange={(e) => setPartyType(e.target.value)}><option value="opposing_party">Opposing party</option><option value="related_party">Related party</option><option value="witness">Witness</option><option value="organization">Organization</option><option value="client">Additional client</option><option value="other">Other</option></select></label><label className="input-label">Name<input className="input-field" value={partyName} onChange={(e) => setPartyName(e.target.value)} required /></label><label className="input-label">Aliases<input className="input-field" value={partyAliases} onChange={(e) => setPartyAliases(e.target.value)} placeholder="Comma-separated" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="input-label">Email<input className="input-field" type="email" value={partyEmail} onChange={(e) => setPartyEmail(e.target.value)} /></label><label className="input-label">Phone<input className="input-field" value={partyPhone} onChange={(e) => setPartyPhone(e.target.value)} /></label></div><label className="input-label">Internal note<textarea className="input-field min-h-24" value={partyNotes} onChange={(e) => setPartyNotes(e.target.value)} /></label><button disabled={busy || !partyCaseId} className="btn btn-primary" type="submit">Add to conflict index</button></form>
    </section>
    <section className="premium-card"><div className="border-b border-slate-100 pb-5"><p className="eyebrow">Recently indexed</p><h2 className="mt-3 text-xl font-bold text-slate-950">Matter parties</h2></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{parties.length === 0 ? <p className="text-sm text-slate-500">No additional parties have been indexed yet.</p> : parties.map((party) => { const matter=matterById.get(party.case_id); return <div key={party.id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold text-slate-950">{party.name}</p><p className="mt-1 text-sm text-slate-500">{party.party_type.replaceAll("_", " ")} · {matter?.case_number}</p>{party.aliases.length ? <p className="mt-2 text-xs text-slate-400">Aliases: {party.aliases.join(", ")}</p> : null}</div>; })}</div></section>
  </div></AppShell>;
}