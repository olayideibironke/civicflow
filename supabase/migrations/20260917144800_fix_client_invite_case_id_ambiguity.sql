create or replace function public.accept_client_portal_invite(p_token text)
returns table(case_id uuid, case_number text, organization_name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_invite public.client_portal_invites%rowtype;
  v_case public.cases%rowtype;
  v_existing_role text;
  v_org_name text;
begin
  if v_user_id is null then
    raise exception 'User is not authenticated.';
  end if;

  if length(trim(coalesce(p_token, ''))) < 32 then
    raise exception 'Invite token is invalid.';
  end if;

  select i.* into v_invite
  from public.client_portal_invites i
  where i.token_hash = digest(trim(p_token), 'sha256')
    and i.accepted_at is null
    and i.expires_at > now()
  limit 1;

  if v_invite.id is null then
    raise exception 'This client invitation is invalid or expired.';
  end if;

  if v_user_email = '' or lower(v_invite.email) <> v_user_email then
    raise exception 'Sign in with the email address that received this invitation.';
  end if;

  select c.* into v_case
  from public.cases c
  where c.id = v_invite.case_id
  limit 1;

  if v_case.id is null then
    raise exception 'The case linked to this invitation was not found.';
  end if;

  select p.role into v_existing_role
  from public.profiles p
  where p.id = v_user_id;

  if v_existing_role is not null and v_existing_role <> 'client' then
    raise exception 'A staff account cannot be converted into a client account.';
  end if;

  insert into public.profiles (
    id,
    organization_id,
    first_name,
    last_name,
    role
  ) values (
    v_user_id,
    null,
    v_case.client_first_name,
    v_case.client_last_name,
    'client'
  )
  on conflict (id) do update
  set first_name = excluded.first_name,
      last_name = excluded.last_name,
      role = 'client',
      organization_id = null;

  insert into public.client_case_access (
    user_id,
    case_id,
    organization_id,
    created_by
  ) values (
    v_user_id,
    v_case.id,
    v_invite.organization_id,
    v_invite.created_by
  )
  on conflict on constraint client_case_access_user_id_case_id_key do nothing;

  update public.client_portal_invites i
  set accepted_by = v_user_id,
      accepted_at = now()
  where i.id = v_invite.id;

  select o.name into v_org_name
  from public.organizations o
  where o.id = v_invite.organization_id;

  return query select v_case.id, v_case.case_number, v_org_name;
end;
$$;

revoke all on function public.accept_client_portal_invite(text) from public, anon;
grant execute on function public.accept_client_portal_invite(text) to authenticated;
