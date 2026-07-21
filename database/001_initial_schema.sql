-- =====================================================
-- TutorTrack Initial Database Schema
-- Version: 1.0
-- =====================================================

create table districts (
    id uuid primary key default gen_random_uuid(),

    -- Defaults to the signed-in tutor so inserts match RLS (auth.uid() = user_id)
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

    name text not null,

    created_at timestamptz not null default now()
);