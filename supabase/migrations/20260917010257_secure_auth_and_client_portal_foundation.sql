create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

update public.profiles
set is_platform_admin = true
where id = (
  select id
  from public.profiles
  order by created_at asc
  limit 1
)
and not exists (
  select 1 from public.profiles where is_platform_admin = true
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin','attorney','staff','paralegal','billing','intake','client'));
  end if;
end
$$;

alter table public.case_documents
  add column if not exists client_visible boolean not null default false;

alter table public.case_activity
  add column if not exists client_visible boolean not null default false;

create table if not exists public.client_case_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, case_id)
);

create index if not exists client_case_access_user_id_idx
  on public.client_case_access(user_id);
create index if not exists client_case_access_case_id_idx
  on public.client_case_access(case_id);
create index if not exists client_case_access_org_id_idx
  on public.client_case_access(organization_id);

alter table public.client_case_access enable row level security;

create table if not exists public.client_portal_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  email text not null,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists client_portal_invites_case_id_idx
  on public.client_portal_invites(case_id);
create index if not exists client_portal_invites_email_idx
  on public.client_portal_invites(lower(email));

alter table public.client_portal_invites enable row level security;

create table if not exists public.account_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('attorney','client')),
  organization_id uuid references public.organizations(id) on delete set null,
  organization_name text not null,
  full_name text not null,
  phone text not null,
  case_number text,
  status text not null default 'new' check (status in ('new','reviewing','resolved','closed')),
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_recovery_requests_org_id_idx
  on public.account_recovery_requests(organization_id);
create index if not exists account_recovery_requests_status_idx
  on public.account_recovery_requests(status);

alter table public.account_recovery_requests enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_platform_admin = true
  );
$$;

create or replace function public.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','attorney','staff','paralegal','billing','intake')
  );
$$;

create or replace function public.is_staff_for_org(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id = p_organization_id
      and p.role in ('admin','attorney','staff','paralegal','billing','intake')
  );
$$;

create or replace function public.is_client_for_case(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_case_access cca
    where cca.user_id = auth.uid()
      and cca.case_id = p_case_id
  );
$$;

create or replace function public.client_can_read_case_document(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1
    from public.case_documents d
    join public.client_case_access cca
      on cca.case_id = d.case_id
     and cca.user_id = auth.uid()
    where d.file_path = p_path
      and d.client_visible = true
  );
$$;

revoke all on function public.is_platform_admin() from public, anon;
revoke all on function public.is_staff_user() from public, anon;
revoke all on function public.is_staff_for_org(uuid) from public, anon;
revoke all on function public.is_client_for_case(uuid) from public, anon;
revoke all on function public.client_can_read_case_document(text) from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_staff_user() to authenticated;
grant execute on function public.is_staff_for_org(uuid) to authenticated;
grant execute on function public.is_client_for_case(uuid) to authenticated;
grant execute on function public.client_can_read_case_document(text) to authenticated;

