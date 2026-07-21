-- =====================================================
-- Fix companionship / missionary RLS and create helper RPC
-- Version: 1.0
-- =====================================================

grant select, insert, update, delete on table public.companionships to authenticated;
grant select, insert, update, delete on table public.missionaries to authenticated;

alter table public.companionships enable row level security;
alter table public.missionaries enable row level security;

-- Ownership helpers run as definer so nested RLS on districts
-- does not block policy checks during INSERT.
create or replace function public.owns_district(p_district_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.districts
    where id = p_district_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.owns_companionship(p_companionship_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.companionships c
    join public.districts d on d.id = c.district_id
    where c.id = p_companionship_id
      and d.user_id = auth.uid()
  );
$$;

revoke all on function public.owns_district(uuid) from public;
revoke all on function public.owns_companionship(uuid) from public;
grant execute on function public.owns_district(uuid) to authenticated;
grant execute on function public.owns_companionship(uuid) to authenticated;

-- Recreate companionship policies
drop policy if exists "Users can view companionships in their districts" on public.companionships;
drop policy if exists "Users can create companionships in their districts" on public.companionships;
drop policy if exists "Users can update companionships in their districts" on public.companionships;
drop policy if exists "Users can delete companionships in their districts" on public.companionships;

create policy "Users can view companionships in their districts"
  on public.companionships
  for select
  to authenticated
  using (public.owns_district(district_id));

create policy "Users can create companionships in their districts"
  on public.companionships
  for insert
  to authenticated
  with check (public.owns_district(district_id));

create policy "Users can update companionships in their districts"
  on public.companionships
  for update
  to authenticated
  using (public.owns_district(district_id))
  with check (public.owns_district(district_id));

create policy "Users can delete companionships in their districts"
  on public.companionships
  for delete
  to authenticated
  using (public.owns_district(district_id));

-- Recreate missionary policies
drop policy if exists "Users can view missionaries in their companionships" on public.missionaries;
drop policy if exists "Users can create missionaries in their companionships" on public.missionaries;
drop policy if exists "Users can update missionaries in their companionships" on public.missionaries;
drop policy if exists "Users can delete missionaries in their companionships" on public.missionaries;

create policy "Users can view missionaries in their companionships"
  on public.missionaries
  for select
  to authenticated
  using (public.owns_companionship(companionship_id));

create policy "Users can create missionaries in their companionships"
  on public.missionaries
  for insert
  to authenticated
  with check (public.owns_companionship(companionship_id));

create policy "Users can update missionaries in their companionships"
  on public.missionaries
  for update
  to authenticated
  using (public.owns_companionship(companionship_id))
  with check (public.owns_companionship(companionship_id));

create policy "Users can delete missionaries in their companionships"
  on public.missionaries
  for delete
  to authenticated
  using (public.owns_companionship(companionship_id));

-- Atomic create: verifies district ownership, then inserts parent + children
create or replace function public.create_companionship_with_missionaries(
  p_district_id uuid,
  p_names text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_companionship public.companionships;
  v_result jsonb;
  v_clean_names text[];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.owns_district(p_district_id) then
    raise exception 'District not found or access denied';
  end if;

  select coalesce(array_agg(trimmed), '{}')
  into v_clean_names
  from (
    select trim(name_value) as trimmed
    from unnest(p_names) as name_value
    where trim(name_value) <> ''
  ) cleaned;

  if cardinality(v_clean_names) < 2 or cardinality(v_clean_names) > 3 then
    raise exception 'A companionship must have 2 or 3 missionaries';
  end if;

  insert into public.companionships (district_id)
  values (p_district_id)
  returning * into v_companionship;

  insert into public.missionaries (companionship_id, display_name)
  select v_companionship.id, missionary_name
  from unnest(v_clean_names) as missionary_name;

  select jsonb_build_object(
    'id', v_companionship.id,
    'district_id', v_companionship.district_id,
    'created_at', v_companionship.created_at,
    'missionaries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'companionship_id', m.companionship_id,
          'display_name', m.display_name,
          'created_at', m.created_at
        )
        order by m.created_at
      )
      from public.missionaries m
      where m.companionship_id = v_companionship.id
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.create_companionship_with_missionaries(uuid, text[]) from public;
grant execute on function public.create_companionship_with_missionaries(uuid, text[]) to authenticated;
