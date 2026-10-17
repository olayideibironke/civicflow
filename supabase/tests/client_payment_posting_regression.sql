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
 -- An already-authorized event must not be redirected before its first posting.
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666');
  raise exception 'Authorized refund was redirected to a different payment';
 exception when sqlstate '23514' then null;
 end;
 if (select processing_state from public.client_payment_event_inbox
     where id='55555555-5555-4555-8555-555555555555') <> 'ready_for_posting'
    or (select matched_payment_id from public.client_payment_event_inbox
     where id='55555555-5555-4555-8555-555555555555')
       <> '44444444-4444-4444-8444-444444444444'::uuid
    or (select count(*) from public.client_payment_adjustments) <> 0 then
  raise exception 'Rejected payment redirect mutated accounting state';
 end if;
 -- Payment status can change between authorization and posting.
 update public.billing_payments set status='failed'
 where id='44444444-4444-4444-8444-444444444444';
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
  raise exception 'Failed original payment was posted';
 exception when sqlstate '23514' then null;
 end;
 if (select processing_state from public.client_payment_event_inbox
     where id='55555555-5555-4555-8555-555555555555') <> 'ready_for_posting'
    or (select count(*) from public.client_payment_adjustments) <> 0 then
  raise exception 'Failed original payment caused partial posting';
 end if;
 update public.billing_payments set status='succeeded'
 where id='44444444-4444-4444-8444-444444444444';
 -- Stripe reference drift after authorization must fail closed.
 update public.billing_payments set processor_reference='pi_changed'
 where id='44444444-4444-4444-8444-444444444444';
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
  raise exception 'Changed Stripe reference was accepted';
 exception when sqlstate '23514' then null;
 end;
 update public.billing_payments set processor_reference='pi_test1'
 where id='44444444-4444-4444-8444-444444444444';

 -- An original payment cannot switch tenants between authorization and posting.
 update public.billing_payments set organization_id='22222222-2222-4222-8222-222222222222'
 where id='44444444-4444-4444-8444-444444444444';
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
  raise exception 'Reassigned original payment was accepted';
 exception when sqlstate '23514' then null;
 end;
 update public.billing_payments set organization_id='11111111-1111-4111-8111-111111111111'
 where id='44444444-4444-4444-8444-444444444444';
 if (select processing_state from public.client_payment_event_inbox
     where id='55555555-5555-4555-8555-555555555555') <> 'ready_for_posting'
    or (select count(*) from public.client_payment_adjustments) <> 0 then
  raise exception 'Rejected payment identity changes caused partial posting';
 end if;
 -- Connected-account ownership must remain valid through posting.
 update public.organization_payment_connections set stripe_account_id='acct_changed'
 where organization_id='11111111-1111-4111-8111-111111111111';
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
  raise exception 'Disconnected Stripe account was accepted';
 exception when sqlstate '23514' then null;
 end;
 update public.organization_payment_connections set stripe_account_id='acct_test1'
 where organization_id='11111111-1111-4111-8111-111111111111';
 if (select processing_state from public.client_payment_event_inbox
     where id='55555555-5555-4555-8555-555555555555') <> 'ready_for_posting'
    or (select count(*) from public.client_payment_adjustments) <> 0 then
  raise exception 'Rejected Stripe connection drift caused partial posting';
 end if;
 -- Original payment amount cannot drift after authorization, even if
 -- the new amount still covers the requested refund.
 update public.billing_payments set amount_cents=12000
 where id='44444444-4444-4444-8444-444444444444';
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555',
   '44444444-4444-4444-8444-444444444444');
  raise exception 'Changed original payment amount was accepted';
 exception when sqlstate '23514' then null;
 end;
 if (select count(*) from public.client_payment_adjustments) <> 0
    or (select processing_state from public.client_payment_event_inbox
        where id='55555555-5555-4555-8555-555555555555') <> 'ready_for_posting' then
  raise exception 'Rejected payment amount drift caused partial posting';
 end if;
 update public.billing_payments set amount_cents=10000
 where id='44444444-4444-4444-8444-444444444444';
 -- Same-tenant invoice reassignment after authorization must be rejected,
 -- even when both invoices have the same currency.
 insert into public.billing_invoices(id,organization_id,currency)
 values ('f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1',
         '11111111-1111-4111-8111-111111111111','usd');
 update public.billing_payments
 set invoice_id='f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1'
 where id='44444444-4444-4444-8444-444444444444';
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555',
   '44444444-4444-4444-8444-444444444444');
  raise exception 'Changed original invoice was posted after authorization';
 exception when sqlstate '23514' then null;
 end;
 if (select count(*) from public.client_payment_adjustments) <> 0
    or (select processing_state from public.client_payment_event_inbox
        where id='55555555-5555-4555-8555-555555555555') <> 'ready_for_posting' then
  raise exception 'Rejected invoice drift caused partial financial posting';
 end if;
 update public.billing_payments
 set invoice_id='33333333-3333-4333-8333-333333333333'
 where id='44444444-4444-4444-8444-444444444444';
 -- Invoice currency must still match the signed Stripe evidence at posting.
 update public.billing_invoices set currency='eur'
 where id='33333333-3333-4333-8333-333333333333';
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
  raise exception 'Changed invoice currency was accepted';
 exception when sqlstate '23514' then null;
 end;
 update public.billing_invoices set currency='usd'
 where id='33333333-3333-4333-8333-333333333333';
 if (select processing_state from public.client_payment_event_inbox
     where id='55555555-5555-4555-8555-555555555555') <> 'ready_for_posting'
    or (select count(*) from public.client_payment_adjustments) <> 0 then
  raise exception 'Rejected currency drift caused partial posting';
 end if;
 -- A duplicate successful Stripe payment imported after authorization
 -- must force review rather than arbitrarily selecting the original.
 insert into public.billing_payments
 (id,organization_id,invoice_id,amount_cents,status,processor,processor_reference)
 values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
 '11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333',
 10000,'succeeded','stripe','pi_test1');
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
  raise exception 'Ambiguous Stripe payment match was accepted';
 exception when sqlstate '23514' then null;
 end;
 delete from public.billing_payments
 where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
 if (select processing_state from public.client_payment_event_inbox
     where id='55555555-5555-4555-8555-555555555555') <> 'ready_for_posting'
    or (select count(*) from public.client_payment_adjustments) <> 0 then
  raise exception 'Ambiguous match caused partial accounting changes';
 end if;
 first_post := public.post_verified_client_payment_adjustment(
  '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
 replay_post := public.post_verified_client_payment_adjustment(
  '55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444');
 if first_post is null or first_post is distinct from replay_post then
  raise exception 'Posting replay did not return the same ledger entry';
 end if;
 -- A processed event must not replay after its payment is reassigned
 -- to a different invoice, even within the same organization and currency.
 update public.billing_payments
 set invoice_id='f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1'
 where id='44444444-4444-4444-8444-444444444444';
 begin
  perform public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555',
   '44444444-4444-4444-8444-444444444444');
  raise exception 'Replayed adjustment accepted changed invoice association';
 exception when sqlstate '23505' then null;
 end;
 if (select count(*) from public.client_payment_adjustments) <> 1
    or (select processing_state from public.client_payment_event_inbox
        where id='55555555-5555-4555-8555-555555555555') <> 'processed' then
  raise exception 'Rejected invoice reassignment mutated financial records';
 end if;
 update public.billing_payments
 set invoice_id='33333333-3333-4333-8333-333333333333'
 where id='44444444-4444-4444-8444-444444444444';
 if public.post_verified_client_payment_adjustment(
   '55555555-5555-4555-8555-555555555555',
   '44444444-4444-4444-8444-444444444444') is distinct from first_post then
  raise exception 'Original invoice restoration did not allow idempotent replay';
 end if;
 -- A pre-existing ledger entry must also reject invoice reassignment
 -- when the inbox is authorized but has not yet been marked processed.
 begin
  insert into public.client_payment_event_inbox
   (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
    stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
  values
   ('f2f2f2f2-f2f2-42f2-82f2-f2f2f2f2f2f2',
    '11111111-1111-4111-8111-111111111111',
    'acct_test1','evt_preexisting1','re_preexisting1','pi_test1',
    1000,'usd','succeeded','refund.created',false,now());
  perform public.authorize_client_payment_adjustment_posting(
   'f2f2f2f2-f2f2-42f2-82f2-f2f2f2f2f2f2',
   '44444444-4444-4444-8444-444444444444');
  insert into public.client_payment_adjustments
   (organization_id,invoice_id,payment_id,connected_account_id,
    stripe_event_id,stripe_object_id,stripe_payment_intent_id,
    event_type,amount_cents,currency,status,occurred_at,livemode)
  select organization_id,invoice_id,id,'acct_test1',
         'evt_preexisting1','re_preexisting1','pi_test1',
         'refund.created',1000,'usd','succeeded',now(),false
  from public.billing_payments where id='44444444-4444-4444-8444-444444444444';
  update public.billing_payments
  set invoice_id='f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1'
  where id='44444444-4444-4444-8444-444444444444';
  perform public.post_verified_client_payment_adjustment(
   'f2f2f2f2-f2f2-42f2-82f2-f2f2f2f2f2f2',
   '44444444-4444-4444-8444-444444444444');
  raise exception 'Unprocessed inbox accepted changed invoice replay';
 exception when sqlstate '23514' then null;
 end;
 if (select count(*) from public.client_payment_adjustments) <> 1
    or (select count(*) from public.client_payment_event_inbox) <> 1
    or (select invoice_id from public.billing_payments
        where id='44444444-4444-4444-8444-444444444444')
        <> '33333333-3333-4333-8333-333333333333'::uuid then
  raise exception 'Rejected unprocessed replay did not roll back atomically';
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
  -- A larger update to an existing refund replaces its accounting snapshot,
  -- rather than being added as a new refund.
  insert into public.client_payment_event_inbox
   (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
    stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
  values
   ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111',
    'acct_test1','evt_test7','re_test1','pi_test1',3000,'usd','succeeded',
    'refund.updated',false,now());
  perform public.authorize_client_payment_adjustment_posting(
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc','44444444-4444-4444-8444-444444444444');
  perform public.post_verified_client_payment_adjustment(
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc','44444444-4444-4444-8444-444444444444');
  -- A separate 7,500-cent refund now exceeds the remaining 7,000 cents.
  insert into public.client_payment_event_inbox
   (id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
    stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
  values
   ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-4111-8111-111111111111',
    'acct_test1','evt_test8','re_test8','pi_test1',7500,'usd','succeeded',
    'refund.created',false,now());
  perform public.authorize_client_payment_adjustment_posting(
   'dddddddd-dddd-4ddd-8ddd-dddddddddddd','44444444-4444-4444-8444-444444444444');
  begin
   perform public.post_verified_client_payment_adjustment(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd','44444444-4444-4444-8444-444444444444');
   raise exception 'Updated refund snapshot bypassed aggregate cap';
  exception when sqlstate '23514' then null;
  end;
  if (select count(*) from public.client_payment_adjustments) <> 3 then
   raise exception 'Snapshot accounting unexpectedly created or removed entries';
  end if;
end;
$regression$;
rollback;
