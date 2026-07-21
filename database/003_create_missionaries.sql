-- =====================================================
-- Create Missionaries Table
-- =====================================================

create table missionaries (
    id uuid primary key default gen_random_uuid(),

    companionship_id uuid not null
        references companionships(id)
        on delete cascade,

    display_name text not null,

    long_term_goal text,

    short_term_goal text,

    current_study_plan text,

    tutor_notes text,

    follow_up_date date,

    created_at timestamptz not null default now(),

    last_updated_at timestamptz not null default now()
);
