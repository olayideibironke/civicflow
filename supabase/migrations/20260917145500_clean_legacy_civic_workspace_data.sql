update public.organizations
set name = 'Legal Workspace',
    slug = 'legal-workspace',
    default_service_categories = array['Criminal Defense','Family Law','Immigration','Civil Litigation','General Legal Matter']::text[],
    updated_at = now()
where name = 'Community Services' or slug = 'community-services';

update public.cases
set service_category = 'General Legal Matter'
where service_category = 'Eligibility Review';

update public.cases
set assigned_to = 'Legal Team'
where assigned_to = 'Eligibility Review Team';

update public.cases
set source = 'Client Intake'
where source = 'Public Intake';

update public.cases
set decision_outcome = 'Resolved'
where decision_outcome = 'Approved';

update public.cases
set decision_note = 'Matter review completed and required records were reviewed.'
where decision_note is not null
  and (decision_note ilike '%final decision%' or decision_note ilike '%required documents%');

update public.cases
set summary = case case_number
  when 'CF-1001' then 'Initial legal matter review completed. Supporting records were reviewed and the matter was resolved.'
  when 'CF-1002' then 'Staff-created legal matter used to validate the case workflow.'
  when 'CF-1003' then 'Client intake matter used to validate document and workflow handling.'
  when 'CF-1004' then 'New legal matter awaiting staff review and assignment.'
  when 'CF-1005' then 'New legal matter awaiting staff review and assignment.'
  else summary
end
where case_number in ('CF-1001','CF-1002','CF-1003','CF-1004','CF-1005');

update public.case_documents
set name = 'Client intake form',
    description = 'Signed client intake questionnaire or initial matter information form.'
where name = 'Program eligibility form';

update public.case_activity
set title = replace(title, 'Case created from public intake', 'Matter created from client intake'),
    detail = replace(
      replace(
        replace(
          replace(detail, 'Public intake submission created', 'Client intake submission created'),
          'Eligibility Review queue', 'legal review queue'
        ),
        'Program eligibility form', 'Client intake form'
      ),
      'Final outcome: Approved.', 'Final outcome: Resolved.'
    );

update public.case_activity
set detail = replace(detail, 'Eligibility Review Team', 'Legal Team')
where detail like '%Eligibility Review Team%';
