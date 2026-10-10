
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.organization_invoice_counters (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  next_invoice_number integer not null default 1001 check (next_invoice_number >= 1),
  updated_at timestamptz not null default now()
);

alter table public.organization_invoice_counters enable row level security;
revoke all on table public.organization_invoice_counters from anon, authenticated;
grant all on table public.organization_invoice_counters to service_role;

create table public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  invoice_number text not null,
  status text not null default 'draft'
    check (status in ('draft','sent','partially_paid','paid','void')),
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'USD' check (currency = 'USD'),
  notes text not null default '',
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  amount_paid_cents bigint not null default 0 check (amount_paid_cents >= 0),
  balance_cents bigint generated always as (
    greatest(subtotal_cents - amount_paid_cents, 0)
  ) stored,
  sent_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, invoice_number),
  unique (id, organization_id, case_id)
);

create table public.billing_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null,
  organization_id uuid not null,
  case_id uuid not null,
  description text not null check (length(trim(description)) > 0),
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_amount_cents bigint not null check (unit_amount_cents >= 0),
  amount_cents bigint generated always as (
    round(quantity * unit_amount_cents)::bigint
  ) stored,
  created_at timestamptz not null default now(),
  constraint billing_invoice_items_invoice_tenant_fkey
    foreign key (invoice_id, organization_id, case_id)
    references public.billing_invoices(id, organization_id, case_id)
    on delete cascade
);

create table public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null,
  organization_id uuid not null,
  case_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'succeeded'
    check (status in ('pending','succeeded','failed','refunded')),
  payment_method text not null default 'manual'
    check (payment_method in ('manual','card','ach','check','cash','other')),
  processor text not null default 'manual',
  processor_reference text,
  funds_destination text not null default 'operating'
    check (funds_destination in ('operating','trust')),
  memo text not null default '',
  received_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_payments_invoice_tenant_fkey
    foreign key (invoice_id, organization_id, case_id)
    references public.billing_invoices(id, organization_id, case_id)
    on delete restrict
);

create table public.retainer_signature_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null default 'Retainer Agreement',
  agreement_text text not null check (length(trim(agreement_text)) > 0),
  agreement_sha256 text not null default '',
  status text not null default 'draft'
    check (status in ('draft','sent','signed','voided')),
  client_email text,
  sent_at timestamptz,
  expires_at timestamptz,
  signed_by_user_id uuid references auth.users(id) on delete set null,
  signer_name text,
  signer_email text,
  signature_text text,
  consent_accepted boolean not null default false,
  consent_text text,
  signed_at timestamptz,
  voided_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id, case_id)
);

create table public.retainer_signature_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  organization_id uuid not null,
  case_id uuid not null,
  event_type text not null
    check (event_type in ('created','sent','signed','voided')),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text not null default 'system',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint retainer_signature_events_request_tenant_fkey
    foreign key (request_id, organization_id, case_id)
    references public.retainer_signature_requests(id, organization_id, case_id)
    on delete cascade
);

create table public.case_parties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  party_type text not null
    check (party_type in ('client','opposing_party','related_party','witness','organization','other')),
  name text not null check (length(trim(name)) > 0),
  aliases text[] not null default '{}'::text[],
  email text,
  phone text,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index billing_invoices_org_case_idx
  on public.billing_invoices (organization_id, case_id, created_at desc);
create index billing_invoices_status_idx
  on public.billing_invoices (organization_id, status);
create index billing_invoice_items_invoice_idx
  on public.billing_invoice_items (invoice_id);
create index billing_payments_invoice_idx
  on public.billing_payments (invoice_id, received_at desc);
create index retainer_signature_requests_case_idx
  on public.retainer_signature_requests (organization_id, case_id, created_at desc);
create index retainer_signature_requests_status_idx
  on public.retainer_signature_requests (organization_id, status);
create index retainer_signature_events_request_idx
  on public.retainer_signature_events (request_id, created_at);
create index case_parties_org_case_idx
  on public.case_parties (organization_id, case_id);
create index case_parties_org_name_idx
  on public.case_parties (organization_id, lower(name));

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.assign_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_number integer;
begin
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
      else i.status
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

create or replace function private.sync_invoice_from_child()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_new_invoice uuid;
  v_old_invoice uuid;
begin
  if tg_op <> 'DELETE' then
    v_new_invoice := new.invoice_id;
  end if;

  if tg_op <> 'INSERT' then
    v_old_invoice := old.invoice_id;
  end if;

  if v_old_invoice is not null and v_old_invoice is distinct from v_new_invoice then
    perform private.recalculate_invoice(v_old_invoice);
  end if;

  if v_new_invoice is not null then
    perform private.recalculate_invoice(v_new_invoice);
  elsif v_old_invoice is not null then
    perform private.recalculate_invoice(v_old_invoice);
  end if;

  return null;
