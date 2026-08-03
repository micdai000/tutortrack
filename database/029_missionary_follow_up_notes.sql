-- =====================================================
-- Missionary follow-up notes
-- Version: 1.0
--
-- Optional tutor reminder text for a scheduled follow-up.
-- =====================================================

alter table public.missionaries
  add column if not exists follow_up_notes text;

comment on column public.missionaries.follow_up_notes is
  'Optional tutor notes explaining why a follow-up was scheduled';
