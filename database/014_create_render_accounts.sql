-- =====================================================
-- Create Render Accounts Tables
-- Version: 1.0
--
-- Each tutor owns exactly one Render an Account.
-- Questions cascade when the parent account is deleted.
-- Response types and insight categories are fixed via CHECK.
-- =====================================================

-- ------------------------------------------------------------
-- render_accounts
-- ------------------------------------------------------------

create table public.render_accounts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null default auth.uid()
    references auth.users (id)
    on delete cascade,

  title text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One Render an Account per tutor
create unique index render_accounts_user_id_key
  on public.render_accounts (user_id);

-- ------------------------------------------------------------
-- render_questions
-- ------------------------------------------------------------

create table public.render_questions (
  id uuid primary key default gen_random_uuid(),

  render_account_id uuid not null
    references public.render_accounts (id)
    on delete cascade,

  display_order integer not null,

  question_text text not null,

  response_type text not null
    check (response_type in (
      'YES_NO',
      'RATING_1_TO_10',
      'SHORT_TEXT',
      'PARAGRAPH',
      'MULTIPLE_CHOICE',
      'CHECKBOXES'
    )),

  insight_category text not null default 'NONE'
    check (insight_category in (
      'NONE',
      'TASK_COMPLETION',
      'STUDY_EFFECTIVENESS',
      'CONFIDENCE',
      'PLANNING'
    )),

  required boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index render_questions_account_order_idx
  on public.render_questions (render_account_id, display_order);

-- ------------------------------------------------------------
-- RLS: render_accounts (direct ownership)
-- ------------------------------------------------------------

grant select, insert, update, delete on table public.render_accounts to authenticated;

alter table public.render_accounts enable row level security;

create policy "Users can view their own render accounts"
  on public.render_accounts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own render accounts"
  on public.render_accounts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own render accounts"
  on public.render_accounts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own render accounts"
  on public.render_accounts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Ownership helper for child-table RLS
-- ------------------------------------------------------------

create or replace function public.owns_render_account(p_render_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.render_accounts
    where id = p_render_account_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.owns_render_account(uuid) from public;
grant execute on function public.owns_render_account(uuid) to authenticated;

-- ------------------------------------------------------------
-- RLS: render_questions (via parent ownership)
-- ------------------------------------------------------------

grant select, insert, update, delete on table public.render_questions to authenticated;

alter table public.render_questions enable row level security;

create policy "Users can view questions in their render accounts"
  on public.render_questions
  for select
  to authenticated
  using (public.owns_render_account(render_account_id));

create policy "Users can create questions in their render accounts"
  on public.render_questions
  for insert
  to authenticated
  with check (public.owns_render_account(render_account_id));

create policy "Users can update questions in their render accounts"
  on public.render_questions
  for update
  to authenticated
  using (public.owns_render_account(render_account_id))
  with check (public.owns_render_account(render_account_id));

create policy "Users can delete questions in their render accounts"
  on public.render_questions
  for delete
  to authenticated
  using (public.owns_render_account(render_account_id));
