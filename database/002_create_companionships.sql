-- =====================================================
-- Create Companionships Table
-- =====================================================

create table companionships (
    id uuid primary key default gen_random_uuid(),

    district_id uuid not null
        references districts(id)
        on delete cascade,

    created_at timestamptz not null default now()
);