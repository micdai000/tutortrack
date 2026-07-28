-- =====================================================
-- Google OAuth states + lock down google_connections tokens
-- Version: 1.0
--
-- Stage 2B: Authorization Code Flow via Edge Functions.
-- Clients may only read connection summaries and delete
-- their own row. Token writes use the service role.
-- =====================================================

-- ------------------------------------------------------------
-- One-time OAuth state (CSRF / user binding)
-- ------------------------------------------------------------

create table public.google_oauth_states (
  state text primary key,

  user_id uuid not null
    references auth.users (id)
    on delete cascade,

  created_at timestamptz not null default now(),

  expires_at timestamptz not null
);

create index google_oauth_states_user_id_idx
  on public.google_oauth_states (user_id);

create index google_oauth_states_expires_at_idx
  on public.google_oauth_states (expires_at);

alter table public.google_oauth_states enable row level security;

-- No policies for anon/authenticated — only service role can use this table.
revoke all on table public.google_oauth_states from public;
revoke all on table public.google_oauth_states from anon;
revoke all on table public.google_oauth_states from authenticated;

-- ------------------------------------------------------------
-- google_connections: summary read + delete only for tutors
-- ------------------------------------------------------------

revoke all on table public.google_connections from public;
revoke all on table public.google_connections from anon;
revoke all on table public.google_connections from authenticated;

-- Safe columns only (never access_token / refresh_token).
grant select (
  id,
  user_id,
  google_email,
  google_user_id,
  expires_at,
  connected_at,
  updated_at
) on table public.google_connections to authenticated;

grant delete on table public.google_connections to authenticated;

-- Keep owner RLS for select/delete; drop client insert/update policies.
drop policy if exists "Users can create their own google connections"
  on public.google_connections;
drop policy if exists "Users can update their own google connections"
  on public.google_connections;

-- Select / delete policies remain from 016.