end;
$$;

create or replace function private.prepare_retainer_request()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, extensions
as $$
begin
  if tg_op = 'INSERT' then
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

create or replace function private.log_retainer_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_event text;
  v_role text;
begin
  if tg_op = 'INSERT' then
    v_event := 'created';
  elsif new.status is distinct from old.status
        and new.status in ('sent','signed','voided') then
    v_event := new.status;
  else
    return null;
  end if;

  select coalesce(p.role, 'system')
    into v_role
  from public.profiles p
  where p.id = auth.uid();

  insert into public.retainer_signature_events (
    request_id,
    organization_id,
    case_id,
    event_type,
    actor_user_id,
    actor_role,
    detail
  )
  values (
    new.id,
    new.organization_id,
    new.case_id,
    v_event,
    auth.uid(),
    coalesce(v_role, 'system'),
    jsonb_build_object(
      'agreement_sha256', new.agreement_sha256,
      'status', new.status
    )
  );

  return null;
end;
$$;

revoke all on function private.assign_invoice_number() from public, anon, authenticated;
revoke all on function private.recalculate_invoice(uuid) from public, anon, authenticated;
revoke all on function private.sync_invoice_from_child() from public, anon, authenticated;
revoke all on function private.log_retainer_event() from public, anon, authenticated;

create trigger billing_invoices_assign_number
before insert on public.billing_invoices
for each row execute function private.assign_invoice_number();

create trigger billing_invoices_enforce_identity
before update on public.billing_invoices
for each row execute function private.enforce_invoice_identity();

create trigger billing_invoices_touch_updated_at
before update on public.billing_invoices
for each row execute function private.touch_updated_at();

create trigger billing_payments_touch_updated_at
before update on public.billing_payments
for each row execute function private.touch_updated_at();

create trigger case_parties_touch_updated_at
before update on public.case_parties
for each row execute function private.touch_updated_at();

create trigger retainer_requests_prepare
before insert or update on public.retainer_signature_requests
for each row execute function private.prepare_retainer_request();

create trigger retainer_requests_touch_updated_at
before update on public.retainer_signature_requests
for each row execute function private.touch_updated_at();

create trigger billing_items_sync_invoice
after insert or update or delete on public.billing_invoice_items
for each row execute function private.sync_invoice_from_child();

create trigger billing_payments_sync_invoice
after insert or update or delete on public.billing_payments
for each row execute function private.sync_invoice_from_child();

create trigger retainer_requests_log_event
after insert or update on public.retainer_signature_requests
for each row execute function private.log_retainer_event();

alter table public.billing_invoices enable row level security;
alter table public.billing_invoice_items enable row level security;
alter table public.billing_payments enable row level security;
alter table public.retainer_signature_requests enable row level security;
alter table public.retainer_signature_events enable row level security;
alter table public.case_parties enable row level security;

grant select, insert, update, delete on public.billing_invoices to authenticated, service_role;
grant select, insert, update, delete on public.billing_invoice_items to authenticated, service_role;
grant select, insert, update on public.billing_payments to authenticated, service_role;
grant select, insert, update, delete on public.retainer_signature_requests to authenticated, service_role;
grant select on public.retainer_signature_events to authenticated;
grant all on public.retainer_signature_events to service_role;
grant select, insert, update, delete on public.case_parties to authenticated, service_role;

revoke all on public.billing_invoices from anon;
revoke all on public.billing_invoice_items from anon;
revoke all on public.billing_payments from anon;
revoke all on public.retainer_signature_requests from anon;
revoke all on public.retainer_signature_events from anon;
revoke all on public.case_parties from anon;

create policy "Staff read org invoices"
on public.billing_invoices for select to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = billing_invoices.case_id
      and c.organization_id = billing_invoices.organization_id
  )
);

create policy "Staff create org invoices"
on public.billing_invoices for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and created_by = auth.uid()
  and exists (
    select 1 from public.cases c
    where c.id = billing_invoices.case_id
      and c.organization_id = billing_invoices.organization_id
  )
);

create policy "Staff update org invoices"
on public.billing_invoices for update to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = billing_invoices.case_id
      and c.organization_id = billing_invoices.organization_id
  )
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = billing_invoices.case_id
      and c.organization_id = billing_invoices.organization_id
  )
);

create policy "Staff delete draft org invoices"
on public.billing_invoices for delete to authenticated
using (
  status = 'draft'
  and public.is_staff_for_org(organization_id)
);

create policy "Client read own visible invoices"
on public.billing_invoices for select to authenticated
using (
  status in ('sent','partially_paid','paid')
  and exists (
    select 1
    from public.client_case_access cca
    where cca.user_id = auth.uid()
      and cca.case_id = billing_invoices.case_id
      and cca.organization_id = billing_invoices.organization_id
  )
);

