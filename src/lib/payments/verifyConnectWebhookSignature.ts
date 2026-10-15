import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify the exact raw request body against a dedicated Stripe Connect
 * webhook signing secret. This function must run before parsing event JSON,
 * resolving a connected firm, or inserting into the event inbox.
 *
 * This secret is distinct from CivicFlow's own subscription webhook secret.
 */
export function verifyConnectWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  endpointSecret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300
): boolean {
  if (!endpointSecret.startsWith("whsec_") || !signatureHeader ||
      !Number.isSafeInteger(nowSeconds) || !Number.isSafeInteger(toleranceSeconds) ||
      toleranceSeconds < 0 || toleranceSeconds > 300 ||
      Buffer.byteLength(rawBody, "utf8") > 1024 * 1024) return false;

  const parts = signatureHeader.split(",");
  const timestamps = parts.filter(p => p.trim().startsWith("t="));
  const signatures = parts.filter(p => p.trim().startsWith("v1="));
  if (timestamps.length !== 1 || signatures.length === 0) return false;
  const timestamp = timestamps[0].trim().slice(2);
  if (!/^[0-9]{1,12}$/.test(timestamp)) return false;
  const seconds = Number(timestamp);
  if (!Number.isSafeInteger(seconds) || Math.abs(nowSeconds - seconds) > toleranceSeconds)
    return false;

  const expected = createHmac("sha256", endpointSecret)
    .update(timestamp + "." + rawBody, "utf8").digest();
  for (const entry of signatures) {
    const hex = entry.trim().slice(3);
    if (!/^[a-fA-F0-9]{64}$/.test(hex)) continue;
    const candidate = Buffer.from(hex, "hex");
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected))
      return true;
  }
  return false;
}
