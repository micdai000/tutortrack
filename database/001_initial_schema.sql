-- =====================================================
-- TutorTrack Initial Database Schema
-- Version: 1.0
-- =====================================================

create table districts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references auth.users(id) on delete cascade,

    name text not null,

    created_at timestamptz not null default now()
);