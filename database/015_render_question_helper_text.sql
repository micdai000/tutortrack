-- =====================================================
-- Add optional helper_text to render_questions
-- Version: 1.0
--
-- Used as Google Forms question description in a later stage.
-- =====================================================

alter table public.render_questions
  add column if not exists helper_text text;
