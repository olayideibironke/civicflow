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

  if old.status = 'signed' then
    if (to_jsonb(new) - array['signed_pdf_path','signed_pdf_created_at','updated_at'])
       is distinct from
       (to_jsonb(old) - array['signed_pdf_path','signed_pdf_created_at','updated_at']) then
      raise exception 'Signed retainer requests are immutable except for signed PDF archive metadata.';
    end if;
    return new;
  end if;

  if old.status = 'voided' then
    raise exception 'Voided retainer requests are immutable.';
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
