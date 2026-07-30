-- =====================================================
-- Expose Apps Script project id for manual trigger setup
-- Version: 1.0
-- =====================================================

alter table public.render_accounts
  add column if not exists apps_script_project_id text;

comment on column public.render_accounts.apps_script_project_id is
  'Google Apps Script project id for TutorTrack response pipeline (non-secret)';
