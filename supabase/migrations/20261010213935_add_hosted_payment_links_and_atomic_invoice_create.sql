
alter table public.billing_invoices
  add column external_payment_url text,
  add column payment_instructions text not null default '';

alter table public.billing_invoices
  add constraint billing_invoices_external_payment_url_https
  check (
    external_payment_url is null
    or external_payment_url ~ '^https://[^[:space:]]+$'
  );

revoke update on public.billing_invoices from authenticated;
grant update (
  status,
  issue_date,
  due_date,
  notes,
  external_payment_url,
  payment_instructions
) on public.billing_invoices to authenticated;

create or replace function public.create_billing_invoice(
  p_case_id uuid,
  p_due_date date,
  p_notes text,
  p_description text,
  p_quantity numeric,
  p_unit_amount_cents bigint,
  p_external_payment_url text default null,
  p_payment_instructions text default ''
)
returns table (
  invoice_id uuid,
  invoice_number text
)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_org uuid;
  v_invoice_id uuid;
  v_invoice_number text;
  v_payment_url text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if length(trim(coalesce(p_description, ''))) = 0 then
    raise exception 'Invoice description is required.';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero.';
  end if;

  if p_unit_amount_cents is null or p_unit_amount_cents <= 0 then
    raise exception 'Invoice amount must be greater than zero.';
  end if;

  v_payment_url := nullif(trim(coalesce(p_external_payment_url, '')), '');

  if v_payment_url is not null
     and v_payment_url !~ '^https://[^[:space:]]+$' then
    raise exception 'Payment link must use HTTPS.';
  end if;

  select c.organization_id
    into v_org
  from public.cases c
  where c.id = p_case_id;

  if v_org is null or not public.is_staff_for_org(v_org) then
    raise exception 'Matter access could not be verified.';
  end if;

  insert into public.billing_invoices (
    organization_id,
    case_id,
    due_date,
    notes,
    external_payment_url,
    payment_instructions,
    created_by
  )
  values (
    v_org,
    p_case_id,
    p_due_date,
    trim(coalesce(p_notes, '')),
    v_payment_url,
    trim(coalesce(p_payment_instructions, '')),
    auth.uid()
  )
  returning id, billing_invoices.invoice_number
    into v_invoice_id, v_invoice_number;

  insert into public.billing_invoice_items (
    invoice_id,
    organization_id,
    case_id,
    description,
    quantity,
    unit_amount_cents
  )
  values (
    v_invoice_id,
    v_org,
    p_case_id,
    trim(p_description),
    p_quantity,
    p_unit_amount_cents
  );

  return query select v_invoice_id, v_invoice_number;
end;
$$;

revoke all on function public.create_billing_invoice(
  uuid, date, text, text, numeric, bigint, text, text
) from public, anon;
grant execute on function public.create_billing_invoice(
  uuid, date, text, text, numeric, bigint, text, text
) to authenticated, service_role;
