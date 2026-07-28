-- =====================================================
-- Google Form publish fields + question options
-- Version: 1.0
--
-- Stage 2C: one permanent Google Form + Responses Sheet
-- per Render an Account. Options support MC / Checkboxes.
-- =====================================================

alter table public.render_accounts
  add column if not exists google_form_id text,
  add column if not exists google_form_url text,
  add column if not exists google_sheet_id text,
  add column if not exists google_sheet_url text,
  add column if not exists published_at timestamptz,
  add column if not exists last_publish_at timestamptz;

-- A form id is unique when present (one permanent form per account).
create unique index if not exists render_accounts_google_form_id_key
  on public.render_accounts (google_form_id)
  where google_form_id is not null;

alter table public.render_questions
  add column if not exists options text[] not null default '{}';
