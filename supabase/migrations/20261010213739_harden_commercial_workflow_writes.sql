
create or replace function private.assign_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_number integer;
begin
  if new.status <> 'draft'
     or new.subtotal_cents <> 0
     or new.amount_paid_cents <> 0
     or new.sent_at is not null
     or new.paid_at is not null
     or new.voided_at is not null then
    raise exception 'New invoices must begin as empty drafts.';
  end if;

  if new.invoice_number is not null and length(trim(new.invoice_number)) > 0 then
    return new;
  end if;

  insert into public.organization_invoice_counters (
    organization_id,
    next_invoice_number,
    updated_at
  )
  values (new.organization_id, 1002, now())
  on conflict (organization_id)
  do update set
    next_invoice_number = public.organization_invoice_counters.next_invoice_number + 1,
    updated_at = now()
  returning next_invoice_number - 1 into v_number;

  new.invoice_number := 'INV-' || lpad(v_number::text, 5, '0');
  return new;
end;
$$;

create or replace function private.enforce_invoice_identity()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.organization_id is distinct from old.organization_id
     or new.case_id is distinct from old.case_id
     or new.invoice_number is distinct from old.invoice_number
     or new.created_by is distinct from old.created_by then
    raise exception 'Invoice identity fields cannot be changed.';
  end if;

  if old.status = 'void' and new.status <> 'void' then
    raise exception 'A void invoice cannot be reopened.';
  end if;

  if old.status = 'draft' and new.status = 'sent' then
    new.sent_at := coalesce(new.sent_at, now());
  end if;

  if new.status = 'void' and old.status <> 'void' then
    new.voided_at := coalesce(new.voided_at, now());
  end if;

  if new.status = 'paid'
     and (new.subtotal_cents <= 0 or new.amount_paid_cents < new.subtotal_cents) then
    raise exception 'An invoice cannot be marked paid without sufficient recorded payments.';
  end if;

  if new.status = 'partially_paid'
     and (new.amount_paid_cents <= 0 or new.amount_paid_cents >= new.subtotal_cents) then
    raise exception 'Partially paid status requires a positive balance and a recorded partial payment.';
  end if;

  return new;
end;
$$;

create or replace function private.recalculate_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_subtotal bigint;
  v_paid bigint;
begin
  select coalesce(sum(i.amount_cents), 0)
    into v_subtotal
  from public.billing_invoice_items i
  where i.invoice_id = p_invoice_id;

  select coalesce(sum(p.amount_cents), 0)
    into v_paid
  from public.billing_payments p
  where p.invoice_id = p_invoice_id
    and p.status = 'succeeded';

  update public.billing_invoices i
  set
    subtotal_cents = v_subtotal,
    amount_paid_cents = v_paid,
    status = case
      when i.status = 'void' then 'void'
      when v_subtotal > 0 and v_paid >= v_subtotal then 'paid'
      when v_paid > 0 then 'partially_paid'
      when i.sent_at is not null then 'sent'
      else 'draft'
    end,
    paid_at = case
      when i.status <> 'void' and v_subtotal > 0 and v_paid >= v_subtotal
        then coalesce(i.paid_at, now())
      when i.status = 'void' then i.paid_at
      else null
    end,
    updated_at = now()
  where i.id = p_invoice_id;
end;
$$;

create or replace function private.enforce_payment_identity()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.invoice_id is distinct from old.invoice_id
     or new.organization_id is distinct from old.organization_id
     or new.case_id is distinct from old.case_id
     or new.amount_cents is distinct from old.amount_cents
     or new.payment_method is distinct from old.payment_method
     or new.processor is distinct from old.processor
     or new.funds_destination is distinct from old.funds_destination
     or new.created_by is distinct from old.created_by then
    raise exception 'Payment identity fields cannot be changed.';
  end if;

  if old.status = 'refunded' and new.status <> 'refunded' then
    raise exception 'A refunded payment cannot be reopened.';
  end if;

  return new;
end;
$$;

drop trigger if exists billing_payments_enforce_identity on public.billing_payments;
create trigger billing_payments_enforce_identity
before update on public.billing_payments
for each row execute function private.enforce_payment_identity();

