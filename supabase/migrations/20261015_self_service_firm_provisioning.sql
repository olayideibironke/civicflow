-- Self-service firm provisioning. Apply only after reviewing existing RLS and signup policies.
-- Called by a verified, authenticated founder. Never accepts an arbitrary user id or role.
create or replace function public.provision_civicflow_firm(
  p_firm_name text,
  p_first_name text,
  p_last_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_existing_org uuid;
  v_org_id uuid;
  v_firm_name text := btrim(coalesce(p_firm_name, ''));
  v_first text := btrim(coalesce(p_first_name, ''));
  v_last text := btrim(coalesce(p_last_name, ''));
begin
  if v_user_id is null then
    raise exception 'Sign in is required' using errcode = '28000';
  end if;

  -- Serialize repeat requests from the same founder before checking membership.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text, 0));

  select email into v_email
  from auth.users
  where id = v_user_id and email_confirmed_at is not null;

  if v_email is null then
    raise exception 'Verify your email before creating a firm' using errcode = '28000';
  end if;

  if char_length(v_firm_name) not between 2 and 160
     or char_length(v_first) not between 1 and 80
     or char_length(v_last) not between 1 and 80 then
    raise exception 'Enter valid firm and administrator names' using errcode = '22023';
  end if;

  select organization_id into v_existing_org
  from public.profiles where id = v_user_id;

  if found then
    if v_existing_org is not null then
      -- Idempotent for an existing founder; never reassign an existing account.
      return v_existing_org;
    end if;
    raise exception 'Existing account requires administrator review' using errcode = '23505';
  end if;

  insert into public.organizations (
    name, slug, plan, primary_contact_name, primary_contact_email,
    public_intake_enabled
  ) values (
    v_firm_name,
    'firm-' || replace(gen_random_uuid()::text, '-', ''),
    'mvp',
    v_first || ' ' || v_last,
    v_email,
    false
  ) returning id into v_org_id;

  insert into public.profiles (
    id, organization_id, first_name, last_name, role, is_platform_admin
  ) values (
    v_user_id, v_org_id, v_first, v_last, 'admin', false
  );

  return v_org_id;
end;
$$;

revoke all on function public.provision_civicflow_firm(text,text,text) from public, anon;
grant execute on function public.provision_civicflow_firm(text,text,text) to authenticated;
