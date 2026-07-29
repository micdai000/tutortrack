-- =====================================================
-- Remove MULTIPLE_CHOICE and CHECKBOXES response types
-- Version: 1.0
-- =====================================================

-- Convert any existing choice questions to short text.
update public.render_questions
set
  response_type = 'SHORT_TEXT',
  options = '{}',
  updated_at = now()
where response_type in ('MULTIPLE_CHOICE', 'CHECKBOXES');

alter table public.render_questions
  drop constraint if exists render_questions_response_type_check;

alter table public.render_questions
  add constraint render_questions_response_type_check
  check (response_type in (
    'YES_NO',
    'RATING_1_TO_10',
    'SHORT_TEXT',
    'PARAGRAPH'
  ));