create or replace function private.prepare_retainer_request()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, extensions
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft'
       or new.signed_by_user_id is not null
       or new.signer_name is not null
       or new.signer_email is not null
       or new.signature_text is not null
       or new.consent_accepted is true
       or new.signed_at is not null
       or new.voided_at is not null then
      raise exception 'New retainer requests must begin as unsigned drafts.';
    end if;

    new.agreement_sha256 :=
      encode(extensions.digest(convert_to(new.agreement_text, 'UTF8'), 'sha256'), 'hex');
    return new;
  end if;

  if old.status in ('signed','voided') then
    raise exception 'Signed or voided retainer requests are immutable.';
  end if;

  if old.status <> 'draft' and new.agreement_text is distinct from old.agreement_text then
    raise exception 'The agreement cannot be changed after it is sent.';
  end if;

  if new.agreement_text is distinct from old.agreement_text then
    new.agreement_sha256 :=
      encode(extensions.digest(convert_to(new.agreement_text, 'UTF8'), 'sha256'), 'hex');
  end if;

  if old.status = 'draft' and new.status = 'sent' then
    new.sent_at := coalesce(new.sent_at, now());
  end if;

  if new.status = 'voided' and old.status <> 'voided' then
    new.voided_at := coalesce(new.voided_at, now());
  end if;

  if new.status = 'signed' and old.status <> 'signed' then
    if auth.uid() is null
       or new.signed_by_user_id is distinct from auth.uid()
       or new.consent_accepted is not true
       or length(trim(coalesce(new.signer_name, ''))) = 0
       or length(trim(coalesce(new.signature_text, ''))) = 0
       or new.signed_at is null
       or not exists (
         select 1
         from public.profiles p
         where p.id = auth.uid()
           and p.role = 'client'
       )
       or not exists (
         select 1
         from public.client_case_access cca
         where cca.user_id = auth.uid()
           and cca.case_id = new.case_id
           and cca.organization_id = new.organization_id
       ) then
      raise exception 'Only an authorized client can sign this retainer request.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sign_retainer_request(
  p_request_id uuid,
  p_signer_name text,
  p_signature_text text,
  p_consent boolean
)
returns table (
  request_id uuid,
  status text,
  signed_at timestamptz,
  agreement_sha256 text
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_request public.retainer_signature_requests%rowtype;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'client'
  ) then
    raise exception 'A client portal account is required to sign.';
  end if;

  if p_consent is not true then
    raise exception 'Electronic signature consent is required.';
  end if;

  if length(trim(coalesce(p_signer_name, ''))) = 0 then
    raise exception 'Signer name is required.';
  end if;

  if length(trim(coalesce(p_signature_text, ''))) = 0 then
    raise exception 'Signature is required.';
  end if;

  select r.*
    into v_request
  from public.retainer_signature_requests r
  where r.id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Retainer request not found.';
  end if;

  if v_request.status <> 'sent' then
    raise exception 'This retainer request is not available for signing.';
  end if;

  if v_request.expires_at is not null and v_request.expires_at <= now() then
    raise exception 'This retainer request has expired.';
  end if;

  if not exists (
    select 1
    from public.client_case_access cca
    where cca.user_id = auth.uid()
      and cca.case_id = v_request.case_id
      and cca.organization_id = v_request.organization_id
  ) then
    raise exception 'You do not have access to this matter.';
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = auth.uid();

  update public.retainer_signature_requests r
  set
    status = 'signed',
    signed_by_user_id = auth.uid(),
    signer_name = trim(p_signer_name),
    signer_email = lower(trim(coalesce(v_email, v_request.client_email, ''))),
    signature_text = trim(p_signature_text),
    consent_accepted = true,
    consent_text = 'I consent to use an electronic signature and intend this signature to be legally binding.',
    signed_at = now()
  where r.id = p_request_id
  returning r.* into v_request;

  return query
  select
    v_request.id,
    v_request.status,
    v_request.signed_at,
    v_request.agreement_sha256;
end;
$$;

revoke update on public.billing_invoices from authenticated;
grant update (status, issue_date, due_date, notes)
  on public.billing_invoices to authenticated;

revoke update on public.billing_invoice_items from authenticated;
grant update (description, quantity, unit_amount_cents)
  on public.billing_invoice_items to authenticated;

revoke update on public.billing_payments from authenticated;
grant update (status, processor_reference, memo)
  on public.billing_payments to authenticated;

revoke update on public.retainer_signature_requests from authenticated;
grant update (title, agreement_text, status, client_email, expires_at)
  on public.retainer_signature_requests to authenticated;

revoke update on public.case_parties from authenticated;
grant update (party_type, name, aliases, email, phone, notes)
  on public.case_parties to authenticated;