create policy "Staff read org invoice items"
on public.billing_invoice_items for select to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.billing_invoices i
    where i.id = billing_invoice_items.invoice_id
      and i.organization_id = billing_invoice_items.organization_id
      and i.case_id = billing_invoice_items.case_id
  )
);

create policy "Staff create draft invoice items"
on public.billing_invoice_items for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.billing_invoices i
    where i.id = billing_invoice_items.invoice_id
      and i.organization_id = billing_invoice_items.organization_id
      and i.case_id = billing_invoice_items.case_id
      and i.status = 'draft'
  )
);

create policy "Staff update draft invoice items"
on public.billing_invoice_items for update to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.billing_invoices i
    where i.id = billing_invoice_items.invoice_id
      and i.organization_id = billing_invoice_items.organization_id
      and i.case_id = billing_invoice_items.case_id
      and i.status = 'draft'
  )
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.billing_invoices i
    where i.id = billing_invoice_items.invoice_id
      and i.organization_id = billing_invoice_items.organization_id
      and i.case_id = billing_invoice_items.case_id
      and i.status = 'draft'
  )
);

create policy "Staff delete draft invoice items"
on public.billing_invoice_items for delete to authenticated
using (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.billing_invoices i
    where i.id = billing_invoice_items.invoice_id
      and i.organization_id = billing_invoice_items.organization_id
      and i.case_id = billing_invoice_items.case_id
      and i.status = 'draft'
  )
);

create policy "Client read own invoice items"
on public.billing_invoice_items for select to authenticated
using (
  exists (
    select 1
    from public.billing_invoices i
    join public.client_case_access cca
      on cca.case_id = i.case_id
     and cca.organization_id = i.organization_id
     and cca.user_id = auth.uid()
    where i.id = billing_invoice_items.invoice_id
      and i.organization_id = billing_invoice_items.organization_id
      and i.case_id = billing_invoice_items.case_id
      and i.status in ('sent','partially_paid','paid')
  )
);

create policy "Staff read org payments"
on public.billing_payments for select to authenticated
using (
  public.is_staff_for_org(organization_id)
);

create policy "Staff create org payments"
on public.billing_payments for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and created_by = auth.uid()
  and exists (
    select 1 from public.billing_invoices i
    where i.id = billing_payments.invoice_id
      and i.organization_id = billing_payments.organization_id
      and i.case_id = billing_payments.case_id
      and i.status <> 'void'
  )
);

create policy "Staff update org payments"
on public.billing_payments for update to authenticated
using (
  public.is_staff_for_org(organization_id)
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.billing_invoices i
    where i.id = billing_payments.invoice_id
      and i.organization_id = billing_payments.organization_id
      and i.case_id = billing_payments.case_id
  )
);

create policy "Client read own payment history"
on public.billing_payments for select to authenticated
using (
  status in ('succeeded','refunded')
  and exists (
    select 1
    from public.billing_invoices i
    join public.client_case_access cca
      on cca.case_id = i.case_id
     and cca.organization_id = i.organization_id
     and cca.user_id = auth.uid()
    where i.id = billing_payments.invoice_id
      and i.organization_id = billing_payments.organization_id
      and i.case_id = billing_payments.case_id
      and i.status in ('sent','partially_paid','paid')
  )
);

create policy "Staff read org retainers"
on public.retainer_signature_requests for select to authenticated
using (
  public.is_staff_for_org(organization_id)
);

create policy "Staff create org retainers"
on public.retainer_signature_requests for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and created_by = auth.uid()
  and exists (
    select 1 from public.cases c
    where c.id = retainer_signature_requests.case_id
      and c.organization_id = retainer_signature_requests.organization_id
  )
);

create policy "Staff update org retainers"
on public.retainer_signature_requests for update to authenticated
using (
  public.is_staff_for_org(organization_id)
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = retainer_signature_requests.case_id
      and c.organization_id = retainer_signature_requests.organization_id
  )
);

create policy "Staff delete draft retainers"
on public.retainer_signature_requests for delete to authenticated
using (
  status = 'draft'
  and public.is_staff_for_org(organization_id)
);

create policy "Client read own retainers"
on public.retainer_signature_requests for select to authenticated
using (
  status in ('sent','signed')
  and exists (
    select 1
    from public.client_case_access cca
    where cca.user_id = auth.uid()
      and cca.case_id = retainer_signature_requests.case_id
      and cca.organization_id = retainer_signature_requests.organization_id
  )
);

create policy "Staff read org retainer events"
on public.retainer_signature_events for select to authenticated
using (
  public.is_staff_for_org(organization_id)
);

