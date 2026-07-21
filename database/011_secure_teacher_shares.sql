-- =====================================================
-- Secure Teacher Shares
-- Version: 1.0
--
-- Replaces the early teacher_shares stub with a secure
-- share-token model and SECURITY DEFINER RPCs for:
--   1) get-or-create share links (authenticated tutors)
--   2) public Teacher View lookup by token (anon + auth)
-- =====================================================

create extension if not exists pgcrypto with schema extensions;

-- Recreate table with the production share schema.
-- The original 004 stub was unused by the app and lacked
-- ownership, revoke support, and RLS.
drop table if exists public.teacher_shares cascade;

create table public.teacher_shares (
  id uuid primary key default gen_random_uuid(),

  token text not null,

  tutor_user_id uuid not null
    references auth.users (id)
    on delete cascade,

  share_type text not null
    check (share_type in ('district', 'companionship')),

  resource_id uuid not null,

  created_at timestamptz not null default now(),

  revoked_at timestamptz
);

create unique index teacher_shares_token_key
  on public.teacher_shares (token);

-- One active share per tutor + resource (revoked rows can coexist).
create unique index teacher_shares_one_active_per_resource
  on public.teacher_shares (tutor_user_id, share_type, resource_id)
  where revoked_at is null;

create index teacher_shares_resource_idx
  on public.teacher_shares (share_type, resource_id);

alter table public.teacher_shares enable row level security;

grant select, insert, update on table public.teacher_shares to authenticated;

drop policy if exists "Tutors can view their own shares" on public.teacher_shares;
drop policy if exists "Tutors can create their own shares" on public.teacher_shares;
drop policy if exists "Tutors can update their own shares" on public.teacher_shares;

create policy "Tutors can view their own shares"
  on public.teacher_shares
  for select
  to authenticated
  using (tutor_user_id = auth.uid());

create policy "Tutors can create their own shares"
  on public.teacher_shares
  for insert
  to authenticated
  with check (tutor_user_id = auth.uid());

create policy "Tutors can update their own shares"
  on public.teacher_shares
  for update
  to authenticated
  using (tutor_user_id = auth.uid())
  with check (tutor_user_id = auth.uid());

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

create or replace function public.generate_teacher_share_token()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  -- On Supabase, pgcrypto lives in the extensions schema.
  select encode(extensions.gen_random_bytes(32), 'hex');
$$;

revoke all on function public.generate_teacher_share_token() from public;

-- ------------------------------------------------------------
-- get_or_create_teacher_share
-- Authenticated tutors only. Verifies resource ownership.
-- Reuses an active share when one already exists.
-- ------------------------------------------------------------

create or replace function public.get_or_create_teacher_share(
  p_share_type text,
  p_resource_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_share_type not in ('district', 'companionship') then
    raise exception 'Invalid share type';
  end if;

  if p_share_type = 'district' then
    if not public.owns_district(p_resource_id) then
      raise exception 'Not authorized to share this district';
    end if;
  else
    if not public.owns_companionship(p_resource_id) then
      raise exception 'Not authorized to share this companionship';
    end if;
  end if;

  -- Persistent link: reuse the active token whenever possible.
  select s.token
  into v_token
  from public.teacher_shares s
  where s.tutor_user_id = v_user_id
    and s.share_type = p_share_type
    and s.resource_id = p_resource_id
    and s.revoked_at is null
  limit 1;

  if v_token is not null then
    return jsonb_build_object(
      'token', v_token,
      'created', false
    );
  end if;

  v_token := public.generate_teacher_share_token();

  insert into public.teacher_shares (
    token,
    tutor_user_id,
    share_type,
    resource_id
  )
  values (
    v_token,
    v_user_id,
    p_share_type,
    p_resource_id
  );

  return jsonb_build_object(
    'token', v_token,
    'created', true
  );
exception
  when unique_violation then
    -- Concurrent create: return the winning active token as a reuse.
    select s.token
    into v_token
    from public.teacher_shares s
    where s.tutor_user_id = v_user_id
      and s.share_type = p_share_type
      and s.resource_id = p_resource_id
      and s.revoked_at is null
    limit 1;

    if v_token is null then
      raise;
    end if;

    return jsonb_build_object(
      'token', v_token,
      'created', false
    );
end;
$$;

revoke all on function public.get_or_create_teacher_share(text, uuid) from public;
grant execute on function public.get_or_create_teacher_share(text, uuid) to authenticated;

-- ------------------------------------------------------------
-- get_teacher_view_by_share_token
-- Public (anon + authenticated). Returns Teacher View JSON
-- without internal resource UUIDs. Invalided/missing → null.
-- ------------------------------------------------------------

create or replace function public.get_teacher_view_by_share_token(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_share public.teacher_shares%rowtype;
  v_district public.districts%rowtype;
  v_companionship public.companionships%rowtype;
  v_result jsonb;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return null;
  end if;

  select *
  into v_share
  from public.teacher_shares
  where token = trim(p_token)
    and revoked_at is null
  limit 1;

  if not found then
    return null;
  end if;

  if v_share.share_type = 'companionship' then
    select c.*
    into v_companionship
    from public.companionships c
    where c.id = v_share.resource_id;

    if not found then
      return null;
    end if;

    select d.*
    into v_district
    from public.districts d
    where d.id = v_companionship.district_id
      and d.user_id = v_share.tutor_user_id;

    if not found then
      return null;
    end if;

    select jsonb_build_object(
      'share_type', 'companionship',
      'context', jsonb_build_object(
        'documentTitle', 'Language Study Plans',
        'districtName', v_district.name,
        'scopeLabel', 'Companionship'
      ),
      'missionaries', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'display_name', m.display_name,
              'long_term_goal', m.long_term_goal,
              'short_term_goal', m.short_term_goal,
              'current_study_plan', m.current_study_plan
            )
            order by m.created_at asc
          )
          from public.missionaries m
          where m.companionship_id = v_companionship.id
        ),
        '[]'::jsonb
      )
    )
    into v_result;

    return v_result;
  end if;

  if v_share.share_type = 'district' then
    select d.*
    into v_district
    from public.districts d
    where d.id = v_share.resource_id
      and d.user_id = v_share.tutor_user_id;

    if not found then
      return null;
    end if;

    select jsonb_build_object(
      'share_type', 'district',
      'context', jsonb_build_object(
        'documentTitle', 'Language Study Plans',
        'districtName', v_district.name
      ),
      'companionships', coalesce(
        (
          select jsonb_agg(section order by section_created_at asc)
          from (
            select
              c.created_at as section_created_at,
              jsonb_build_object(
                'title', 'Companionship',
                'memberNames', coalesce(
                  (
                    select jsonb_agg(m.display_name order by m.created_at asc)
                    from public.missionaries m
                    where m.companionship_id = c.id
                  ),
                  '[]'::jsonb
                ),
                'missionaries', coalesce(
                  (
                    select jsonb_agg(
                      jsonb_build_object(
                        'display_name', m.display_name,
                        'long_term_goal', m.long_term_goal,
                        'short_term_goal', m.short_term_goal,
                        'current_study_plan', m.current_study_plan
                      )
                      order by m.created_at asc
                    )
                    from public.missionaries m
                    where m.companionship_id = c.id
                  ),
                  '[]'::jsonb
                )
              ) as section
            from public.companionships c
            where c.district_id = v_district.id
          ) sections
        ),
        '[]'::jsonb
      )
    )
    into v_result;

    return v_result;
  end if;

  return null;
end;
$$;

revoke all on function public.get_teacher_view_by_share_token(text) from public;
grant execute on function public.get_teacher_view_by_share_token(text) to anon, authenticated;
