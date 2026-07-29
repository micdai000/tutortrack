-- =====================================================
-- Stage 2E: TutorTrack-managed "Who are you?" dropdown
-- Version: 1.0
--
-- Replaces Companionship + Missionary Google Form questions.
-- Stores Google item ID + missionary→option_label mapping for Stage 3.
-- =====================================================

alter table public.render_accounts
  add column if not exists who_are_you_google_question_id text;

comment on column public.render_accounts.who_are_you_google_question_id is
  'Google Forms item ID for the TutorTrack-managed Who are you? dropdown';

create table if not exists public.render_who_are_you_options (
  id uuid primary key default gen_random_uuid(),
  render_account_id uuid not null
    references public.render_accounts (id) on delete cascade,
  missionary_id uuid not null
    references public.missionaries (id) on delete cascade,
  option_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (render_account_id, missionary_id)
);

create index if not exists render_who_are_you_options_account_label_idx
  on public.render_who_are_you_options (render_account_id, option_label);

comment on table public.render_who_are_you_options is
  'Exact Google Form option labels synced for each missionary (Stage 3 lookup)';

alter table public.render_who_are_you_options enable row level security;

drop policy if exists "render_who_are_you_options_select_own"
  on public.render_who_are_you_options;
create policy "render_who_are_you_options_select_own"
  on public.render_who_are_you_options
  for select
  to authenticated
  using (public.owns_render_account(render_account_id));

-- Published forms need one Sync Changes pass to migrate Section 1.
update public.render_accounts
set
  needs_sync = true,
  sync_status = 'changes_pending'
where google_form_id is not null;
