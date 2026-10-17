-- Read-only release gate. Fail closed on ambiguous or untraceable succeeded
-- Stripe payments. Safe to execute on a reviewed production snapshot.
do $release_gate$
begin
  -- The index must be present, valid, unique and enforce the intended
  -- tenant-scoped partial predicate. A same-named incompatible index is unsafe.
  if not exists (
    select 1
    from pg_catalog.pg_index i
    join pg_catalog.pg_class idx on idx.oid=i.indexrelid
    join pg_catalog.pg_class tbl on tbl.oid=i.indrelid
    join pg_catalog.pg_namespace ns on ns.oid=tbl.relnamespace
    where ns.nspname='public'
      and tbl.relname='billing_payments'
      and idx.relname='billing_payments_unique_succeeded_stripe_intent_per_org'
      and i.indisunique and i.indisvalid and i.indisready
      and i.indnkeyatts=2
      and pg_catalog.pg_get_indexdef(i.indexrelid,1,true)='organization_id'
      and pg_catalog.pg_get_indexdef(i.indexrelid,2,true)='processor_reference'
      and pg_catalog.pg_get_expr(i.indpred,i.indrelid) like '%processor%'
      and pg_catalog.pg_get_expr(i.indpred,i.indrelid) like '%stripe%'
      and pg_catalog.pg_get_expr(i.indpred,i.indrelid) like '%succeeded%'
      and pg_catalog.pg_get_expr(i.indpred,i.indrelid) like '%processor_reference IS NOT NULL%'
  ) then
    raise exception 'Required Stripe payment uniqueness index is missing or invalid'
      using errcode='23514';
  end if;
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
