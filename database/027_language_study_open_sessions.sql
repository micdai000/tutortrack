-- =====================================================
-- Stage 3E: Open Language Study Sessions (daily begin)
-- Version: 1.0
--
-- One OPEN session per district per local calendar day.
-- Created when the tutor begins Today's Render an Account.
-- =====================================================

create table if not exists public.language_study_open_sessions (
  id uuid primary key default gen_random_uuid(),

  district_id uuid not null
    references public.districts (id) on delete cascade,

  -- Tutor's local calendar day (YYYY-MM-DD), not submission timestamps
  session_date date not null,

  status text not null default 'open'
    check (status in ('open', 'closed')),

  google_form_url text,

  opened_at timestamptz not null default now(),
  opened_by uuid not null default auth.uid()
    references auth.users (id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (district_id, session_date)
);

create index if not exists language_study_open_sessions_date_idx
  on public.language_study_open_sessions (session_date desc);

create index if not exists language_study_open_sessions_district_idx
  on public.language_study_open_sessions (district_id);

comment on table public.language_study_open_sessions is
  'Tutor-opened daily Language Study Sessions per district (Stage 3E workflow)';

comment on column public.language_study_open_sessions.session_date is
  'Local calendar day associated with this open session';

alter table public.language_study_open_sessions enable row level security;

revoke all on table public.language_study_open_sessions from public;
revoke all on table public.language_study_open_sessions from anon;
revoke all on table public.language_study_open_sessions from authenticated;

grant select, insert, update, delete
  on table public.language_study_open_sessions to authenticated;

create policy "language_study_open_sessions_select_own"
  on public.language_study_open_sessions
  for select
  to authenticated
  using (public.owns_district(district_id));

create policy "language_study_open_sessions_insert_own"
  on public.language_study_open_sessions
  for insert
  to authenticated
  with check (public.owns_district(district_id));

create policy "language_study_open_sessions_update_own"
  on public.language_study_open_sessions
  for update
  to authenticated
  using (public.owns_district(district_id))
  with check (public.owns_district(district_id));

create policy "language_study_open_sessions_delete_own"
  on public.language_study_open_sessions
  for delete
  to authenticated
  using (public.owns_district(district_id));
