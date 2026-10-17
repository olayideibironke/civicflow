-- Read-only release gate. Fail closed on ambiguous or untraceable succeeded
-- Stripe payments. Safe to execute on a reviewed production snapshot.
do $release_gate$
begin
  if exists (
    select 1 from public.billing_payments
    where processor='stripe' and status='succeeded'
      and (processor_reference is null or btrim(processor_reference)='')
  ) then
    raise exception 'Succeeded Stripe payment missing a usable reference'
      using errcode='23514';
  end if;
  if exists (
    select 1 from public.billing_payments
    where processor='stripe' and status='succeeded'
      and processor_reference is not null
    group by organization_id, processor_reference
    having count(*) > 1
  ) then
    raise exception 'Duplicate successful Stripe payments remain'
      using errcode='23514';
  end if;
end;
$release_gate$;
