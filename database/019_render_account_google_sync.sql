-- =====================================================
-- Google Form sync status + question item ID mapping
-- Version: 1.0
--
-- Stage 2D: TutorTrack remains source of truth.
-- Tutors edit locally; Sync Changes pushes to Google.
-- =====================================================

alter table public.render_accounts
  add column if not exists last_synced_at timestamptz,
  add column if not exists sync_status text not null default 'up_to_date',
  add column if not exists needs_sync boolean not null default false;

alter table public.render_accounts
  drop constraint if exists render_accounts_sync_status_check;

alter table public.render_accounts
  add constraint render_accounts_sync_status_check
  check (sync_status in ('up_to_date', 'changes_pending'));

comment on column public.render_accounts.sync_status is
  'up_to_date | changes_pending — Google Form mirror status';

comment on column public.render_accounts.needs_sync is
  'True when TutorTrack question edits are not yet mirrored to Google';

alter table public.render_questions
  add column if not exists google_question_id text;

comment on column public.render_questions.google_question_id is
  'Google Forms item ID for this question (permanent mapping)';

create unique index if not exists render_questions_google_question_id_key
  on public.render_questions (google_question_id)
  where google_question_id is not null;

-- Existing published forms need one Sync Changes pass to store Google item IDs.
update public.render_accounts ra
set
  needs_sync = true,
  sync_status = 'changes_pending'
where ra.google_form_id is not null
  and exists (
    select 1
    from public.render_questions rq
    where rq.render_account_id = ra.id
      and rq.google_question_id is null
  );
