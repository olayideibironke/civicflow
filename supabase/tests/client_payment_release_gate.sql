-- Read-only release gate for succeeded Stripe payments.
-- Execute only after installing the reviewed tenant-scoped uniqueness index.
do $release_gate$
begin
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
      and pg_catalog.regexp_count(pg_catalog.pg_get_expr(i.indpred,i.indrelid), '\mAND\M', 1, 'i')=2
      and pg_catalog.regexp_count(pg_catalog.pg_get_expr(i.indpred,i.indrelid), '\mOR\M', 1, 'i')=0
      and pg_catalog.regexp_count(pg_catalog.pg_get_expr(i.indpred,i.indrelid), '\mNOT\M', 1, 'i')=1
  ) then
    raise exception 'Required Stripe payment uniqueness index is missing or invalid' using errcode='23514';
  end if;
  if exists (
    select 1 from public.billing_payments p
    left join public.billing_invoices i on i.id=p.invoice_id
    where p.processor='stripe' and p.status='succeeded'
      and (p.amount_cents is null or p.amount_cents<=0 or i.id is null
           or i.organization_id is distinct from p.organization_id)
  ) then
    raise exception 'Succeeded Stripe payment has invalid amount or invoice ownership' using errcode='23514';
  end if;
  if exists (
    select 1 from public.billing_payments p
    join public.billing_invoices i on i.id=p.invoice_id
    where p.processor='stripe' and p.status='succeeded'
      and (i.currency is null or i.currency !~ '^[a-zA-Z]{3}$')
  ) then
    raise exception 'Succeeded Stripe payment has invalid invoice currency' using errcode='23514';
  end if;
  if exists (
    select 1 from public.billing_payments
    where processor='stripe' and status='succeeded'
      and (processor_reference is null or btrim(processor_reference)='')
  ) then
    raise exception 'Succeeded Stripe payment missing a usable reference' using errcode='23514';
  end if;
  if exists (
    select 1 from public.billing_payments
    where processor='stripe' and status='succeeded'
      and processor_reference is not null
      and (processor_reference <> btrim(processor_reference)
           or processor_reference !~ '^pi_[A-Za-z0-9_]+$')
  ) then
    raise exception 'Succeeded Stripe payment has malformed PaymentIntent reference' using errcode='23514';
  end if;
  if exists (
    select 1 from public.billing_payments
    where processor='stripe' and status='succeeded'
      and processor_reference is not null
    group by organization_id,processor_reference
    having count(*)>1
  ) then
    raise exception 'Duplicate successful Stripe payments remain' using errcode='23514';
  end if;
end;
$release_gate$;
