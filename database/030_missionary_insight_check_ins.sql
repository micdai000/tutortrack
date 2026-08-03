-- =====================================================
-- Missionary insight check-ins
-- Version: 1.0
--
-- Lets tutors mark a Missionaries in Need check-in complete
-- without mutating live insight status. A card stays hidden
-- until that insight is re-evaluated (new last_evaluated_at).
-- =====================================================

create table if not exists public.missionary_insight_check_ins (
  id uuid primary key default gen_random_uuid(),

  insight_record_id uuid not null
    references public.missionary_insight_records (id) on delete cascade,

  missionary_id uuid not null
    references public.missionaries (id) on delete cascade,

  insight_category text not null
    check (insight_category in (
      'TASK_COMPLETION',
      'STUDY_EFFECTIVENESS',
      'CONFIDENCE',
      'PLANNING',
      'SUBMISSION_CONSISTENCY'
    )),

  -- Fingerprint of the insight state that was checked in.
  acknowledged_last_evaluated_at timestamptz not null,

  completed_at timestamptz not null default now(),
  completed_by uuid not null references auth.users (id) on delete cascade,

  unique (missionary_id, insight_category)
);

create index if not exists missionary_insight_check_ins_missionary_idx
  on public.missionary_insight_check_ins (missionary_id);

create index if not exists missionary_insight_check_ins_insight_idx
  on public.missionary_insight_check_ins (insight_record_id);

comment on table public.missionary_insight_check_ins is
  'Tutor check-in completions for Missionaries in Need cards';

comment on column public.missionary_insight_check_ins.acknowledged_last_evaluated_at is
  'Insight last_evaluated_at at check-in time; card returns if the insight is re-evaluated';

alter table public.missionary_insight_check_ins enable row level security;

revoke all on table public.missionary_insight_check_ins from public;
revoke all on table public.missionary_insight_check_ins from anon;
revoke all on table public.missionary_insight_check_ins from authenticated;

grant select, insert, update, delete on table public.missionary_insight_check_ins
  to authenticated;

create policy "missionary_insight_check_ins_select_own"
  on public.missionary_insight_check_ins
  for select
  to authenticated
  using (public.owns_missionary(missionary_id));

create policy "missionary_insight_check_ins_insert_own"
  on public.missionary_insight_check_ins
  for insert
  to authenticated
  with check (
    public.owns_missionary(missionary_id)
    and completed_by = auth.uid()
  );

create policy "missionary_insight_check_ins_update_own"
  on public.missionary_insight_check_ins
  for update
  to authenticated
  using (public.owns_missionary(missionary_id))
  with check (
    public.owns_missionary(missionary_id)
    and completed_by = auth.uid()
  );

create policy "missionary_insight_check_ins_delete_own"
  on public.missionary_insight_check_ins
  for delete
  to authenticated
  using (public.owns_missionary(missionary_id));
