alter table public.retainer_signature_requests
  add column signed_pdf_path text,
  add column signed_pdf_created_at timestamptz;

alter table public.retainer_signature_requests
  add constraint retainer_signature_requests_signed_pdf_state
  check (
    (signed_pdf_path is null and signed_pdf_created_at is null)
    or
    (status = 'signed' and signed_pdf_path is not null and signed_pdf_created_at is not null)
  );
