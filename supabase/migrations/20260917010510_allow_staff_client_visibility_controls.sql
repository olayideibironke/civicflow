drop policy if exists "Staff update org activity" on public.case_activity;

create policy "Staff update org activity" on public.case_activity
for update to authenticated
using (public.is_staff_for_org(organization_id))
with check (public.is_staff_for_org(organization_id));
