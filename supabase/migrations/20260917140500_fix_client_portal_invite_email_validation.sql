create or replace function public.create_client_portal_invite(p_case_id uuid, p_email text default null)
returns table(invite_token text, invite_email text, case_number text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_case public.cases%rowtype;
  v_email text;
  v_token text;
  v_expiry timestamptz := now() + interval '7 days';
begin
  if auth.uid() is null then
    raise exception 'User is not authenticated.';
  end if;

  select c.* into v_case
  from public.cases c
  where c.id = p_case_id
  limit 1;

  if v_case.id is null or not public.is_staff_for_org(v_case.organization_id) then
    raise exception 'You do not have permission to invite a client for this case.';
  end if;

  v_email := lower(trim(coalesce(p_email, v_case.client_email, '')));

  if v_email = '' or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'A valid client email address is required.';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  update public.client_portal_invites
  set expires_at = now()
  where case_id = v_case.id
    and lower(email) = v_email
    and accepted_at is null
    and expires_at > now();

  insert into public.client_portal_invites (
    organization_id,
    case_id,
    email,
    token_hash,
    expires_at,
    created_by
  ) values (
    v_case.organization_id,
    v_case.id,
    v_email,
    digest(v_token, 'sha256'),
    v_expiry,
    auth.uid()
  );

  return query select v_token, v_email, v_case.case_number, v_expiry;
end;
$$;

revoke all on function public.create_client_portal_invite(uuid, text) from public, anon;
grant execute on function public.create_client_portal_invite(uuid, text) to authenticated;
