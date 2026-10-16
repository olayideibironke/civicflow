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
  -- Reject an event whose tenant does not own the original payment.
  insert into public.client_payment_event_inbox
   (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
    stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
  values
   ('77777777-7777-4777-8777-777777777777','22222222-2222-4222-8222-222222222222',
    'acct_test2','evt_test2','re_test2','pi_test1',1000,'usd','succeeded',
    'refund.created',false,now());
  begin
   perform public.authorize_client_payment_adjustment_posting(
    '77777777-7777-4777-8777-777777777777','44444444-4444-4444-8444-444444444444');
   raise exception 'Cross-tenant authorization was accepted';
  exception when sqlstate '23514' then null;
  end;
  if (select processing_state from public.client_payment_event_inbox
      where id='77777777-7777-4777-8777-777777777777') <> 'pending' then
   raise exception 'Rejected authorization mutated inbox state';
  end if;
  if (select count(*) from public.client_payment_adjustments) <> 1 then
   raise exception 'Rejected authorization created a ledger entry';
  end if;
  -- A failed posting cannot turn a pending event into processed.
  begin
   perform public.post_verified_client_payment_adjustment(
    '77777777-7777-4777-8777-777777777777','44444444-4444-4444-8444-444444444444');
   raise exception 'Unauthorized posting was accepted';
  exception when sqlstate '23514' then null;
  end;
  if (select processing_state from public.client_payment_event_inbox
      where id='77777777-7777-4777-8777-777777777777') <> 'pending'
     or (select count(*) from public.client_payment_adjustments) <> 1 then
   raise exception 'Failed posting left partial accounting changes';
  end if;
  -- An adjustment larger than its original successful payment must fail.
  insert into public.client_payment_event_inbox
   (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
    stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
  values
   ('88888888-8888-4888-8888-888888888888','11111111-1111-4111-8111-111111111111',
    'acct_test1','evt_test3','re_test3','pi_test1',10001,'usd','succeeded',
    'refund.created',false,now());
  begin
   perform public.authorize_client_payment_adjustment_posting(
    '88888888-8888-4888-8888-888888888888','44444444-4444-4444-8444-444444444444');
   raise exception 'Oversized refund authorization was accepted';
  exception when sqlstate '23514' then null;
  end;
  if (select processing_state from public.client_payment_event_inbox
      where id='88888888-8888-4888-8888-888888888888') <> 'pending' then
   raise exception 'Oversized refund changed inbox state';
  end if;
  if (select count(*) from public.client_payment_adjustments) <> 1 then
   raise exception 'Oversized refund created a ledger entry';
  end if;
  -- A second distinct refund must not exceed the remaining payment amount.
  insert into public.client_payment_event_inbox
   (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
    stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
  values
   ('99999999-9999-4999-8999-999999999999','11111111-1111-4111-8111-111111111111',
    'acct_test1','evt_test4','re_test4','pi_test1',8000,'usd','succeeded',
    'refund.created',false,now());
  perform public.authorize_client_payment_adjustment_posting(
   '99999999-9999-4999-8999-999999999999','44444444-4444-4444-8444-444444444444');
  begin
   perform public.post_verified_client_payment_adjustment(
    '99999999-9999-4999-8999-999999999999','44444444-4444-4444-8444-444444444444');
   raise exception 'Aggregate oversized refunds were accepted';
  exception when sqlstate '23514' then null;
  end;
  if (select processing_state from public.client_payment_event_inbox
      where id='99999999-9999-4999-8999-999999999999') <> 'ready_for_posting'
     or (select count(*) from public.client_payment_adjustments) <> 1 then
   raise exception 'Rejected aggregate refund left partial changes';
  end if;
  -- Same refund object, later Stripe event: count the refund once.
  insert into public.client_payment_event_inbox
   (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
    stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
  values
   ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',
    'acct_test1','evt_test5','re_test1','pi_test1',2500,'usd','succeeded',
    'refund.updated',false,now());
  perform public.authorize_client_payment_adjustment_posting(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444');
  perform public.post_verified_client_payment_adjustment(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444');
  if (select count(*) from public.client_payment_adjustments
      where stripe_object_id='re_test1') <> 2 then
   raise exception 'Same-refund update not recorded as separate event';
  end if;
  -- A regressed refund snapshot is not valid accounting evidence.
  insert into public.client_payment_event_inbox
   (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
    stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
  values
   ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111',
    'acct_test1','evt_test6','re_test1','pi_test1',2000,'usd','succeeded',
    'refund.updated',false,now());
  perform public.authorize_client_payment_adjustment_posting(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','44444444-4444-4444-8444-444444444444');
  begin
   perform public.post_verified_client_payment_adjustment(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','44444444-4444-4444-8444-444444444444');
   raise exception 'Regressed refund snapshot was posted';
  exception when sqlstate '23514' then null;
  end;
  if (select processing_state from public.client_payment_event_inbox
      where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') <> 'ready_for_posting'
     or (select count(*) from public.client_payment_adjustments) <> 2 then
   raise exception 'Regressed snapshot left partial changes';
  end if;
end;
$regression$;
rollback;
