-- Platform webhook signing secrets must not be shared with law-firm invoice Connect webhooks.
-- Provision Vault names civicflow_subscription_webhook_live and
-- civicflow_subscription_webhook_sandbox separately before enabling checkout.
create or replace function private.verify_civicflow_subscription_signature(
  p_payload text, p_signature text, p_mode text
) returns boolean
language plpgsql security definer
set search_path = pg_catalog, extensions, vault
as $$
declare
  v_secret text;
  v_timestamp_text text;
  v_timestamp bigint;
  v_expected text;
  v_part text;
begin
  if p_mode not in ('live','sandbox') then return false; end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets
  where name = case when p_mode='live' then 'civicflow_subscription_webhook_live'
                    else 'civicflow_subscription_webhook_sandbox' end
  order by updated_at desc limit 1;
  if coalesce(length(v_secret),0)=0 then return false; end if;
  foreach v_part in array string_to_array(coalesce(p_signature,''),',') loop
    if split_part(trim(v_part),'=',1)='t' then
      v_timestamp_text := split_part(trim(v_part),'=',2);
      exit;
    end if;
  end loop;
  if coalesce(v_timestamp_text,'') !~ '^[0-9]{1,15}$' then return false; end if;
  v_timestamp := v_timestamp_text::bigint;
  if abs(floor(extract(epoch from now()))::bigint-v_timestamp)>300 then return false; end if;
  v_expected := encode(extensions.hmac(
    convert_to(v_timestamp_text||'.'||p_payload,'UTF8'),
    convert_to(v_secret,'UTF8'),'sha256'),'hex');
  foreach v_part in array string_to_array(coalesce(p_signature,''),',') loop
    if split_part(trim(v_part),'=',1)='v1'
       and lower(split_part(trim(v_part),'=',2))=v_expected then return true; end if;
  end loop;
  return false;
exception when others then return false;
end;
$$;
revoke all on function private.verify_civicflow_subscription_signature(text,text,text)
from public,anon,authenticated;

-- Platform subscriptions are separate from law-firm client invoice payments.
-- Subscription checkout must remain disabled until this migration and its webhook are configured.
create table if not exists private.civicflow_subscriptions (
  stripe_subscription_id text primary key,
  stripe_customer_id text not null,
  checkout_reference text unique,
  checkout_session_id text unique,
  customer_email text,
  firm_name text,
  plan text not null check (plan in ('basic','pro','advanced')),
  seats integer not null check (seats between 1 and 250),
  stripe_price_id text,
  status text not null,
  organization_id uuid unique references public.organizations(id) on delete set null,
  livemode boolean not null default false,
  last_event_created bigint not null default 0,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
revoke all on private.civicflow_subscriptions from public, anon, authenticated;
create table if not exists private.civicflow_subscription_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);
revoke all on private.civicflow_subscription_events from public, anon, authenticated;

