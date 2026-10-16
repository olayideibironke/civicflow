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