create policy "Client read own retainer events"
on public.retainer_signature_events for select to authenticated
using (
  exists (
    select 1
    from public.retainer_signature_requests r
    join public.client_case_access cca
      on cca.case_id = r.case_id
     and cca.organization_id = r.organization_id
     and cca.user_id = auth.uid()
    where r.id = retainer_signature_events.request_id
      and r.organization_id = retainer_signature_events.organization_id
      and r.case_id = retainer_signature_events.case_id
      and r.status in ('sent','signed')
  )
);

create policy "Staff read org case parties"
on public.case_parties for select to authenticated
using (
  public.is_staff_for_org(organization_id)
);

create policy "Staff create org case parties"
on public.case_parties for insert to authenticated
with check (
  public.is_staff_for_org(organization_id)
  and created_by = auth.uid()
  and exists (
    select 1 from public.cases c
    where c.id = case_parties.case_id
      and c.organization_id = case_parties.organization_id
  )
);

create policy "Staff update org case parties"
on public.case_parties for update to authenticated
using (
  public.is_staff_for_org(organization_id)
)
with check (
  public.is_staff_for_org(organization_id)
  and exists (
    select 1 from public.cases c
    where c.id = case_parties.case_id
      and c.organization_id = case_parties.organization_id
  )
);

create policy "Staff delete org case parties"
on public.case_parties for delete to authenticated
using (
  public.is_staff_for_org(organization_id)
);

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

revoke all on function public.sign_retainer_request(uuid, text, text, boolean) from public, anon;
grant execute on function public.sign_retainer_request(uuid, text, text, boolean) to authenticated, service_role;

create or replace function public.search_conflicts(p_query text)
returns table (
  source_type text,
  case_id uuid,
  case_number text,
  matched_name text,
  party_role text,
  matched_email text,
  match_reason text,
  score integer
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with viewer as (
    select p.organization_id
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id is not null
      and p.role in ('admin','attorney','staff','paralegal','billing','intake')
    limit 1
  ),
  q as (
    select lower(trim(coalesce(p_query, ''))) as value
  ),
  matches as (
    select
      'client'::text as source_type,
      c.id as case_id,
      c.case_number,
      trim(c.client_first_name || ' ' || c.client_last_name) as matched_name,
      'Client'::text as party_role,
      c.client_email as matched_email,
      case
        when lower(trim(c.client_first_name || ' ' || c.client_last_name)) = q.value then 'Exact client name'
        when lower(coalesce(c.client_email, '')) = q.value then 'Exact client email'
        when strpos(lower(trim(c.client_first_name || ' ' || c.client_last_name)), q.value) > 0 then 'Client name contains search'
        else 'Client email contains search'
      end as match_reason,
      case
        when lower(trim(c.client_first_name || ' ' || c.client_last_name)) = q.value then 100
        when lower(coalesce(c.client_email, '')) = q.value then 100
        else 70
      end as score
    from public.cases c
    cross join viewer
    cross join q
    where c.organization_id = viewer.organization_id
      and length(q.value) >= 2
      and (
        strpos(lower(trim(c.client_first_name || ' ' || c.client_last_name)), q.value) > 0
        or strpos(lower(coalesce(c.client_email, '')), q.value) > 0
      )

    union all

    select
      'party'::text,
      c.id,
      c.case_number,
      cp.name,
      replace(initcap(replace(cp.party_type, '_', ' ')), 'Party', 'Party'),
      cp.email,
      case
        when lower(trim(cp.name)) = q.value then 'Exact party name'
        when lower(coalesce(cp.email, '')) = q.value then 'Exact party email'
        when exists (
          select 1 from unnest(cp.aliases) a
          where lower(trim(a)) = q.value
        ) then 'Exact alias'
        when strpos(lower(cp.name), q.value) > 0 then 'Party name contains search'
        when exists (
          select 1 from unnest(cp.aliases) a
          where strpos(lower(a), q.value) > 0
        ) then 'Alias contains search'
        else 'Party email contains search'
      end,
      case
        when lower(trim(cp.name)) = q.value then 100
        when lower(coalesce(cp.email, '')) = q.value then 100
        when exists (
          select 1 from unnest(cp.aliases) a
          where lower(trim(a)) = q.value
        ) then 90
        else 70
      end
    from public.case_parties cp
    join public.cases c
      on c.id = cp.case_id
     and c.organization_id = cp.organization_id
    cross join viewer
    cross join q
    where cp.organization_id = viewer.organization_id
      and length(q.value) >= 2
      and (
        strpos(lower(cp.name), q.value) > 0
        or strpos(lower(coalesce(cp.email, '')), q.value) > 0
        or exists (
          select 1 from unnest(cp.aliases) a
          where strpos(lower(a), q.value) > 0
        )
      )
  )
  select *
  from matches
  order by score desc, case_number asc, matched_name asc
  limit 50;
$$;

revoke all on function public.search_conflicts(text) from public, anon;
grant execute on function public.search_conflicts(text) to authenticated, service_role;
