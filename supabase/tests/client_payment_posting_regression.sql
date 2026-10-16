-- Run only in disposable CI PostgreSQL after draft financial migrations.
begin;
insert into public.organizations(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
insert into public.billing_invoices(id,organization_id,currency) values
 ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','usd');
insert into public.billing_payments(id,organization_id,invoice_id,amount_cents,status,processor,processor_reference) values
 ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',10000,'succeeded','stripe','pi_test1');
insert into public.organization_payment_connections(organization_id,stripe_account_id,provider,mode) values
 ('11111111-1111-4111-8111-111111111111','acct_test1','stripe','sandbox');
insert into public.client_payment_event_inbox
 (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
  stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
 values
 ('55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111',
  'acct_test1','evt_test1','re_test1','pi_test1',2500,'usd','succeeded',
  'refund.created',false,now());
do $regression$
declare
 first_post uuid;
 replay_post uuid;
begin
 if not public.authorize_client_payment_adjustment_posting(
  '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444'
 ) then raise exception 'Authorization failed'; end if;
 if public.authorize_client_payment_adjustment_posting(
  '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444'
 ) then raise exception 'Authorization retry was not idempotent'; end if;
 first_post := public.post_verified_client_payment_adjustment(
  '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
 replay_post := public.post_verified_client_payment_adjustment(
  '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
 if first_post is null or first_post is distinct from replay_post then
  raise exception 'Posting replay did not return the same ledger entry';
 end if;
 if (select count(*) from public.client_payment_adjustments) <> 1 then
  raise exception 'Duplicate ledger entry created';
 end if;
 if (select processing_state from public.client_payment_event_inbox
     where id='55555555-5555-4555-8555-555555555555') <> 'processed' then
  raise exception 'Inbox did not finish processing';
 end if;
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666');
  raise exception 'Wrong payment was accepted';
 exception when sqlstate '23505' then null;
 end;
 begin
  delete from public.client_payment_adjustments;
  raise exception 'Ledger deletion was accepted';
 exception when sqlstate '23514' then null;
 end;
 begin
  delete from public.client_payment_event_inbox;
  raise exception 'Inbox deletion was accepted';
 exception when sqlstate '23514' then null;
 end;
end;
$regression$;
rollback;
