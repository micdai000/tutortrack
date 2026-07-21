-- =====================================================
-- RLS for companionships and missionaries
-- Version: 1.0
-- =====================================================

grant select, insert, update, delete on table public.companionships to authenticated;
grant select, insert, update, delete on table public.missionaries to authenticated;

alter table public.companionships enable row level security;
alter table public.missionaries enable row level security;

-- Companionships: access only through districts the tutor owns
drop policy if exists "Users can view companionships in their districts" on public.companionships;
drop policy if exists "Users can create companionships in their districts" on public.companionships;
drop policy if exists "Users can update companionships in their districts" on public.companionships;
drop policy if exists "Users can delete companionships in their districts" on public.companionships;

create policy "Users can view companionships in their districts"
  on public.companionships
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.districts
      where districts.id = companionships.district_id
        and districts.user_id = auth.uid()
    )
  );

create policy "Users can create companionships in their districts"
  on public.companionships
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.districts
      where districts.id = companionships.district_id
        and districts.user_id = auth.uid()
    )
  );

create policy "Users can update companionships in their districts"
  on public.companionships
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.districts
      where districts.id = companionships.district_id
        and districts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.districts
      where districts.id = companionships.district_id
        and districts.user_id = auth.uid()
    )
  );

create policy "Users can delete companionships in their districts"
  on public.companionships
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.districts
      where districts.id = companionships.district_id
        and districts.user_id = auth.uid()
    )
  );

-- Missionaries: access only through companionships in owned districts
drop policy if exists "Users can view missionaries in their companionships" on public.missionaries;
drop policy if exists "Users can create missionaries in their companionships" on public.missionaries;
drop policy if exists "Users can update missionaries in their companionships" on public.missionaries;
drop policy if exists "Users can delete missionaries in their companionships" on public.missionaries;

create policy "Users can view missionaries in their companionships"
  on public.missionaries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.companionships
      join public.districts on districts.id = companionships.district_id
      where companionships.id = missionaries.companionship_id
        and districts.user_id = auth.uid()
    )
  );

create policy "Users can create missionaries in their companionships"
  on public.missionaries
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.companionships
      join public.districts on districts.id = companionships.district_id
      where companionships.id = missionaries.companionship_id
        and districts.user_id = auth.uid()
    )
  );

create policy "Users can update missionaries in their companionships"
  on public.missionaries
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.companionships
      join public.districts on districts.id = companionships.district_id
      where companionships.id = missionaries.companionship_id
        and districts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.companionships
      join public.districts on districts.id = companionships.district_id
      where companionships.id = missionaries.companionship_id
        and districts.user_id = auth.uid()
    )
  );

create policy "Users can delete missionaries in their companionships"
  on public.missionaries
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.companionships
      join public.districts on districts.id = companionships.district_id
      where companionships.id = missionaries.companionship_id
        and districts.user_id = auth.uid()
    )
  );
