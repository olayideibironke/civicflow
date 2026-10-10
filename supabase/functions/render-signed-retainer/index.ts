import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const staffRoles = new Set(["admin", "attorney", "staff", "paralegal", "billing", "intake"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ascii(value: string | null | undefined) {
  return (value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "*")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n\r\t]/g, "?");
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Authentication is required." }, 401);
    }

    const token = authHeader.slice("Bearer ".length);
    const url = Deno.env.get("SUPABASE_URL");
    if (!url) return json({ error: "Supabase URL is unavailable." }, 500);

    let publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const publishableJson = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
    if (publishableJson) {
      try {
        publicKey = JSON.parse(publishableJson).default ?? publicKey;
      } catch {
        // Fall back to the legacy anonymous key.
      }
    }

    let adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const secretJson = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (secretJson) {
      try {
        adminKey = JSON.parse(secretJson).default ?? adminKey;
      } catch {
        // Fall back to the legacy service role key.
      }
    }

    if (!publicKey || !adminKey) {
      return json({ error: "Supabase function credentials are unavailable." }, 500);
    }

    const userClient = createClient(url, publicKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(url, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return json({ error: "Your session could not be verified." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const requestId = typeof body?.request_id === "string" ? body.request_id.trim() : "";
    if (!requestId) {
      return json({ error: "A retainer request ID is required." }, 400);
    }

    const [{ data: profile, error: profileError }, { data: retainer, error: retainerError }] =
      await Promise.all([
        admin
          .from("profiles")
          .select("role, organization_id")
          .eq("id", user.id)
          .single(),
        admin
          .from("retainer_signature_requests")
          .select("id, organization_id, case_id, title, agreement_text, agreement_sha256, status, signer_name, signer_email, signature_text, consent_text, signed_at, signed_pdf_path, signed_pdf_created_at")
          .eq("id", requestId)
          .single(),
      ]);

    if (profileError || !profile || retainerError || !retainer) {
      return json({ error: "Signed agreement could not be found." }, 404);
    }

    if (retainer.status !== "signed" || !retainer.signed_at || !retainer.signer_name) {
      return json({ error: "Only completed signed agreements can be archived." }, 409);
    }

    let authorized = false;
    if (profile.role === "client") {
      const { data: access } = await admin
        .from("client_case_access")
        .select("case_id")
        .eq("user_id", user.id)
        .eq("case_id", retainer.case_id)
        .eq("organization_id", retainer.organization_id)
        .maybeSingle();
      authorized = Boolean(access);
    } else if (staffRoles.has(profile.role)) {
      authorized = profile.organization_id === retainer.organization_id;
    }

    if (!authorized) {
      return json({ error: "You do not have access to this signed agreement." }, 403);
    }

    if (retainer.signed_pdf_path) {
      return json({
        path: retainer.signed_pdf_path,
        created_at: retainer.signed_pdf_created_at,
        already_archived: true,
      });
    }

    const [{ data: matter, error: matterError }, { data: organization, error: organizationError }] =
      await Promise.all([
        admin
          .from("cases")
          .select("case_number, client_first_name, client_last_name, service_category")
          .eq("id", retainer.case_id)
          .eq("organization_id", retainer.organization_id)
          .single(),
        admin
          .from("organizations")
          .select("name")
          .eq("id", retainer.organization_id)
          .single(),
      ]);

    if (matterError || !matter || organizationError || !organization) {
      return json({ error: "Matter information could not be loaded." }, 500);
    }

    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    pdf.setTitle(ascii(`${retainer.title} - Signed`));
    pdf.setAuthor(ascii(organization.name));
    pdf.setSubject("CivicFlow electronically signed retainer agreement");
    pdf.setKeywords(["CivicFlow", "retainer", "electronic signature", retainer.agreement_sha256]);

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 54;
    const maxWidth = pageWidth - margin * 2;
    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const newPage = () => {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    };

    const ensure = (needed: number) => {
      if (y - needed < margin) newPage();
    };

    const wrap = (value: string, size: number, font = regular) => {
      const words = ascii(value).split(/\s+/).filter(Boolean);
      if (!words.length) return [""];
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          line = candidate;
        } else {
          if (line) lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const drawLines = (
      value: string,
      size = 10.5,
      lineHeight = 15,
      font = regular,
      color = rgb(0.18, 0.22, 0.3),
    ) => {
      for (const line of wrap(value, size, font)) {
        ensure(lineHeight + 4);
        if (line) {
          page.drawText(line, { x: margin, y, size, font, color });
        }
        y -= lineHeight;
      }
    };

    page.drawText("CivicFlow", {
      x: margin,
      y,
      size: 11,
      font: bold,
      color: rgb(0.1, 0.2, 0.55),
    });
    y -= 28;

    drawLines(ascii(retainer.title), 20, 25, bold, rgb(0.04, 0.07, 0.14));
    y -= 4;
    drawLines(ascii(organization.name), 10.5, 15, bold);
    drawLines(`Matter ${ascii(matter.case_number)} | ${ascii(matter.client_first_name)} ${ascii(matter.client_last_name)}`, 10.5, 15);
    drawLines(`Practice area: ${ascii(matter.service_category)}`, 10.5, 15);
    y -= 12;

    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.84, 0.86, 0.9),
    });
    y -= 24;

    for (const paragraph of retainer.agreement_text.split(/\r?\n/)) {
      if (!paragraph.trim()) {
        y -= 10;
        continue;
      }
      drawLines(paragraph, 10.5, 15);
      y -= 5;
    }

    ensure(180);
    y -= 8;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.75, 0.79, 0.85),
    });
    y -= 24;

    drawLines("Electronic Signature Certificate", 14, 20, bold, rgb(0.04, 0.07, 0.14));
    drawLines(`Signer: ${ascii(retainer.signer_name)}`, 10.5, 15, bold);
    drawLines(`Signer email: ${ascii(retainer.signer_email ?? user.email ?? "")}`, 10.5, 15);
    drawLines(`Electronic signature: ${ascii(retainer.signature_text ?? retainer.signer_name)}`, 10.5, 15);
    drawLines(`Signed at: ${formatDate(retainer.signed_at)}`, 10.5, 15);
    drawLines(`Consent: ${ascii(retainer.consent_text ?? "Electronic signature consent accepted.")}`, 10.5, 15);
    y -= 8;
    drawLines("Agreement SHA-256 fingerprint:", 9.5, 14, bold);
    drawLines(retainer.agreement_sha256, 8.5, 13, regular, rgb(0.25, 0.3, 0.4));

    y -= 8;
    drawLines(
      "This PDF is an archived rendering of the electronically signed CivicFlow record. The stored agreement text and SHA-256 fingerprint remain the authoritative integrity record.",
      8.5,
      13,
      regular,
      rgb(0.38, 0.42, 0.5),
    );

    const pdfBytes = await pdf.save();
    const safeCase = ascii(matter.case_number).replace(/[^A-Za-z0-9._-]/g, "-");
    const fileName = `${safeCase}-retainer-${retainer.id.slice(0, 8)}-signed.pdf`;
    const path = `${retainer.organization_id}/${matter.case_number}/retainers/${fileName}`;

    const { error: uploadError } = await admin.storage
      .from("case-documents")
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      const { data: existing } = await admin.storage
        .from("case-documents")
        .list(`${retainer.organization_id}/${matter.case_number}/retainers`, {
          search: fileName,
          limit: 5,
        });
      if (!existing?.some((object) => object.name === fileName)) {
        throw uploadError;
      }
    }

    const { data: existingDocument } = await admin
      .from("case_documents")
      .select("id")
      .eq("file_path", path)
      .maybeSingle();

    if (!existingDocument) {
      const { error: documentError } = await admin.from("case_documents").insert({
        case_id: retainer.case_id,
        organization_id: retainer.organization_id,
        name: `${retainer.title} - Signed`,
        description: `Electronically signed retainer agreement. SHA-256: ${retainer.agreement_sha256}`,
        status: "Received",
        file_name: fileName,
        file_path: path,
        client_visible: true,
      });
      if (documentError) throw documentError;
    }

    const archivedAt = new Date().toISOString();
    const { error: updateError } = await admin
      .from("retainer_signature_requests")
      .update({
        signed_pdf_path: path,
        signed_pdf_created_at: archivedAt,
      })
      .eq("id", retainer.id)
      .eq("status", "signed");

    if (updateError) throw updateError;

    await admin.from("case_activity").insert({
      case_id: retainer.case_id,
      organization_id: retainer.organization_id,
      title: "Signed retainer archived",
      detail: `${retainer.title} was preserved as a signed PDF with agreement fingerprint ${retainer.agreement_sha256}.`,
      created_by: "CivicFlow eSignature",
      client_visible: true,
    });

    return json({
      path,
      file_name: fileName,
      created_at: archivedAt,
      already_archived: false,
    });
  } catch (error) {
    console.error("render-signed-retainer", error);
    return json(
      { error: error instanceof Error ? error.message : "Unable to archive signed agreement." },
      500,
    );
  }
});
