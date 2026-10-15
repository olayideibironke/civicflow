import { NextResponse } from "next/server";

const CONNECTOR = "stripe/civicflow-stripe-sandbox";
const SESSION_ID = /^cs_test_[A-Za-z0-9]+$/;
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
 const origin = process.env.CIVICFLOW_PUBLIC_ORIGIN;
 if (!origin || request.headers.get("origin") !== new URL(origin).origin)
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
 const oidc=request.headers.get("x-vercel-oidc-token")??process.env.VERCEL_OIDC_TOKEN??"";
 if (!oidc) return error("Stripe connector identity unavailable",503);
 const tokenResponse=await fetch(`https://api.vercel.com/v1/connect/token/${encodeURIComponent(CONNECTOR)}`,{
   method:"POST",headers:{Authorization:`Bearer ${oidc}`,"Content-Type":"application/json"},
   body:JSON.stringify({subject:{type:"app"},scopes:["*"]}),cache:"no-store"
 });
 const tokenData=await tokenResponse.json().catch(()=>null) as {token?:string}|null;
 if (!tokenResponse.ok||!tokenData?.token?.startsWith("sk_test_"))
   return error("Sandbox Stripe verification unavailable",503);
 // First look up the session on the connected firm account. The account ID is
 // obtained from CivicFlow's authorization-scoped invoice context, not the caller.
 // The platform lookup cannot retrieve direct charges on connected accounts.
 // Stripe Checkout's client_reference_id is read after finding its registered
 // account via the trusted RPC below.
 const lookup=await fetch(`${url}/rest/v1/rpc/get_authorized_invoice_checkout_session`,{
   method:"POST",headers:{apikey:anon,Authorization:bearer,"Content-Type":"application/json"},
   body:JSON.stringify({p_checkout_session_id:input.sessionId}),cache:"no-store"
 });
 if (!lookup.ok) return error("Checkout session not available for this client",403);
 const records=await lookup.json() as InvoiceContext[]|InvoiceContext;
 const context=Array.isArray(records)?records[0]:records;
 if (!context||context.connection_mode!=="sandbox") return error("Sandbox invoice unavailable",403);
 const stripeResponse=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(input.sessionId)}`,{
  headers:{Authorization:`Bearer ${tokenData.token}`,"Stripe-Account":context.connected_account_id},cache:"no-store"
 });
 if (!stripeResponse.ok) return error("Stripe could not verify this payment",409);
 const session=await stripeResponse.json() as StripeSession;
 if (session.id!==input.sessionId||session.mode!=="payment"||session.status!=="complete"||
 session.payment_status!=="paid"||session.livemode!==false||
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
