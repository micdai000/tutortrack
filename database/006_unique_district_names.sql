-- =====================================================
-- Ensure district names are unique per tutor
-- Version: 1.0
-- =====================================================

-- Different tutors may share the same district name.
-- The same tutor may not create duplicate names (case-insensitive).
create unique index if not exists districts_user_id_lower_name_key
  on districts (user_id, lower(name));
