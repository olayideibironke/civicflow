create table if not exists public.organization_case_counters (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  next_case_number integer not null check (next_case_number >= 1),
  updated_at timestamptz not null default now()
);

alter table public.organization_case_counters enable row level security;

insert into public.organization_case_counters (organization_id, next_case_number)
select
  o.id,
  coalesce(
    (
      select max(substring(c.case_number from '^CF-([0-9]+)$')::integer)
      from public.cases c
      where c.organization_id = o.id
        and c.case_number ~ '^CF-[0-9]+$'
    ),
    1000
  ) + 1
from public.organizations o
on conflict (organization_id) do nothing;

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
  select
    o.id,
    coalesce(o.public_intake_enabled, true)
  into
    v_organization_id,
    v_public_intake_enabled
  from public.organizations o
  where p_organization_slug is null or o.slug = p_organization_slug
  order by
    case when o.slug = 'community-services' then 0 else 1 end,
    o.name asc
  limit 1;

  if v_organization_id is null then
    raise exception 'Public intake organization could not be found.';
  end if;

  if not v_public_intake_enabled then
    raise exception 'Public intake is currently closed for this workspace.';
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

  if trim(p_email) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email address must be valid.';
  end if;

  v_phone_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_phone_digits) <> 10 then
    raise exception 'Phone number must be exactly 10 digits.';
  end if;

  if length(trim(coalesce(p_service_category, ''))) = 0 then
    raise exception 'Service category is required.';
  end if;

  if length(trim(coalesce(p_priority, ''))) = 0 then
    raise exception 'Priority is required.';
  end if;

  if length(trim(coalesce(p_details, ''))) = 0 then
    raise exception 'Request details are required.';
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
    organization_id,
    first_name,
    last_name,
    email,
    phone,
    service_category,
    priority,
    details
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
    organization_id,
    case_number,
    client_first_name,
    client_last_name,
    client_email,
    client_phone,
    service_category,
    priority,
    status,
    assigned_to,
    summary,
    source
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
    'Public Intake'
  )
  returning id into v_case_id;

  insert into public.case_documents (
    case_id,
    organization_id,
    name,
    description,
    status
  ) values
    (
      v_case_id,
      v_organization_id,
      'Photo identification',
      'Government-issued ID or equivalent verification document.',
      'Missing'
    ),
    (
      v_case_id,
      v_organization_id,
      'Proof of address',
      'Utility bill, lease, official mail, or another address record.',
      'Missing'
    ),
    (
      v_case_id,
      v_organization_id,
      'Program eligibility form',
      'Signed client intake or eligibility questionnaire.',
      'Missing'
    ),
    (
      v_case_id,
      v_organization_id,
      'Supporting records',
      'Additional records requested by the assigned staff member.',
      'Missing'
    );

  insert into public.case_activity (
    case_id,
    organization_id,
    title,
    detail,
    created_by,
    client_visible
  ) values (
    v_case_id,
    v_organization_id,
    'Case created from public intake',
    'Public intake submission created ' || v_case_number || ' for ' || trim(p_first_name) || ' ' || trim(p_last_name) || '.',
    'Public Intake',
    false
  );

  update public.intake_submissions
  set converted_case_id = v_case_id
  where id = v_intake_id;

  return query
  select
    v_case_number,
    trim(p_first_name) || ' ' || trim(p_last_name);
end;
$$;

revoke all on table public.organization_case_counters from anon, authenticated;
revoke all on function public.submit_public_intake_for_org(text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_public_intake_for_org(text, text, text, text, text, text, text, text) to anon, authenticated;