create or replace function public.process_civicflow_subscription_webhook(
  p_payload text, p_signature text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, private
as $$
declare
  e jsonb;
  o jsonb;
  typ text;
  sid text;
  plan text;
  seats integer;
  event_created bigint;
  inserted integer;
begin
  e := p_payload::jsonb;
  if not private.verify_civicflow_subscription_signature(p_payload,p_signature,
      case when coalesce((e->>'livemode')::boolean,false) then 'live' else 'sandbox' end) then
    raise exception 'Invalid subscription webhook signature.';
  end if;
  if e->>'account' is not null then
    raise exception 'Connected account events are not platform subscriptions.';
  end if;
  event_created := coalesce((e->>'created')::bigint,0);
  typ := e->>'type';
  o := e #> '{data,object}';
  if e->>'id' is null or o is null then raise exception 'Invalid event.'; end if;
  if typ not in ('checkout.session.completed','customer.subscription.created',
    'customer.subscription.updated','customer.subscription.deleted') then
    return jsonb_build_object('processed',false,'reason','ignored');
  end if;
  insert into private.civicflow_subscription_events(event_id,event_type)
    values (e->>'id',typ) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted=0 then return jsonb_build_object('processed',false,'reason','duplicate'); end if;
  if typ='checkout.session.completed' then
    if o->>'mode' is distinct from 'subscription' then
      return jsonb_build_object('processed',false,'reason','not_subscription');
    end if;
    sid := o->>'subscription';
    if sid !~ '^sub_[A-Za-z0-9]+$'
       or coalesce(o->>'customer','') !~ '^cus_[A-Za-z0-9]+$'
       or coalesce(o->>'id','') !~ '^cs_(test_|live_)[A-Za-z0-9]+$'
       or (coalesce((e->>'livemode')::boolean,false) and o->>'id' !~ '^cs_live_')
       or (not coalesce((e->>'livemode')::boolean,false) and o->>'id' !~ '^cs_test_') then
      raise exception 'Invalid checkout identity or payment mode.';
    end if;
    if coalesce(o->>'client_reference_id','') !~ '^[0-9a-fA-F-]{36}$'
       or o->>'status' is distinct from 'complete'
       or o->>'payment_status' not in ('paid','no_payment_required') then
      raise exception 'Invalid checkout completion.';
    end if;
    plan := o #>> '{metadata,plan}';
    seats := nullif(o #>> '{metadata,seats}','')::integer;
    if plan not in ('basic','pro','advanced') or seats not between 1 and 250 then
      raise exception 'Invalid subscription metadata.';
    end if;
    insert into private.civicflow_subscriptions(
      stripe_subscription_id,stripe_customer_id,checkout_reference,checkout_session_id,customer_email,
      firm_name,plan,seats,stripe_price_id,status,last_event_created,livemode
    ) values (
      sid,o->>'customer',o->>'client_reference_id',o->>'id',o #>> '{customer_details,email}',
      o #>> '{metadata,firm_name}',plan,seats,null,'pending_verification',
      event_created,coalesce((e->>'livemode')::boolean,false)
    ) on conflict (stripe_subscription_id) do update
      set checkout_session_id=excluded.checkout_session_id,
          checkout_reference=excluded.checkout_reference,
          customer_email=coalesce(excluded.customer_email,private.civicflow_subscriptions.customer_email),
          firm_name=coalesce(excluded.firm_name,private.civicflow_subscriptions.firm_name),
          updated_at=now()
      where private.civicflow_subscriptions.stripe_customer_id=excluded.stripe_customer_id
        and private.civicflow_subscriptions.livemode=excluded.livemode
        and (private.civicflow_subscriptions.checkout_reference is null
             or private.civicflow_subscriptions.checkout_reference=excluded.checkout_reference)
        and (private.civicflow_subscriptions.checkout_session_id is null
             or private.civicflow_subscriptions.checkout_session_id=excluded.checkout_session_id)
        and private.civicflow_subscriptions.plan=excluded.plan
        and private.civicflow_subscriptions.seats=excluded.seats;
    get diagnostics inserted = row_count;
    if inserted <> 1 then raise exception 'Conflicting subscription checkout identity.'; end if;
    return jsonb_build_object('processed',true,'status','pending_verification');
  end if;
  sid := o->>'id';
  if sid is null then raise exception 'Missing subscription id.'; end if;
  -- Stripe does not guarantee checkout.session.completed arrives before subscription.created.
  -- Record unlinked subscription events as pending, including update/delete events
  -- that arrive before checkout or created. Only reconciliation can verify them.
  if typ in ('customer.subscription.created','customer.subscription.updated','customer.subscription.deleted')
     and o->>'customer' is not null then
    plan := o #>> '{metadata,plan}';
    seats := nullif(o #>> '{metadata,seats}','')::integer;
    if plan in ('basic','pro','advanced') and seats between 1 and 250 then
      insert into private.civicflow_subscriptions (
        stripe_subscription_id,stripe_customer_id,plan,seats,status,livemode,last_event_created
      ) values (
        sid,o->>'customer',plan,seats,'pending_verification',
        coalesce((e->>'livemode')::boolean,false),event_created
      ) on conflict (stripe_subscription_id) do nothing;
    end if;
  end if;
  -- Never create entitlements from unlinked or unverified Stripe subscription data.
  update private.civicflow_subscriptions s
  set status=case when typ='customer.subscription.deleted' then 'canceled'
      else coalesce(o->>'status',s.status) end,
      -- A verified subscription must be rechecked against Stripe after any plan,
      -- price or seat change. Until then, entitlement lookup fails closed.
      verified_at=case
        when typ='customer.subscription.deleted' then null
        when s.verified_at is not null and (
          jsonb_array_length(coalesce(o #> '{items,data}','[]'::jsonb)) <> 1
          or (o #>> '{items,data,0,price,id}') is distinct from s.stripe_price_id
          or (o #>> '{items,data,0,quantity}') is distinct from s.seats::text
          or (o #>> '{metadata,plan}') is distinct from s.plan
        ) then null
        else s.verified_at end,
      last_event_created=coalesce((e->>'created')::bigint,0),
      updated_at=now()
  where s.stripe_subscription_id=sid
    and s.livemode=coalesce((e->>'livemode')::boolean,false)
    and event_created>=s.last_event_created;
  return jsonb_build_object('processed',true,'status','recorded');
end;
$$;
revoke all on function public.process_civicflow_subscription_webhook(text,text) from public,anon,authenticated;
grant execute on function public.process_civicflow_subscription_webhook(text,text) to service_role;

-- Entitlements are explicitly provisioned by trusted service-role operations only.
-- No customer metadata, email match or client-side callback can grant access.
create or replace function public.get_civicflow_subscription_entitlement(p_organization_id uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, private
as $$
declare
  v private.civicflow_subscriptions%rowtype;
begin
  if auth.uid() is null or not public.is_staff_for_org(p_organization_id) then
    raise exception 'Not authorized for this organization.';
  end if;
  select * into v from private.civicflow_subscriptions
  where organization_id=p_organization_id
  limit 1;
  if v.stripe_subscription_id is null then
    return jsonb_build_object('active',false,'seats',0);
  end if;
  return jsonb_build_object(
    'active',v.status in ('active','trialing') and v.verified_at is not null,
    'plan',v.plan,
    'seats',case when v.status in ('active','trialing') and v.verified_at is not null then v.seats else 0 end,
    'status',v.status
  );
end;
$$;
revoke all on function public.get_civicflow_subscription_entitlement(uuid) from public,anon;
grant execute on function public.get_civicflow_subscription_entitlement(uuid) to authenticated;
