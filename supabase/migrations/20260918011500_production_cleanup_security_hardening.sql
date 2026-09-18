
-- CivicFlow production cleanup and targeted security hardening.
-- Keeps the current product architecture; only removes legacy defaults and
-- closes tenant-integrity/storage gaps found in the production audit.

alter table public.organizations
  alter column default_service_categories
  set default array[
    'Criminal Defense'::text,
    'Family Law'::text,
    'Immigration'::text,
    'Civil Litigation'::text,
    'General Legal Matter'::text
  ];

alter table public.cases
  alter column source set default 'Client Intake'::text;

alter table public.case_notes
  alter column created_by set default 'Staff'::text;

-- Legacy single-workspace intake RPC is no longer used by the application.
drop function if exists public.submit_public_intake(
  text, text, text, text, text, text, text
);

create or replace function public.get_public_intake_settings(p_slug text default null)
returns table(
  organization_id uuid,
  organization_name text,
  organization_slug text,
  public_intake_enabled boolean,
  service_categories text[],
  priority_options text[],
  support_email text
)
language sql
security definer
set search_path = public
as $$
  select
    o.id,
    o.name,
    o.slug,
    coalesce(o.public_intake_enabled, true),
    coalesce(
      o.default_service_categories,
      array[
        'Criminal Defense',
        'Family Law',
        'Immigration',
        'Civil Litigation',
        'General Legal Matter'
      ]::text[]
    ),
    coalesce(
      o.default_priority_options,
      array['Standard','Medium','Urgent']::text[]
    ),
    coalesce(o.support_email, '')
  from public.organizations o
  where p_slug is null or o.slug = p_slug
  order by o.name asc
  limit 1;
$$;

grant execute on function public.get_public_intake_settings(text)
to anon, authenticated, service_role;

create or replace function public.submit_public_intake_for_org(
  p_organization_slug text default null,
  p_first_name text default null,
  p_last_name text default null,
  p_email text default null,
  p_phone text default null,
  p_service_category text default null,
  p_priority text default null,
  p_details text default null
)
returns table(case_number text, client_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_public_intake_enabled boolean;
  v_intake_id uuid;
  v_case_id uuid;
  v_sequence_number integer;
  v_case_number text;
  v_case_priority text;
  v_phone_digits text;
begin
  select o.id, coalesce(o.public_intake_enabled, true)
    into v_organization_id, v_public_intake_enabled
  from public.organizations o
  where p_organization_slug is null or o.slug = p_organization_slug
  order by o.name asc
  limit 1;

  if v_organization_id is null then
    raise exception 'Client intake organization could not be found.';
  end if;

  if not v_public_intake_enabled then
    raise exception 'Client intake is currently closed for this workspace.';
  end if;

  if length(trim(coalesce(p_first_name, ''))) = 0 then
    raise exception 'First name is required.';
  end if;

  if length(trim(coalesce(p_last_name, ''))) = 0 then
    raise exception 'Last name is required.';
  end if;

  if length(trim(coalesce(p_email, ''))) = 0 then
    raise exception 'Email address is required.';
  end if;

  if trim(p_email) !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'Email address must be valid.';
  end if;

  v_phone_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone_digits) <> 10 then
    raise exception 'Phone number must be exactly 10 digits.';
  end if;

  if length(trim(coalesce(p_service_category, ''))) = 0 then
    raise exception 'Practice area is required.';
  end if;

  if length(trim(coalesce(p_priority, ''))) = 0 then
    raise exception 'Priority is required.';
  end if;

  if length(trim(coalesce(p_details, ''))) = 0 then
    raise exception 'Matter details are required.';
  end if;

  insert into public.organization_case_counters (organization_id, next_case_number)
  values (
    v_organization_id,
    coalesce(
      (
        select max(substring(c.case_number from '^CF-([0-9]+)$')::integer)
        from public.cases c
        where c.organization_id = v_organization_id
          and c.case_number ~ '^CF-[0-9]+$'
      ),
      1000
    ) + 1
  )
  on conflict (organization_id) do nothing;

  update public.organization_case_counters
  set next_case_number = next_case_number + 1,
      updated_at = now()
  where organization_id = v_organization_id
  returning next_case_number - 1 into v_sequence_number;

  if v_sequence_number is null then
    raise exception 'Unable to allocate a case number.';
  end if;

  v_case_number := 'CF-' || lpad(v_sequence_number::text, 4, '0');
  v_case_priority :=
    case
      when p_priority = 'Urgent' then 'Urgent'
      when p_priority = 'Medium' then 'Medium'
      else 'Low'
    end;

  insert into public.intake_submissions (
    organization_id, first_name, last_name, email, phone,
    service_category, priority, details
  ) values (
    v_organization_id,
    trim(p_first_name),
    trim(p_last_name),
    lower(trim(p_email)),
    v_phone_digits,
    trim(p_service_category),
    trim(p_priority),
    trim(p_details)
  )
  returning id into v_intake_id;

  insert into public.cases (
    organization_id, case_number, client_first_name, client_last_name,
    client_email, client_phone, service_category, priority, status,
    assigned_to, summary, source
  ) values (
    v_organization_id,
    v_case_number,
    trim(p_first_name),
    trim(p_last_name),
    lower(trim(p_email)),
    v_phone_digits,
    trim(p_service_category),
    v_case_priority,
    'New Intake',
    'Unassigned',
    trim(p_details),
    'Client Intake'
  )
  returning id into v_case_id;

  insert into public.case_documents (
    case_id, organization_id, name, description, status
  ) values
    (
      v_case_id, v_organization_id, 'Photo identification',
      'Government-issued ID or equivalent identity document.', 'Missing'
    ),
    (
      v_case_id, v_organization_id, 'Proof of address',
      'Utility bill, lease, official mail, or another address record.', 'Missing'
    ),
    (
      v_case_id, v_organization_id, 'Client intake form',
      'Signed client intake questionnaire or initial matter information form.', 'Missing'
    ),
    (
      v_case_id, v_organization_id, 'Supporting records',
      'Additional records requested by the assigned legal team.', 'Missing'
    );

  insert into public.case_activity (
    case_id, organization_id, title, detail, created_by, client_visible
  ) values (
    v_case_id,
    v_organization_id,
    'Matter created from client intake',
    'Client intake submission created ' || v_case_number || ' for ' ||
      trim(p_first_name) || ' ' || trim(p_last_name) || '.',
    'Client Intake',
    false
  );

  update public.intake_submissions
  set converted_case_id = v_case_id
  where id = v_intake_id;

  return query
  select v_case_number, trim(p_first_name) || ' ' || trim(p_last_name);
