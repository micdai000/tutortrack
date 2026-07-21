-- =====================================================
-- Persistent teacher share get-or-create response
-- Version: 1.0
--
-- Returns { token, created } so the UI can confirm whether
-- an existing persistent link was reused or a new one minted.
-- Also adds revoke_teacher_share for future management UI.
-- =====================================================

drop function if exists public.get_or_create_teacher_share(text, uuid);

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

-- Soft-revoke for future share management UI (no UI in this milestone).
create or replace function public.revoke_teacher_share(
  p_share_type text,
  p_resource_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_share_type not in ('district', 'companionship') then
    raise exception 'Invalid share type';
  end if;

  update public.teacher_shares
  set revoked_at = now()
  where tutor_user_id = v_user_id
    and share_type = p_share_type
    and resource_id = p_resource_id
    and revoked_at is null;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.revoke_teacher_share(text, uuid) from public;
grant execute on function public.revoke_teacher_share(text, uuid) to authenticated;
