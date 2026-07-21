-- =====================================================
-- Fix districts RLS so authenticated tutors can insert
-- Version: 1.0
-- =====================================================

-- Table access for the authenticated role
grant select, insert, update, delete on table public.districts to authenticated;

-- Keep ownership aligned with the JWT even if the client omits user_id
alter table public.districts
  alter column user_id set default auth.uid();

alter table public.districts enable row level security;

-- Recreate policies from a known-good state
drop policy if exists "Users can view their own districts" on public.districts;
drop policy if exists "Users can create their own districts" on public.districts;
drop policy if exists "Users can update their own districts" on public.districts;
drop policy if exists "Users can delete their own districts" on public.districts;

create policy "Users can view their own districts"
  on public.districts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own districts"
  on public.districts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own districts"
  on public.districts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own districts"
  on public.districts
  for delete
  to authenticated
  using (auth.uid() = user_id);
