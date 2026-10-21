import { NextResponse } from "next/server";

const SANDBOX_CONNECTOR = "stripe/civicflow-stripe-sandbox";
const LIVE_CONNECTOR = process.env.CIVICFLOW_STRIPE_LIVE_CONNECTOR;
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;
type StripeSession = {
 id?: string; mode?: string; status?: string; payment_status?: string;
 amount_total?: number; currency?: string; payment_intent?: string;
 client_reference_id?: string; livemode?: boolean;
 metadata?: Record<string,string>;
};
type InvoiceContext = {
 invoice_id:string; organization_id:string; case_id:string; balance_cents:number;
 currency:string; connected_account_id:string; connection_mode:string;
};
function error(message:string,status:number) {return NextResponse.json({error:message},{status});}

export async function POST(request:Request) {
 // CivicFlow serves both apex and www. Accept only these two trusted
 // first-party origins; never accept an arbitrary request Host or Origin.
 const configuredOrigin = process.env.CIVICFLOW_PUBLIC_ORIGIN;
 if (!configuredOrigin) return error("Payment origin unavailable",503);
 let trustedOrigins: Set<string>;
 try {
   const canonical = new URL(configuredOrigin);
   const apexHost = canonical.hostname.startsWith("www.") ? canonical.hostname.slice(4) : canonical.hostname;
   trustedOrigins = new Set([
     canonical.origin,
     `${canonical.protocol}//${apexHost}${canonical.port ? ":" + canonical.port : ""}`,
     `${canonical.protocol}//www.${apexHost}${canonical.port ? ":" + canonical.port : ""}`,
   ]);
 } catch {
   return error("Payment origin unavailable",503);
 }
 const requestOrigin = request.headers.get("origin");
 if (!requestOrigin || !trustedOrigins.has(requestOrigin) ||
     !trustedOrigins.has(new URL(request.url).origin))
   return error("Origin not allowed",403);
 const bearer = request.headers.get("authorization");
 if (!bearer?.startsWith("Bearer ")) return error("Authentication required",401);
 const input = await request.json().catch(()=>null) as {sessionId?:unknown}|null;
 if (typeof input?.sessionId !== "string" || !SESSION_ID.test(input.sessionId))
   return error("Invalid checkout session",400);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url||!anon||!service) return error("Payment reconciliation unavailable",503);
 const lookup=await fetch(`${url}/rest/v1/rpc/get_authorized_invoice_checkout_session`,{
   method:"POST",headers:{apikey:anon,Authorization:bearer,"Content-Type":"application/json"},
   body:JSON.stringify({p_checkout_session_id:input.sessionId}),cache:"no-store"
 });
 if (!lookup.ok) return error("Checkout session not available for this client",403);
 const records=await lookup.json() as InvoiceContext[]|InvoiceContext;
 const context=Array.isArray(records)?records[0]:records;
 if (!context || !["sandbox","live"].includes(context.connection_mode)) return error("Invoice payment mode unavailable",403);
 const live=context.connection_mode==="live";
 if ((live && !input.sessionId.startsWith("cs_live_")) || (!live && !input.sessionId.startsWith("cs_test_")))
   return error("Checkout session mode mismatch",403);
 if (live && (process.env.VERCEL_ENV!=="production" || process.env.CIVICFLOW_LIVE_INVOICES_ENABLED!=="true"))
   return error("Live invoice reconciliation is disabled",503);
 const directLiveKey=live && process.env.VERCEL_ENV==="production" && /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? "") ? process.env.STRIPE_SECRET_KEY : "";
 const connector=live ? LIVE_CONNECTOR : SANDBOX_CONNECTOR;
 if (!directLiveKey && (!connector || !/^stripe\/[a-z0-9-]+$/.test(connector))) return error("Stripe connector unavailable",503);
 const oidc=request.headers.get("x-vercel-oidc-token")??process.env.VERCEL_OIDC_TOKEN??"";
 if (!oidc && !directLiveKey) return error("Stripe connector identity unavailable",503);
 const tokenResponse=directLiveKey ? null : await fetch(`https://api.vercel.com/v1/connect/token/${encodeURIComponent(connector!)}`,{
   method:"POST",headers:{Authorization:`Bearer ${oidc}`,"Content-Type":"application/json"},
   body:JSON.stringify({subject:{type:"app"},scopes:["*"]}),cache:"no-store"
 });
 const tokenData=directLiveKey ? {token:directLiveKey} : await tokenResponse!.json().catch(()=>null) as {token?:string}|null;
 if ((!directLiveKey && !tokenResponse?.ok)||!(live ? /^(sk|rk)_live_/.test(tokenData?.token ?? "") : /^(sk|rk)_test_/.test(tokenData?.token ?? "")))
   return error("Stripe verification unavailable",503);
 // First look up the session on the connected firm account. The account ID is
 // obtained from CivicFlow's authorization-scoped invoice context, not the caller.
 // The platform lookup cannot retrieve direct charges on connected accounts.
 // Stripe Checkout's client_reference_id is read after finding its registered
 // account via the trusted RPC below.
 const stripeResponse=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(input.sessionId)}`,{
  headers:{Authorization:`Bearer ${tokenData.token}`,"Stripe-Account":context.connected_account_id},cache:"no-store"
 });
 if (!stripeResponse.ok) return error("Stripe could not verify this payment",409);
 const session=await stripeResponse.json() as StripeSession;
 if (session.id!==input.sessionId||session.mode!=="payment"||session.status!=="complete"||
 session.payment_status!=="paid"||session.livemode!==live||
 session.client_reference_id!==context.invoice_id||
 session.amount_total!==context.balance_cents||session.currency?.toLowerCase()!==context.currency.toLowerCase()||
 session.metadata?.invoice_id!==context.invoice_id||
 session.metadata?.organization_id!==context.organization_id||
 session.metadata?.case_id!==context.case_id||
 !session.payment_intent?.startsWith("pi_"))
 return error("Stripe payment details do not match the invoice",409);
 const settled=await fetch(`${url}/rest/v1/rpc/reconcile_verified_invoice_checkout`,{
  method:"POST",headers:{apikey:service,Authorization:`Bearer ${service}`,"Content-Type":"application/json"},
  body:JSON.stringify({p_checkout_session_id:session.id,p_connected_account_id:context.connected_account_id,
   p_invoice_id:context.invoice_id,p_organization_id:context.organization_id,p_case_id:context.case_id,
   p_amount_cents:session.amount_total,p_currency:session.currency,p_payment_intent_id:session.payment_intent}),cache:"no-store"
 });
 if(!settled.ok){console.error("Verified invoice reconciliation rejected",{status:settled.status});
   return error("Verified payment requires accounting review",409);}
 return NextResponse.json({reconciled:true});
}
