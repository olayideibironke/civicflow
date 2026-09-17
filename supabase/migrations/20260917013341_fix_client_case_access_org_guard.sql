drop policy if exists "Staff create org client access" on public.client_case_access;

create policy "Staff create org client access"
on public.client_case_access
for insert
to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1
    from public.cases c
    where c.id = client_case_access.case_id
      and c.organization_id = client_case_access.organization_id
  )
);