create or replace function public.get_staff_workspace()
returns table(
  email text,
  profile_id uuid,
  organization_id uuid,
  first_name text,
  last_name text,
  role text,
  organization_name text,
  organization_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := coalesce(auth.jwt() ->> 'email', '');
  v_profile public.profiles%rowtype;
  v_organization public.organizations%rowtype;
begin
  if v_user_id is null then
    raise exception 'User is not authenticated.';
  end if;

  select p.* into v_profile
  from public.profiles p
  where p.id = v_user_id
  limit 1;

  if v_profile.id is null then
    raise exception 'No staff profile exists for this account.';
  end if;

  if v_profile.role not in ('admin','attorney','staff','paralegal','billing','intake') then
    raise exception 'This account does not have staff workspace access.';
  end if;

  if v_profile.organization_id is null then
    raise exception 'Staff account is not assigned to an organization.';
  end if;

  select o.* into v_organization
  from public.organizations o
  where o.id = v_profile.organization_id
  limit 1;

  if v_organization.id is null then
    raise exception 'Organization linked to this staff profile was not found.';
  end if;

  return query
  select
    v_email,
    v_profile.id,
    v_profile.organization_id,
    coalesce(v_profile.first_name, ''),
    coalesce(v_profile.last_name, ''),
    v_profile.role,
    v_organization.name,
    v_organization.slug;
end;
$$;

revoke all on function public.get_staff_workspace() from public, anon;
grant execute on function public.get_staff_workspace() to authenticated;

create or replace function public.get_client_workspace()
returns table(
  email text,
  profile_id uuid,
  first_name text,
  last_name text,
  case_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := coalesce(auth.jwt() ->> 'email', '');
  v_profile public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'User is not authenticated.';
  end if;

  select p.* into v_profile
  from public.profiles p
  where p.id = v_user_id
  limit 1;

  if v_profile.id is null or v_profile.role <> 'client' then
    raise exception 'This account does not have client portal access.';
  end if;

  return query
  select
    v_email,
    v_profile.id,
    coalesce(v_profile.first_name, ''),
    coalesce(v_profile.last_name, ''),
    (select count(*) from public.client_case_access cca where cca.user_id = v_user_id);
end;
$$;

revoke all on function public.get_client_workspace() from public, anon;
grant execute on function public.get_client_workspace() to authenticated;

create or replace function public.get_client_cases()
returns table(
  case_id uuid,
  case_number text,
  organization_name text,
  service_category text,
  priority text,
  status text,
  assigned_to text,
  decision_outcome text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.case_number,
    o.name,
    c.service_category,
    c.priority,
    c.status,
    c.assigned_to,
    c.decision_outcome,
    c.created_at,
    c.updated_at
  from public.client_case_access cca
  join public.cases c on c.id = cca.case_id
  join public.organizations o on o.id = cca.organization_id
  where cca.user_id = auth.uid()
  order by c.updated_at desc;
$$;

revoke all on function public.get_client_cases() from public, anon;
grant execute on function public.get_client_cases() to authenticated;

create or replace function public.get_client_documents(p_case_id uuid)
returns table(
  document_id uuid,
  case_id uuid,
  name text,
  description text,
  status text,
  file_name text,
  file_path text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    d.case_id,
    d.name,
    d.description,
    d.status,
    d.file_name,
    d.file_path,
    d.created_at,
    d.updated_at
  from public.case_documents d
  where d.case_id = p_case_id
    and d.client_visible = true
    and exists (
      select 1
      from public.client_case_access cca
      where cca.user_id = auth.uid()
        and cca.case_id = d.case_id
    )
  order by d.created_at desc;
$$;

revoke all on function public.get_client_documents(uuid) from public, anon;
grant execute on function public.get_client_documents(uuid) to authenticated;

create or replace function public.get_client_activity(p_case_id uuid)
returns table(
  activity_id uuid,
  case_id uuid,
  title text,
  detail text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.case_id,
    a.title,
    a.detail,
    a.created_at
  from public.case_activity a
  where a.case_id = p_case_id
    and a.client_visible = true
    and exists (
      select 1
      from public.client_case_access cca
      where cca.user_id = auth.uid()
        and cca.case_id = a.case_id
    )
  order by a.created_at desc;
$$;

revoke all on function public.get_client_activity(uuid) from public, anon;
grant execute on function public.get_client_activity(uuid) to authenticated;

create or replace function public.update_my_profile(p_first_name text, p_last_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'User is not authenticated.';
  end if;

  if length(trim(coalesce(p_first_name, ''))) = 0
     or length(trim(coalesce(p_last_name, ''))) = 0 then
    raise exception 'First name and last name are required.';
  end if;

  update public.profiles
  set first_name = trim(p_first_name),
      last_name = trim(p_last_name)
  where id = auth.uid();

  if not found then
    raise exception 'Profile was not found.';
  end if;
end;
$$;

revoke all on function public.update_my_profile(text, text) from public, anon;
grant execute on function public.update_my_profile(text, text) to authenticated;

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

  if v_email = '' or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
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
  on conflict (user_id, case_id) do nothing;

  update public.client_portal_invites
  set accepted_by = v_user_id,
      accepted_at = now()
  where id = v_invite.id;

  select o.name into v_org_name
  from public.organizations o
  where o.id = v_invite.organization_id;

  return query select v_case.id, v_case.case_number, v_org_name;
end;
$$;

revoke all on function public.accept_client_portal_invite(text) from public, anon;
grant execute on function public.accept_client_portal_invite(text) to authenticated;

create or replace function public.submit_account_recovery_request(
  p_account_type text,
  p_organization_name text,
  p_full_name text,
  p_phone text,
  p_case_number text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_request_id uuid;
  v_phone text;
begin
  if p_account_type not in ('attorney','client') then
    raise exception 'Account type is invalid.';
  end if;

  if length(trim(coalesce(p_organization_name, ''))) < 2 then
    raise exception 'Firm or organization name is required.';
  end if;

  if length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Full name is required.';
  end if;

  v_phone := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_phone) <> 10 then
    raise exception 'Phone number must be exactly 10 digits.';
  end if;

  select o.id into v_org_id
  from public.organizations o
  where lower(o.name) = lower(trim(p_organization_name))
     or lower(o.slug) = lower(trim(p_organization_name))
  order by case when lower(o.name) = lower(trim(p_organization_name)) then 0 else 1 end
  limit 1;

  insert into public.account_recovery_requests (
    account_type,
    organization_id,
    organization_name,
    full_name,
    phone,
    case_number
  ) values (
    p_account_type,
    v_org_id,
    trim(p_organization_name),
    trim(p_full_name),
    v_phone,
    nullif(trim(coalesce(p_case_number, '')), '')
  ) returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.submit_account_recovery_request(text, text, text, text, text) from public;
grant execute on function public.submit_account_recovery_request(text, text, text, text, text) to anon, authenticated;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.submit_public_intake(text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_public_intake_settings(text) from public;
grant execute on function public.get_public_intake_settings(text) to anon, authenticated;
revoke all on function public.submit_public_intake_for_org(text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_public_intake_for_org(text, text, text, text, text, text, text, text) to anon, authenticated;

drop policy if exists "Staff insert org activity" on public.case_activity;
drop policy if exists "Staff read org activity" on public.case_activity;
create policy "Staff insert org activity" on public.case_activity
for insert to authenticated
with check (public.is_staff_for_org(organization_id));
create policy "Staff read org activity" on public.case_activity
for select to authenticated
using (public.is_staff_for_org(organization_id));

drop policy if exists "Staff insert org documents" on public.case_documents;
drop policy if exists "Staff read org documents" on public.case_documents;
drop policy if exists "Staff update org documents" on public.case_documents;
create policy "Staff insert org documents" on public.case_documents
for insert to authenticated
with check (public.is_staff_for_org(organization_id));
create policy "Staff read org documents" on public.case_documents
for select to authenticated
using (public.is_staff_for_org(organization_id));
create policy "Staff update org documents" on public.case_documents
for update to authenticated
using (public.is_staff_for_org(organization_id))
with check (public.is_staff_for_org(organization_id));

drop policy if exists "Staff insert org notes" on public.case_notes;
drop policy if exists "Staff read org notes" on public.case_notes;
drop policy if exists "Staff update org notes" on public.case_notes;
create policy "Staff insert org notes" on public.case_notes
for insert to authenticated
with check (public.is_staff_for_org(organization_id));
create policy "Staff read org notes" on public.case_notes
for select to authenticated
using (public.is_staff_for_org(organization_id));
create policy "Staff update org notes" on public.case_notes
for update to authenticated
using (public.is_staff_for_org(organization_id))
with check (public.is_staff_for_org(organization_id));

drop policy if exists "Staff insert org cases" on public.cases;
drop policy if exists "Staff read org cases" on public.cases;
drop policy if exists "Staff update org cases" on public.cases;
create policy "Staff insert org cases" on public.cases
for insert to authenticated
with check (public.is_staff_for_org(organization_id));
create policy "Staff read org cases" on public.cases
for select to authenticated
using (public.is_staff_for_org(organization_id));
create policy "Staff update org cases" on public.cases
for update to authenticated
using (public.is_staff_for_org(organization_id))
with check (public.is_staff_for_org(organization_id));

drop policy if exists "Staff read org intake submissions" on public.intake_submissions;
create policy "Staff read org intake submissions" on public.intake_submissions
for select to authenticated
using (organization_id is not null and public.is_staff_for_org(organization_id));

drop policy if exists "Staff can update organization settings" on public.organizations;
drop policy if exists "Staff can view organization settings" on public.organizations;
drop policy if exists "Staff read own organization" on public.organizations;
create policy "Staff read own organization" on public.organizations
for select to authenticated
using (public.is_staff_for_org(id));
create policy "Staff update own organization" on public.organizations
for update to authenticated
using (public.is_staff_for_org(id))
with check (public.is_staff_for_org(id));

drop policy if exists "Authenticated staff can read demo requests" on public.demo_requests;
drop policy if exists "Authenticated staff can update demo requests" on public.demo_requests;
create policy "Platform admin can read demo requests" on public.demo_requests
for select to authenticated
using (public.is_platform_admin());
create policy "Platform admin can update demo requests" on public.demo_requests
for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Client read own case access" on public.client_case_access
for select to authenticated
using (user_id = auth.uid());
create policy "Staff read org client access" on public.client_case_access
for select to authenticated
using (public.is_staff_for_org(organization_id));
create policy "Staff create org client access" on public.client_case_access
for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_id and c.organization_id = organization_id
  )
);
create policy "Staff delete org client access" on public.client_case_access
for delete to authenticated
using (public.is_staff_for_org(organization_id));

create policy "Staff read org client invites" on public.client_portal_invites
for select to authenticated
using (public.is_staff_for_org(organization_id));
create policy "Staff create org client invites" on public.client_portal_invites
for insert to authenticated
with check (public.is_staff_for_org(organization_id) and created_by = auth.uid());
create policy "Staff update org client invites" on public.client_portal_invites
for update to authenticated
using (public.is_staff_for_org(organization_id))
with check (public.is_staff_for_org(organization_id));

create policy "Platform admin read recovery requests" on public.account_recovery_requests
for select to authenticated
using (public.is_platform_admin());
create policy "Organization staff read recovery requests" on public.account_recovery_requests
for select to authenticated
using (organization_id is not null and public.is_staff_for_org(organization_id));
create policy "Platform admin update recovery requests" on public.account_recovery_requests
for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Staff read org case documents" on storage.objects;
drop policy if exists "Staff update org case documents" on storage.objects;
drop policy if exists "Staff upload org case documents" on storage.objects;
create policy "Staff read org case documents" on storage.objects
for select to authenticated
using (
  bucket_id = 'case-documents'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','attorney','staff','paralegal','billing','intake')
      and p.organization_id::text = (storage.foldername(name))[1]
  )
);
create policy "Staff update org case documents" on storage.objects
for update to authenticated
using (
  bucket_id = 'case-documents'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','attorney','staff','paralegal','billing','intake')
      and p.organization_id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'case-documents'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','attorney','staff','paralegal','billing','intake')
      and p.organization_id::text = (storage.foldername(name))[1]
  )
);
create policy "Staff upload org case documents" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'case-documents'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','attorney','staff','paralegal','billing','intake')
      and p.organization_id::text = (storage.foldername(name))[1]
  )
);
create policy "Clients read shared case documents" on storage.objects
for select to authenticated
using (
  bucket_id = 'case-documents'
  and public.client_can_read_case_document(name)
);
