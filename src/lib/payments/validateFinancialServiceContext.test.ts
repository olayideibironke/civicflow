import { describe, expect, it } from "vitest";
import { validatedFinancialSupabaseBaseUrl, validateFinancialServiceKey } from "./validateFinancialServiceContext";

describe("financial service context validation", () => {
  it("accepts a canonical HTTPS Supabase origin", () => {
    expect(validatedFinancialSupabaseBaseUrl("https://example.supabase.co"))
      .toBe("https://example.supabase.co");
    expect(validatedFinancialSupabaseBaseUrl("https://example.supabase.co/"))
      .toBe("https://example.supabase.co");
  });
  it("rejects credential-bearing, redirected, malformed, or noncanonical base URLs", () => {
    for (const candidate of [
      "", "http://example.supabase.co", "https://", "https://user:pass@example.supabase.co",
      "https://example.supabase.co:4443", "https://example.supabase.co/rest/v1",
      "https://example.supabase.co?token=secret", "https://example.supabase.co/#token",
      "https://example.supabase.co\\@evil.example", null, 42,
    ]) {
      expect(() => validatedFinancialSupabaseBaseUrl(candidate as string)).toThrow();
    }
  });
  it("rejects blank, non-string, or newline-bearing service keys", () => {
    for (const candidate of ["", "  ", "bad\nkey", "bad\rkey", null, 42]) {
      expect(() => validateFinancialServiceKey(candidate as string)).toThrow();
    }
    expect(() => validateFinancialServiceKey("service-key")).not.toThrow();
  });
});
