-- =====================================================
-- Align missionaries timestamp column with app naming
-- Version: 1.0
-- =====================================================

-- Prefer last_updated_at for the Missionary Profile + future Dashboard.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'missionaries'
      and column_name = 'updated_at'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'missionaries'
      and column_name = 'last_updated_at'
  ) then
    alter table public.missionaries
      rename column updated_at to last_updated_at;
  end if;
end $$;

alter table public.missionaries
  alter column last_updated_at set default now();
