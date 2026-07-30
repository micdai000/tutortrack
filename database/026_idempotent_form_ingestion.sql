-- =====================================================
-- Idempotent Google Form ingestion (duplicate protection)
-- Version: 1.0
--
-- Root cause: Apps Script FormResponse.getId() is not the
-- same identity as Forms API responseId. Webhook + Sync
-- could therefore insert the same submission twice.
--
-- This migration:
-- 1) Adds a stable submission_fingerprint unique key
-- 2) Copies google_response_id onto structured submissions
-- 3) Does NOT delete historical duplicate rows
-- =====================================================

alter table public.render_form_submissions_raw
  add column if not exists submission_fingerprint text;

comment on column public.render_form_submissions_raw.submission_fingerprint is
  'Stable hash of form + time + who_are_you + answers; dedupes across Apps Script and Forms API IDs';

alter table public.render_form_submissions
  add column if not exists google_response_id text,
  add column if not exists submission_fingerprint text;

comment on column public.render_form_submissions.google_response_id is
  'Google response identity used at ingest time (Forms API id preferred)';

comment on column public.render_form_submissions.submission_fingerprint is
  'Same fingerprint as raw row; DB-level duplicate safeguard';

-- Source-native response id (retries from the same source)
create unique index if not exists render_form_submissions_raw_dedupe_idx
  on public.render_form_submissions_raw (
    render_account_id,
    google_response_id
  )
  where google_response_id is not null;

-- Cross-source duplicate protection (Apps Script id ≠ Forms API id)
create unique index if not exists render_form_submissions_raw_fingerprint_uidx
  on public.render_form_submissions_raw (
    render_account_id,
    submission_fingerprint
  )
  where submission_fingerprint is not null;

create unique index if not exists render_form_submissions_response_id_uidx
  on public.render_form_submissions (
    render_account_id,
    google_response_id
  )
  where google_response_id is not null;

create unique index if not exists render_form_submissions_fingerprint_uidx
  on public.render_form_submissions (
    render_account_id,
    submission_fingerprint
  )
  where submission_fingerprint is not null;

-- Optional diagnostic (read-only; does not delete):
-- select render_account_id, who_are_you_label, submitted_at, count(*)
-- from public.render_form_submissions
-- group by 1, 2, 3
-- having count(*) > 1;
