import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyConnectWebhookSignature } from "./verifyConnectWebhookSignature";
const secret = "whsec_connect_test";
const raw = '{"id":"evt_123","type":"refund.created"}';
const timestamp = 1792000000;
const sign = (body: string, time: number, key = secret) =>
  createHmac("sha256", key).update(time + "." + body).digest("hex");
describe("Stripe Connect webhook signature", () => {
  it("accepts an authentic unmodified raw body", () => {
    expect(verifyConnectWebhookSignature(raw, "t=" + timestamp + ",v1=" + sign(raw, timestamp), secret, timestamp)).toBe(true);
  });
  it("rejects tampering and incorrect endpoint secrets", () => {
    const header = "t=" + timestamp + ",v1=" + sign(raw, timestamp);
    expect(verifyConnectWebhookSignature(raw + " ", header, secret, timestamp)).toBe(false);
    expect(verifyConnectWebhookSignature(raw, header, "whsec_other", timestamp)).toBe(false);
  });
  it("rejects stale or future timestamps", () => {
    const header = "t=" + timestamp + ",v1=" + sign(raw, timestamp);
    expect(verifyConnectWebhookSignature(raw, header, secret, timestamp + 301)).toBe(false);
    expect(verifyConnectWebhookSignature(raw, header, secret, timestamp - 301)).toBe(false);
  });
  it("rejects invalid and missing signatures", () => {
    expect(verifyConnectWebhookSignature(raw, null, secret, timestamp)).toBe(false);
    expect(verifyConnectWebhookSignature(raw, "t=abc,v1=123", secret, timestamp)).toBe(false);
  });
});
