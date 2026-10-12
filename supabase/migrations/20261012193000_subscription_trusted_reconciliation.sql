-- Provisioning is a trusted backend operation, never a client-side checkout callback.
-- Call only after retrieving the subscription from Stripe using the platform secret key,
-- checking customer, plan price, quantity, status, and organization ownership.
create or replace function public.reconcile_civicflow_subscription(
  p_subscription_id text,
  p_customer_id text,
  p_organization_id uuid,
  p_plan text,
  p_price_id text,
  p_seats integer,
  p_status text,
  p_livemode boolean
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, private
as $$
declare
  v private.civicflow_subscriptions%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required.';
  end if;
  if p_subscription_id !~ '^sub_[A-Za-z0-9]+$'
     or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
     or p_organization_id is null
     or p_plan not in ('basic','pro','advanced')
     or p_price_id !~ '^price_[A-Za-z0-9]+$'
     or p_seats not between 1 and 250
     or p_status not in ('active','trialing','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')
     or p_livemode is null then
    raise exception 'Invalid reconciliation parameters.';
  end if;
  select * into v from private.civicflow_subscriptions
    where stripe_subscription_id=p_subscription_id for update;
  if v.stripe_subscription_id is null then
    raise exception 'Subscription checkout must be registered before reconciliation.';
  end if;
  if v.stripe_customer_id <> p_customer_id or v.livemode <> p_livemode then
    raise exception 'Stripe subscription identity mismatch.';
  end if;
  if v.organization_id is not null and v.organization_id <> p_organization_id then
    raise exception 'Subscription already belongs to another organization.';
  end if;
  if exists(select 1 from private.civicflow_subscriptions
      where organization_id=p_organization_id and stripe_subscription_id<>p_subscription_id) then
    raise exception 'Organization already has another subscription.';
  end if;
  update private.civicflow_subscriptions
  set organization_id=p_organization_id,
      plan=p_plan, stripe_price_id=p_price_id, seats=p_seats,
      status=p_status, verified_at=now(), updated_at=now()
  where stripe_subscription_id=p_subscription_id;
  return jsonb_build_object('verified',true,'organization_id',p_organization_id);
end;
$$;
revoke all on function public.reconcile_civicflow_subscription(text,text,uuid,text,text,integer,text,boolean)
from public,anon,authenticated;
grant execute on function public.reconcile_civicflow_subscription(text,text,uuid,text,text,integer,text,boolean)
to service_role;
