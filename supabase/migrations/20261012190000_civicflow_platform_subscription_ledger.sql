-- Platform subscriptions are separate from law-firm client invoice payments.
-- Subscription checkout must remain disabled until this migration and its webhook are configured.
create table if not exists private.civicflow_subscriptions (
  stripe_subscription_id text primary key,
  stripe_customer_id text not null,
  checkout_session_id text unique,
  customer_email text,
  firm_name text,
  plan text not null check (plan in ('basic','pro','advanced')),
  seats integer not null check (seats between 1 and 250),
  stripe_price_id text not null,
  status text not null,
  organization_id uuid unique references public.organizations(id) on delete set null,
  last_event_created bigint not null default 0,
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
  price text;
  event_created bigint;
  inserted integer;
  expected_price text;
begin
  e := p_payload::jsonb;
  if coalesce((e->>'livemode')::boolean,false) is distinct from true then
    raise exception 'Live subscription event expected.';
  end if;
  if not private.verify_stripe_signature(p_payload,p_signature,'live') then
    raise exception 'Invalid subscription webhook signature.';
  end if;
  if e->>'account' is not null then
    raise exception 'Connected account events are not platform subscriptions.';
  end if;
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
    if o->>'mode' <> 'subscription' then
      return jsonb_build_object('processed',false,'reason','not_subscription');
    end if;
    sid := o->>'subscription';
    if sid is null or o->>'customer' is null then raise exception 'Missing subscription.'; end if;
    plan := o #>> '{metadata,plan}';
    seats := nullif(o #>> '{metadata,seats}','')::integer;
    if plan not in ('basic','pro','advanced') or seats not between 1 and 250 then
      raise exception 'Invalid subscription metadata.';
    end if;
    insert into private.civicflow_subscriptions(
      stripe_subscription_id,stripe_customer_id,checkout_session_id,customer_email,
      firm_name,plan,seats,stripe_price_id,status,last_event_created
    ) values (
      sid,o->>'customer',o->>'id',o #>> '{customer_details,email}',
      o #>> '{metadata,firm_name}',plan,seats,'pending_verification','pending_verification',
      coalesce((e->>'created')::bigint,0)
    ) on conflict (stripe_subscription_id) do update
      set checkout_session_id=excluded.checkout_session_id,
          updated_at=now();
    return jsonb_build_object('processed',true,'status','pending_verification');
  end if;
  sid := o->>'id';
  if sid is null then raise exception 'Missing subscription id.'; end if;
  -- Never create entitlements from unlinked or unverified Stripe subscription data.
  update private.civicflow_subscriptions s
  set status=case when typ='customer.subscription.deleted' then 'canceled'
      else coalesce(o->>'status',s.status) end,
      last_event_created=coalesce((e->>'created')::bigint,0),
      updated_at=now()
  where s.stripe_subscription_id=sid
    and coalesce((e->>'created')::bigint,0)>=s.last_event_created;
  return jsonb_build_object('processed',true,'status','recorded');
end;
$$;
revoke all on function public.process_civicflow_subscription_webhook(text,text) from public,anon,authenticated;
grant execute on function public.process_civicflow_subscription_webhook(text,text) to service_role;
