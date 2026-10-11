import { NextResponse } from "next/server";

function responseError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return responseError("CivicFlow webhook services are not configured.", 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return responseError("Missing Stripe signature.", 400);
  }

  const rawBody = await request.text();

  const rpcResponse = await fetch(
    `${supabaseUrl}/rest/v1/rpc/process_stripe_checkout_webhook`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_payload: rawBody,
        p_signature: signature,
      }),
      cache: "no-store",
    }
  );

  if (!rpcResponse.ok) {
    const detail = await rpcResponse.text();
    console.error("CivicFlow Stripe webhook database rejection", {
      status: rpcResponse.status,
      detail: detail.slice(0, 500),
    });
    return responseError("CivicFlow could not finalize the Stripe event.", 500);
  }

  return NextResponse.json({ received: true });
}
