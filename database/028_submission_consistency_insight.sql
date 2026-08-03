-- =====================================================
-- Submission consistency insight (missed Render an Account)
-- Version: 1.0
--
-- Adds SUBMISSION_CONSISTENCY to missionary_insight_records
-- so tutors can be flagged when missionaries miss consecutive
-- opened Language Study Session days.
-- =====================================================

alter table public.missionary_insight_records
  drop constraint if exists missionary_insight_records_insight_category_check;

alter table public.missionary_insight_records
  add constraint missionary_insight_records_insight_category_check
  check (insight_category in (
    'TASK_COMPLETION',
    'STUDY_EFFECTIVENESS',
    'CONFIDENCE',
    'PLANNING',
    'SUBMISSION_CONSISTENCY'
  ));

comment on column public.missionary_insight_records.insight_category is
  'Measurable insight category. SUBMISSION_CONSISTENCY tracks consecutive missed opened session days.';
