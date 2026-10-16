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
