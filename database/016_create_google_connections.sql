-- =====================================================
-- Create Google Connections Table
-- Version: 1.0
--
-- Stores a tutor's secondary Google OAuth authorization.
-- Independent from Supabase Auth. One connection per user.
-- Tokens are for future Google Forms API stages.
-- =====================================================

create table public.google_connections (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null default auth.uid()
    references auth.users (id)
    on delete cascade,

  google_email text not null,

  google_user_id text not null,

  access_token text not null,

  refresh_token text not null,

  expires_at timestamptz not null,

  connected_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  -- One Google connection per TutorTrack user
  constraint google_connections_user_id_key unique (user_id),

  -- A Google account may only link to one TutorTrack user
  constraint google_connections_google_user_id_key unique (google_user_id)
);

-- ------------------------------------------------------------
-- RLS: owner-only access
-- ------------------------------------------------------------

grant select, insert, update, delete on table public.google_connections to authenticated;

alter table public.google_connections enable row level security;

create policy "Users can view their own google connections"
  on public.google_connections
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own google connections"
  on public.google_connections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own google connections"
  on public.google_connections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own google connections"
  on public.google_connections
  for delete
  to authenticated
  using (auth.uid() = user_id);
