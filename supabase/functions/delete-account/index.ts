import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return json({ error: "Authentication is required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Account deletion service is not configured." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return json({ error: "Your session is invalid or expired." }, 401);
  }

  let payload: { confirmation?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "A deletion confirmation is required." }, 400);
  }

  if (payload.confirmation !== "DELETE") {
    return json({ error: "Type DELETE to confirm account deletion." }, 400);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, organization_id, role, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return json({ error: "Account profile could not be found." }, 404);
  }

  if (profile.is_platform_admin) {
    return json(
      {
        error:
          "The platform administrator account cannot be deleted from self-service. Transfer platform administration first.",
      },
      409,
    );
  }

  if (profile.role === "admin" && profile.organization_id) {
    const { count, error: countError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("role", "admin");

    if (countError) {
      return json(
        { error: "Unable to verify organization administrators." },
        500,
      );
    }

    if ((count ?? 0) <= 1) {
      return json(
        {
          error:
            "This is the organization's only administrator account. Add or promote another administrator before deleting it.",
        },
        409,
      );
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return json({ error: deleteError.message }, 500);
  }

  return json({
    success: true,
    message:
      profile.role === "client"
        ? "Your CivicFlow login and client portal access were deleted. Legal matter records retained by the law firm are not deleted by closing the portal account."
        : "Your CivicFlow user account was deleted. Organization and legal matter records remain with the firm.",
  });
});
