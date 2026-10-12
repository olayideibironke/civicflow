import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Subscription webhook is not configured." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }
  const payload = await request.text();
  if (payload.length > 1024 * 1024) {
    return NextResponse.json({ error: "Event too large." }, { status: 413 });
  }
  const response = await fetch(`${url}/rest/v1/rpc/process_civicflow_subscription_webhook`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_payload: payload, p_signature: signature }),
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) {
    console.error("CivicFlow subscription webhook processing failed", { status: response?.status });
    return NextResponse.json({ error: "Event processing failed." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