end;
$$;

grant execute on function public.submit_public_intake_for_org(
  text, text, text, text, text, text, text, text
) to anon, authenticated, service_role;

-- Prevent authenticated clients from touching the counter directly.
revoke all on table public.organization_case_counters from anon, authenticated;

-- Tenant-integrity checks for case child records.
drop policy if exists "Staff read org documents" on public.case_documents;
drop policy if exists "Staff insert org documents" on public.case_documents;
drop policy if exists "Staff update org documents" on public.case_documents;

create policy "Staff read org documents"
on public.case_documents for select to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_documents.case_id
      and c.organization_id = case_documents.organization_id
  )
);

create policy "Staff insert org documents"
on public.case_documents for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_documents.case_id
      and c.organization_id = case_documents.organization_id
  )
);

create policy "Staff update org documents"
on public.case_documents for update to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_documents.case_id
      and c.organization_id = case_documents.organization_id
  )
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_documents.case_id
      and c.organization_id = case_documents.organization_id
  )
);

drop policy if exists "Staff read org notes" on public.case_notes;
drop policy if exists "Staff insert org notes" on public.case_notes;
drop policy if exists "Staff update org notes" on public.case_notes;

create policy "Staff read org notes"
on public.case_notes for select to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_notes.case_id
      and c.organization_id = case_notes.organization_id
  )
);

create policy "Staff insert org notes"
on public.case_notes for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_notes.case_id
      and c.organization_id = case_notes.organization_id
  )
);

create policy "Staff update org notes"
on public.case_notes for update to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_notes.case_id
      and c.organization_id = case_notes.organization_id
  )
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_notes.case_id
      and c.organization_id = case_notes.organization_id
  )
);

drop policy if exists "Staff read org activity" on public.case_activity;
drop policy if exists "Staff insert org activity" on public.case_activity;
drop policy if exists "Staff update org activity" on public.case_activity;

create policy "Staff read org activity"
on public.case_activity for select to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_activity.case_id
      and c.organization_id = case_activity.organization_id
  )
);

create policy "Staff insert org activity"
on public.case_activity for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_activity.case_id
      and c.organization_id = case_activity.organization_id
  )
);

create policy "Staff update org activity"
on public.case_activity for update to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_activity.case_id
      and c.organization_id = case_activity.organization_id
  )
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_activity.case_id
      and c.organization_id = case_activity.organization_id
  )
);

drop policy if exists "Staff create org client invites" on public.client_portal_invites;
drop policy if exists "Staff update org client invites" on public.client_portal_invites;

create policy "Staff create org client invites"
on public.client_portal_invites for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and created_by = auth.uid()
  and exists (
    select 1 from public.cases c
    where c.id = client_portal_invites.case_id
      and c.organization_id = client_portal_invites.organization_id
  )
);

create policy "Staff update org client invites"
on public.client_portal_invites for update to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = client_portal_invites.case_id
      and c.organization_id = client_portal_invites.organization_id
  )
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = client_portal_invites.case_id
      and c.organization_id = client_portal_invites.organization_id
  )
);

-- Client storage authorization also requires case/org consistency.
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
     and cca.organization_id = d.organization_id
     and cca.user_id = auth.uid()
    where d.file_path = p_path
      and d.client_visible = true
  );
$$;

grant execute on function public.client_can_read_case_document(text)
to authenticated, service_role;

-- The legal-document bucket must never be public.
update storage.buckets
set public = false
where id = 'case-documents';

drop policy if exists "Staff delete org case documents" on storage.objects;
create policy "Staff delete org case documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'case-documents'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','attorney','staff','paralegal','billing','intake')
      and p.organization_id::text = (storage.foldername(storage.objects.name))[1]
  )
);
