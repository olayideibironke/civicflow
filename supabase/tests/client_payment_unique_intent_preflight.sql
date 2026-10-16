-- READ-ONLY preflight. Safe to run against existing records after review.
-- Any returned row is a blocker: investigate duplicates before applying index.
select organization_id, processor_reference, count(*) as duplicate_count
from public.billing_payments
where processor = 'stripe'
  and status = 'succeeded'
  and processor_reference is not null
group by organization_id, processor_reference
having count(*) > 1
order by duplicate_count desc, organization_id, processor_reference;

-- Null or blank processor references are not covered by the draft index.
-- They need independent reconciliation before financial posting activation.
select organization_id,
       count(*) filter (where processor_reference is null) as null_reference_count,
       count(*) filter (where processor_reference = '') as blank_reference_count
from public.billing_payments
where processor = 'stripe' and status = 'succeeded'
  and (processor_reference is null or processor_reference = '')
group by organization_id
order by organization_id;
