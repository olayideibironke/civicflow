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
    if new.subtotal_cents <= 0 then
      raise exception 'An invoice must contain billable line items before it can be sent.';
    end if;
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

create or replace function private.validate_payment_balance()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_subtotal bigint;
  v_invoice_status text;
  v_other_paid bigint;
begin
  if new.status <> 'succeeded' then
    return new;
  end if;

  select i.subtotal_cents, i.status
    into v_subtotal, v_invoice_status
  from public.billing_invoices i
  where i.id = new.invoice_id
    and i.organization_id = new.organization_id
    and i.case_id = new.case_id
  for update;

  if v_subtotal is null then
    raise exception 'Invoice could not be verified.';
  end if;

  if v_invoice_status = 'void' then
    raise exception 'Payments cannot be recorded against a void invoice.';
  end if;

  select coalesce(sum(p.amount_cents), 0)
    into v_other_paid
  from public.billing_payments p
  where p.invoice_id = new.invoice_id
    and p.status = 'succeeded'
    and (tg_op = 'INSERT' or p.id <> new.id);

  if new.amount_cents > greatest(v_subtotal - v_other_paid, 0) then
    raise exception 'Payment amount exceeds the remaining invoice balance.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_payment_balance() from public, anon, authenticated;

drop trigger if exists billing_payments_validate_balance on public.billing_payments;
create trigger billing_payments_validate_balance
before insert or update on public.billing_payments
for each row execute function private.validate_payment_balance();
