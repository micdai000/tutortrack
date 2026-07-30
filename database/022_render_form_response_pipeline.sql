-- =====================================================
-- Stage 3A: Google Form response ingestion pipeline
-- Version: 1.0
--
-- Raw immutable payloads + structured TutorTrack records.
-- Apps Script credentials are service-role only.
-- =====================================================

-- ------------------------------------------------------------
-- Per-account ingestion credentials (never exposed to clients)
-- ------------------------------------------------------------

create table if not exists public.render_ingestion_credentials (
  render_account_id uuid primary key
    references public.render_accounts (id) on delete cascade,

  webhook_secret text not null,

  apps_script_project_id text,
  apps_script_deployment_id text,

  install_status text not null default 'not_installed'
    check (install_status in (
      'not_installed',
      'installed',
      'error'
    )),
  install_error text,
  installed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.render_ingestion_credentials is
  'Apps Script webhook secrets + install metadata (service role only)';

alter table public.render_ingestion_credentials enable row level security;

revoke all on table public.render_ingestion_credentials from public;
revoke all on table public.render_ingestion_credentials from anon;
revoke all on table public.render_ingestion_credentials from authenticated;

-- ------------------------------------------------------------
-- Raw submissions (immutable Google payload)
-- ------------------------------------------------------------

create table if not exists public.render_form_submissions_raw (
  id uuid primary key default gen_random_uuid(),

  render_account_id uuid not null
    references public.render_accounts (id) on delete cascade,

  google_form_id text,
  google_sheet_id text,
  google_response_id text,

  submitted_at timestamptz,
  payload jsonb not null,

  received_at timestamptz not null default now(),

  process_status text not null default 'pending'
    check (process_status in ('pending', 'processed', 'failed')),
  process_error text,
  processed_at timestamptz
);

create unique index if not exists render_form_submissions_raw_dedupe_idx
  on public.render_form_submissions_raw (
    render_account_id,
    google_response_id
  )
  where google_response_id is not null;

create index if not exists render_form_submissions_raw_account_received_idx
  on public.render_form_submissions_raw (render_account_id, received_at desc);

comment on table public.render_form_submissions_raw is
  'Immutable Google Form submission payloads from Apps Script';

alter table public.render_form_submissions_raw enable row level security;

revoke all on table public.render_form_submissions_raw from public;
revoke all on table public.render_form_submissions_raw from anon;
revoke all on table public.render_form_submissions_raw from authenticated;

-- Tutors may read their own raw rows later (Responses page); no client writes.
grant select on table public.render_form_submissions_raw to authenticated;

create policy "render_form_submissions_raw_select_own"
  on public.render_form_submissions_raw
  for select
  to authenticated
  using (public.owns_render_account(render_account_id));

-- ------------------------------------------------------------
-- Structured submission header
-- ------------------------------------------------------------

create table if not exists public.render_form_submissions (
  id uuid primary key default gen_random_uuid(),

  render_account_id uuid not null
    references public.render_accounts (id) on delete cascade,

  raw_submission_id uuid not null unique
    references public.render_form_submissions_raw (id) on delete cascade,

  missionary_id uuid
    references public.missionaries (id) on delete set null,

  who_are_you_label text,
  match_status text not null default 'unmatched'
    check (match_status in ('matched', 'unmatched')),
  match_method text not null default 'none'
    check (match_method in ('option_label', 'none')),

  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists render_form_submissions_account_submitted_idx
  on public.render_form_submissions (render_account_id, submitted_at desc);

create index if not exists render_form_submissions_missionary_idx
  on public.render_form_submissions (missionary_id);

comment on table public.render_form_submissions is
  'Normalized submission headers for analytics (Stage 3+)';

alter table public.render_form_submissions enable row level security;

revoke all on table public.render_form_submissions from public;
revoke all on table public.render_form_submissions from anon;
revoke all on table public.render_form_submissions from authenticated;

grant select on table public.render_form_submissions to authenticated;

create policy "render_form_submissions_select_own"
  on public.render_form_submissions
  for select
  to authenticated
  using (public.owns_render_account(render_account_id));

-- ------------------------------------------------------------
-- Structured per-question answers (snapshots for analytics)
-- ------------------------------------------------------------

create table if not exists public.render_form_answers (
  id uuid primary key default gen_random_uuid(),

  submission_id uuid not null
    references public.render_form_submissions (id) on delete cascade,

  render_question_id uuid
    references public.render_questions (id) on delete set null,

  google_question_id text,
  question_text text not null,
  response_type text,
  insight_category text,
  response_value text,

  created_at timestamptz not null default now()
);

create index if not exists render_form_answers_submission_idx
  on public.render_form_answers (submission_id);

create index if not exists render_form_answers_question_idx
  on public.render_form_answers (render_question_id);

comment on table public.render_form_answers is
  'Per-question structured answers with TutorTrack metadata snapshots';

alter table public.render_form_answers enable row level security;

revoke all on table public.render_form_answers from public;
revoke all on table public.render_form_answers from anon;
revoke all on table public.render_form_answers from authenticated;

grant select on table public.render_form_answers to authenticated;

create policy "render_form_answers_select_own"
  on public.render_form_answers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.render_form_submissions s
      where s.id = submission_id
        and public.owns_render_account(s.render_account_id)
    )
  );
