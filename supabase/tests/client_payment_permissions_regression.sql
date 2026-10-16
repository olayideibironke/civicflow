-- Disposable PostgreSQL only. Execute after the draft financial migrations.
-- Verify the RPC surface is closed to browser-facing database roles.
do $permissions$
declare
  rpc text;
  role_name text;
begin
  foreach rpc in array array[
    'public.authorize_client_payment_adjustment_posting(uuid,uuid)',
    'public.post_verified_client_payment_adjustment(uuid,uuid)'
  ] loop
    foreach role_name in array array['anon','authenticated'] loop
      if has_function_privilege(role_name, rpc, 'EXECUTE') then
        raise exception 'Browser role % can execute %', role_name, rpc;
      end if;
    end loop;
    if not has_function_privilege('service_role', rpc, 'EXECUTE') then
      raise exception 'Trusted service role cannot execute %', rpc;
    end if;
  end loop;
  foreach role_name in array array['anon','authenticated'] loop
    if has_table_privilege(role_name, 'public.client_payment_event_inbox', 'INSERT')
       or has_table_privilege(role_name, 'public.client_payment_event_inbox', 'UPDATE')
       or has_table_privilege(role_name, 'public.client_payment_adjustments', 'INSERT')
       or has_table_privilege(role_name, 'public.client_payment_adjustments', 'DELETE') then
      raise exception 'Browser role % has financial table mutation rights', role_name;
    end if;
  end loop;
end;
$permissions$;

-- Test actual execution under the browser-facing roles, not only ACL metadata.
-- Both calls must fail at the permission boundary before touching any data.
set role anon;
do $anon_denial$
begin
  begin
    perform public.authorize_client_payment_adjustment_posting(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222');
    raise exception 'Anonymous role executed financial authorization';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.post_verified_client_payment_adjustment(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222');
    raise exception 'Anonymous role executed financial posting';
  exception when insufficient_privilege then null;
  end;
end;
$anon_denial$;
reset role;

set role authenticated;
do $authenticated_denial$
begin
  begin
    perform public.authorize_client_payment_adjustment_posting(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222');
    raise exception 'Authenticated role executed financial authorization';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.post_verified_client_payment_adjustment(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222');
    raise exception 'Authenticated role executed financial posting';
  exception when insufficient_privilege then null;
  end;
end;
$authenticated_denial$;
reset role;

-- The CI fixture tables are created by postgres, unlike Supabase-managed
-- production tables. Mirror service-role table grants for this isolated test.
grant select on public.organizations, public.billing_invoices,
  public.billing_payments, public.organization_payment_connections
  to service_role;
grant select, insert, update on public.client_payment_event_inbox to service_role;
grant select, insert on public.client_payment_adjustments to service_role;

-- Prove the SECURITY INVOKER functions work with service_role privileges
-- rather than relying on the superuser's privileges from the main tests.
begin;
insert into public.organizations(id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
insert into public.billing_invoices(id,organization_id,currency)
 values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','cccccccc-cccc-4ccc-8ccc-cccccccccccc','usd');
insert into public.billing_payments
 (id,organization_id,invoice_id,amount_cents,status,processor,processor_reference)
 values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','cccccccc-cccc-4ccc-8ccc-cccccccccccc',
         'dddddddd-dddd-4ddd-8ddd-dddddddddddd',6000,'succeeded','stripe','pi_roletest');
insert into public.organization_payment_connections
 (organization_id,stripe_account_id,provider,mode)
 values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','acct_roletest','stripe','sandbox');
insert into public.client_payment_event_inbox
 (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
  stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
 values ('ffffffff-ffff-4fff-8fff-ffffffffffff','cccccccc-cccc-4ccc-8ccc-cccccccccccc',
         'acct_roletest','evt_roletest','re_roletest','pi_roletest',1200,'usd',
         'succeeded','refund.created',false,now());
set role service_role;
do $service_execution$
declare
  ledger_id uuid;
begin
  if not public.authorize_client_payment_adjustment_posting(
     'ffffffff-ffff-4fff-8fff-ffffffffffff','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') then
    raise exception 'Service role could not authorize valid adjustment';
  end if;
  ledger_id := public.post_verified_client_payment_adjustment(
     'ffffffff-ffff-4fff-8fff-ffffffffffff','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
  if ledger_id is null then
    raise exception 'Service role could not post valid adjustment';
  end if;
  if ledger_id is distinct from public.post_verified_client_payment_adjustment(
     'ffffffff-ffff-4fff-8fff-ffffffffffff','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') then
    raise exception 'Service role posting replay changed ledger identity';
  end if;
end;
$service_execution$;
reset role;
rollback;
