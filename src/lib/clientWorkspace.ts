import { supabase } from "@/lib/supabase";

export type ClientWorkspace = {
  email: string;
  profileId: string;
  firstName: string;
  lastName: string;
  caseCount: number;
};

export type ClientCaseSummary = {
  case_id: string;
  case_number: string;
  organization_name: string;
  service_category: string;
  priority: string;
  status: string;
  assigned_to: string;
  decision_outcome: string | null;
  created_at: string;
  updated_at: string;
};

type ClientWorkspaceRpcRow = {
  email: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  case_count: number | string;
};

export async function loadClientWorkspace(): Promise<{
  workspace: ClientWorkspace | null;
  error: string;
}> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { workspace: null, error: sessionError.message };
  }

  if (!session) {
    return { workspace: null, error: "Client session was not found." };
  }

  const { data, error } = await supabase.rpc("get_client_workspace");

  if (error) {
    return { workspace: null, error: error.message };
  }

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const row = rows[0] as ClientWorkspaceRpcRow | undefined;

  if (!row) {
    return { workspace: null, error: "Client workspace was not returned." };
  }

  return {
    workspace: {
      email: row.email || session.user.email || "",
      profileId: row.profile_id,
      firstName: row.first_name,
      lastName: row.last_name,
      caseCount: Number(row.case_count ?? 0),
    },
    error: "",
  };
}

export async function loadClientCases(): Promise<{
  cases: ClientCaseSummary[];
  error: string;
}> {
  const { data, error } = await supabase.rpc("get_client_cases");

  if (error) {
    return { cases: [], error: error.message };
  }

  return {
    cases: (data ?? []) as ClientCaseSummary[],
    error: "",
  };
}

export function getClientDisplayName(workspace: ClientWorkspace | null) {
  if (!workspace) {
    return "Client";
  }

  const name = `${workspace.firstName} ${workspace.lastName}`.trim();
  return name || workspace.email || "Client";
}

export function getClientInitials(workspace: ClientWorkspace | null) {
  if (!workspace) {
    return "CF";
  }

  const first = workspace.firstName.trim().charAt(0);
  const last = workspace.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || workspace.email.charAt(0).toUpperCase() || "CF";
}
