-- =====================================================
-- Create Teacher Shares Table
-- =====================================================

create table teacher_shares (
    id uuid primary key default gen_random_uuid(),

    share_token text not null unique,

    share_type text not null,

    reference_id uuid not null,

    created_at timestamptz not null default now()
);