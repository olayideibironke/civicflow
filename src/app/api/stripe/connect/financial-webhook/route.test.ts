import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { POST } from "./route";

const oldEnabled = process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_ENABLED;
const oldSecret = process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_SECRET;
const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const secret = "whsec_financialtestsecret";
const organizationId = "11111111-1111-4111-8111-111111111111";
const payload = {
  id: "evt_Financial1", account: "acct_Firm1", livemode: false,
  type: "refund.created", created: 1792324800,
  data: { object: {
    id: "re_Refund1", object: "refund", amount: 125,
    currency: "usd", status: "pending", payment_intent: "pi_Payment1",
  } },
};
function signedRequest(body: string): Request {
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
  return new Request("https://civicflowapp.org/api/stripe/connect/financial-webhook", {
    method: "POST", headers: { "stripe-signature": "t=" + timestamp + ",v1=" + digest },
    body,
  });
}
beforeEach(() => {
  process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_ENABLED = "true";
  process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_SECRET = secret;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
});
afterEach(() => {
  vi.unstubAllGlobals();
  if (oldEnabled === undefined) delete process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_ENABLED;
  else process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_ENABLED = oldEnabled;
  if (oldSecret === undefined) delete process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_SECRET;
  else process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_SECRET = oldSecret;
  if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
  if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
});
describe("Stripe Connect financial event intake", () => {
  it("inserts a signed event as pending, never as already reconciled", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{
        organization_id: organizationId, provider: "stripe", mode: "sandbox",
      }] })
      .mockResolvedValueOnce({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(signedRequest(JSON.stringify(payload)));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, options] = fetchMock.mock.calls[1];
    const inserted = JSON.parse(options.body as string);
    expect(inserted.processing_state).toBe("pending");
    expect(inserted.organization_id).toBe(organizationId);
    expect(inserted.stripe_event_id).toBe(payload.id);
    expect(options).toMatchObject({
      method: "POST", redirect: "error",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    });
  });
  it("never acknowledges an event when persistence fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{
        organization_id: organizationId, provider: "stripe", mode: "sandbox",
      }] })
      .mockResolvedValueOnce({ ok: false, status: 503 }));
    const response = await POST(signedRequest(JSON.stringify(payload)));
    expect(response.status).toBe(503);
  });
  it("rejects a wrong signing secret before any database access", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = signedRequest(JSON.stringify(payload));
    process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_SECRET = "whsec_othersecret";
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("keeps the endpoint disabled by default", async () => {
    delete process.env.CIVICFLOW_CONNECT_FINANCIAL_WEBHOOK_ENABLED;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await POST(signedRequest(JSON.stringify(payload)))).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
