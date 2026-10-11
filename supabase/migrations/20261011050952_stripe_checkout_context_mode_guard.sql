drop function if exists public.get_client_invoice_checkout_context(uuid);

create function public.get_client_invoice_checkout_context(p_invoice_id uuid)
returns table (
  invoice_id uuid,
  organization_id uuid,
  case_id uuid,
  invoice_number text,
  balance_cents bigint,
  currency text,
  connected_account_id text,
  connection_mode text,
  customer_email text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  return query
  select
    i.id,
    i.organization_id,
    i.case_id,
    i.invoice_number,
    i.balance_cents,
    lower(i.currency),
    c.stripe_account_id,
    c.mode,
    coalesce(auth.jwt() ->> 'email', '')
  from public.billing_invoices i
  join public.client_case_access cca
    on cca.user_id = auth.uid()
   and cca.case_id = i.case_id
   and cca.organization_id = i.organization_id
  join public.organization_payment_connections c
    on c.organization_id = i.organization_id
   and c.provider = 'stripe'
   and c.status = 'active'
   and c.operating_payments_enabled = true
  where i.id = p_invoice_id
    and i.status in ('sent','partially_paid')
    and i.balance_cents > 0
  limit 1;

  if not found then
    raise exception 'This invoice is not available for Stripe Checkout.';
  end if;
end;
$$;

revoke all on function public.get_client_invoice_checkout_context(uuid) from public, anon;
grant execute on function public.get_client_invoice_checkout_context(uuid) to authenticated;
