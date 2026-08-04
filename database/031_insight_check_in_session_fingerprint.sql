-- =====================================================
-- Insight check-in session fingerprint
-- Version: 1.0
--
-- Dashboard refresh re-evaluates insights and updates
-- last_evaluated_at every time, which made check-ins
-- appear incomplete after reload. Fingerprint the
-- supporting session ids instead so a completed check-in
-- stays hidden until the underlying issue changes.
-- =====================================================

alter table public.missionary_insight_check_ins
  add column if not exists acknowledged_supporting_session_ids uuid[]
    not null default '{}';

comment on column public.missionary_insight_check_ins.acknowledged_supporting_session_ids is
  'Supporting/open session ids at check-in time; card returns only when this set changes';

comment on column public.missionary_insight_check_ins.acknowledged_last_evaluated_at is
  'Audit timestamp of the insight evaluation that was checked in (not used for visibility)';
