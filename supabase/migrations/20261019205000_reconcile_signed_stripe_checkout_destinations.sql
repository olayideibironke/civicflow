-- Align deployed invoice webhook verification with distinct signed direct and Connect destinations.
-- Existing verified platform subscriptions must not enter attorney invoice posting.
create or replace function private.verify_civicflow_invoice_signature(p_payload text,p_signature text,p_mode text)
returns boolean language plpgsql security definer set search_path to 'pg_catalog','extensions','vault'
as $function$
declare
 v_secret text; v_secret_name text; v_timestamp_text text; v_timestamp bigint;
 v_expected text; v_part text; v_now bigint := floor(extract(epoch from now()))::bigint;
begin
 if p_mode not in ('live','sandbox') then return false; end if;
 foreach v_part in array string_to_array(coalesce(p_signature,''), ',') loop
  if split_part(trim(v_part),'=',1)='t' then v_timestamp_text:=split_part(trim(v_part),'=',2); exit; end if;
 end loop;
 if v_timestamp_text is null or v_timestamp_text !~ '^[0-9]+$' then return false; end if;
 v_timestamp:=v_timestamp_text::bigint;
 if abs(v_now-v_timestamp)>300 then return false; end if;
 for v_secret_name in select unnest(case when p_mode='live'
  then array['civicflow_invoice_connect_webhook_live','civicflow_stripe_webhook_live']
  else array['civicflow_invoice_connect_webhook_sandbox','civicflow_stripe_webhook_sandbox'] end)
 loop
  select ds.decrypted_secret into v_secret from vault.decrypted_secrets ds
   where ds.name=v_secret_name order by ds.updated_at desc limit 1;
  if v_secret is null or length(v_secret)=0 then continue; end if;
  v_expected:=encode(extensions.hmac(convert_to(v_timestamp_text||'.'||p_payload,'UTF8'),convert_to(v_secret,'UTF8'),'sha256'),'hex');
  foreach v_part in array string_to_array(coalesce(p_signature,''),',') loop
   if split_part(trim(v_part),'=',1)='v1' and lower(split_part(trim(v_part),'=',2))=lower(v_expected) then return true; end if;
  end loop;
 end loop;
 return false;
exception when others then return false;
end;
$function$;

-- Safely patch the deployed processing function without overwriting subsequent payment logic.
do $migration$
declare v_definition text; v_before text; v_after text;
begin
 v_definition:=pg_get_functiondef('public.process_stripe_checkout_webhook(text,text)'::regprocedure);
 if position('platform_subscription_checkout' in v_definition)>0 then return; end if;
 v_before:='  v_session_id := v_object ->> ''id'';';
 v_after:='  -- A signed platform subscription is not an attorney invoice checkout.'||chr(10)||
 '  if v_object ->> ''mode'' = ''subscription'' and v_account is null then'||chr(10)||
 '    return jsonb_build_object(''processed'', false, ''reason'', ''platform_subscription_checkout'');'||chr(10)||
 '  end if;'||chr(10)||chr(10)||v_before;
 if position(v_before in v_definition)=0 then raise exception 'Unexpected webhook function shape: refusing migration'; end if;
 execute replace(v_definition,v_before,v_after);
end;
$migration$;
