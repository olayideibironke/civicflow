-- Run in disposable CI PostgreSQL only, after concurrency tests.
-- The index migration must reject preexisting ambiguity, then enforce uniqueness.
begin;
insert into public.organizations(id) values ('81818181-8181-4818-8818-818181818181');
insert into public.billing_invoices(id,organization_id,currency) values
('82828282-8282-4828-8828-828282828282','81818181-8181-4818-8818-818181818181','usd');
insert into public.billing_payments
(id,organization_id,invoice_id,amount_cents,status,processor,processor_reference)
values
('83838383-8383-4838-8838-838383838383','81818181-8181-4818-8818-818181818181','82828282-8282-4828-8828-828282828282',1000,'succeeded','stripe','pi_duplicate_ci'),
('84848484-8484-4848-8848-848484848484','81818181-8181-4818-8818-818181818181','82828282-8282-4828-8828-828282828282',1000,'succeeded','stripe','pi_duplicate_ci');
do $preflight$
begin
 if not exists (
  select 1 from public.billing_payments
  where organization_id='81818181-8181-4818-8818-818181818181'
    and processor_reference='pi_duplicate_ci'
  group by organization_id,processor_reference having count(*)>1
 ) then raise exception 'Preflight failed to detect duplicate'; end if;
end;
$preflight$;
savepoint before_duplicate_index;
-- The same DDL must fail if historical duplicate payments exist.
do $expect_duplicate$
begin
 begin
  create unique index billing_payments_unique_succeeded_stripe_intent_per_org
  on public.billing_payments(organization_id,processor_reference)
  where processor='stripe' and status='succeeded' and processor_reference is not null;
  raise exception 'Duplicate succeeded payments were accepted';
 exception when unique_violation then null;
 end;
end;
$expect_duplicate$;
delete from public.billing_payments where id='84848484-8484-4848-8848-848484848484';
commit;
-- Apply the actual draft migration in the workflow after duplicates are resolved.
