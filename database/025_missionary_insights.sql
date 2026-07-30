-- =====================================================
-- Stage 3C: Missionary Insights Engine
-- Version: 1.0
--
-- Stores per-category insight status + follow-up
-- recommendations. Evaluation runs in Edge Functions
-- after each matched Language Study Session.
-- =====================================================

-- ------------------------------------------------------------
-- Ownership helper for missionary-scoped insight rows
-- ------------------------------------------------------------

create or replace function public.owns_missionary(p_missionary_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.missionaries m
    join public.companionships c on c.id = m.companionship_id
    join public.districts d on d.id = c.district_id
    where m.id = p_missionary_id
      and d.user_id = auth.uid()
  );
$$;

revoke all on function public.owns_missionary(uuid) from public;
grant execute on function public.owns_missionary(uuid) to authenticated;

comment on function public.owns_missionary(uuid) is
  'True when the signed-in tutor owns the district that contains this missionary';

-- ------------------------------------------------------------
-- Per-category insight records (current state)
-- ------------------------------------------------------------

create table if not exists public.missionary_insight_records (
  id uuid primary key default gen_random_uuid(),

  missionary_id uuid not null
    references public.missionaries (id) on delete cascade,

  insight_category text not null
    check (insight_category in (
      'TASK_COMPLETION',
      'STUDY_EFFECTIVENESS',
      'CONFIDENCE',
      'PLANNING'
    )),

  status text not null
    check (status in ('green', 'yellow', 'red')),

  reason text not null,

  supporting_session_ids uuid[] not null default '{}',

  last_evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (missionary_id, insight_category)
);

create index if not exists missionary_insight_records_missionary_idx
  on public.missionary_insight_records (missionary_id);

create index if not exists missionary_insight_records_status_idx
  on public.missionary_insight_records (status);

comment on table public.missionary_insight_records is
  'Current Missionary Insights Engine status per measurable category';

comment on column public.missionary_insight_records.reason is
  'Human-readable explanation of the current green/yellow/red status';

comment on column public.missionary_insight_records.supporting_session_ids is
  'render_form_submissions ids used in the latest evaluation lookback';

alter table public.missionary_insight_records enable row level security;

revoke all on table public.missionary_insight_records from public;
revoke all on table public.missionary_insight_records from anon;
revoke all on table public.missionary_insight_records from authenticated;

grant select on table public.missionary_insight_records to authenticated;

create policy "missionary_insight_records_select_own"
  on public.missionary_insight_records
  for select
  to authenticated
  using (public.owns_missionary(missionary_id));

-- ------------------------------------------------------------
-- Follow-up recommendation (one row per missionary)
-- ------------------------------------------------------------

create table if not exists public.missionary_follow_up_recommendations (
  missionary_id uuid primary key
    references public.missionaries (id) on delete cascade,

  is_recommended boolean not null default false,

  reason text,

  responsible_categories text[] not null default '{}',

  recommendation_strength text not null default 'none'
    check (recommendation_strength in (
      'none',
      'mild',
      'moderate',
      'strong'
    )),

  supporting_session_ids uuid[] not null default '{}',

  last_evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists missionary_follow_up_recommendations_active_idx
  on public.missionary_follow_up_recommendations (is_recommended)
  where is_recommended = true;

comment on table public.missionary_follow_up_recommendations is
  'Explainable follow-up recommendation derived from insight category statuses';

comment on column public.missionary_follow_up_recommendations.recommendation_strength is
  'Future weighting hook: none | mild | moderate | strong';

alter table public.missionary_follow_up_recommendations enable row level security;

revoke all on table public.missionary_follow_up_recommendations from public;
revoke all on table public.missionary_follow_up_recommendations from anon;
revoke all on table public.missionary_follow_up_recommendations from authenticated;

grant select on table public.missionary_follow_up_recommendations to authenticated;

create policy "missionary_follow_up_recommendations_select_own"
  on public.missionary_follow_up_recommendations
  for select
  to authenticated
  using (public.owns_missionary(missionary_id));
