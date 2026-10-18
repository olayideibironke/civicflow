/** Validate service-role request destinations before sending credentials. */
export function validatedFinancialSupabaseBaseUrl(value: string): string {
  if (typeof value !== "string") throw new Error("Invalid financial Supabase base URL");
  let parsed: URL;
  try { parsed = new URL(value); }
  catch { throw new Error("Invalid financial Supabase base URL"); }
  if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username ||
      parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/" ||
      !value.startsWith("https://") || parsed.port)
    throw new Error("Invalid financial Supabase base URL");
  return parsed.origin;
}
export function validateFinancialServiceKey(value: string): void {
  if (typeof value !== "string" || !value.trim() || /[\r\n]/.test(value))
    throw new Error("Invalid financial service credentials");
}
