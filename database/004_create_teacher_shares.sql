-- =====================================================
-- Create Teacher Shares Table
-- =====================================================
-- NOTE: Superseded by database/011_secure_teacher_shares.sql
-- which recreates this table with ownership, revoke support,
-- RLS, and secure public lookup RPCs.

create table teacher_shares (
    id uuid primary key default gen_random_uuid(),

    share_token text not null unique,

    share_type text not null,

    reference_id uuid not null,

    created_at timestamptz not null default now()
);
