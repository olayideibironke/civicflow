import { supabase } from "@/lib/supabase";

export type StaffProfile = {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  role: string;
};

export type StaffOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type StaffWorkspace = {
  email: string;
  profile: StaffProfile;
  organization: StaffOrganization;
};

type StaffWorkspaceRpcRow = {
  email: string;
  profile_id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_name: string;
  organization_slug: string;
};

export async function loadStaffWorkspace(): Promise<{
  workspace: StaffWorkspace | null;
  error: string;
}> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return {
      workspace: null,
      error: sessionError.message,
    };
  }

  if (!session) {
    return {
      workspace: null,
      error: "Staff session was not found.",
    };
  }

  const { data, error } = await supabase.rpc("get_staff_workspace");

  if (error) {
    return {
      workspace: null,
      error: error.message,
    };
  }

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const row = rows[0] as StaffWorkspaceRpcRow | undefined;

  if (!row) {
    return {
      workspace: null,
      error: "Staff workspace was not returned by Supabase.",
    };
  }

  return {
    workspace: {
      email: row.email || session.user.email || "staff@civicflow.local",
      profile: {
        id: row.profile_id,
        organization_id: row.organization_id,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
      },
      organization: {
        id: row.organization_id,
        name: row.organization_name,
        slug: row.organization_slug,
      },
    },
    error: "",
  };
}

export function getStaffDisplayName(workspace: StaffWorkspace | null) {
  if (!workspace) {
    return "Staff User";
  }

  const fullName =
    `${workspace.profile.first_name} ${workspace.profile.last_name}`.trim();

  return fullName || workspace.email;
}

export function getStaffInitials(workspace: StaffWorkspace | null) {
  if (!workspace) {
    return "CF";
  }

  const firstInitial = workspace.profile.first_name.trim().charAt(0);
  const lastInitial = workspace.profile.last_name.trim().charAt(0);

  const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase();

  return initials || workspace.email.trim().charAt(0).toUpperCase() || "CF";
}

export function formatStaffRole(role: string) {
  if (!role.trim()) {
    return "Staff";
  }

  return role
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}