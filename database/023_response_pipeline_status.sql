-- =====================================================
-- Client-visible response pipeline status (Stage 3A debug)
-- Version: 1.0
-- =====================================================

alter table public.render_accounts
  add column if not exists response_pipeline_status text
    not null default 'not_installed',
  add column if not exists response_pipeline_error text,
  add column if not exists response_pipeline_installed_at timestamptz;

alter table public.render_accounts
  drop constraint if exists render_accounts_response_pipeline_status_check;

alter table public.render_accounts
  add constraint render_accounts_response_pipeline_status_check
  check (response_pipeline_status in ('not_installed', 'installed', 'error'));

comment on column public.render_accounts.response_pipeline_status is
  'Apps Script On Form Submit pipeline status (safe for client UI)';
