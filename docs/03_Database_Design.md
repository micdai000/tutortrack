# TutorTrack Database Design

**Project Name:** TutorTrack

**Version:** 1.0

**Status:** Planning

**Author:** Michael Davila

**Last Updated:** July 19, 2026

---

# 1. Overview

TutorTrack uses a relational PostgreSQL database hosted by Supabase.

The database is designed around five core entities:

- Tutors
- Districts
- Companionships
- Missionaries
- Shared Teacher Views

Each entity has a specific responsibility and is connected through foreign key relationships.

---

# 2. Database Relationships

Tutor
│
└── Districts
        │
        └── Companionships
                │
                └── Missionaries


---

# Table 1 — Tutors

| Field | Type | Notes |
|---------|------|------|
| id | UUID | Primary Key |
| full_name | Text | |
| email | Text | Linked to Supabase Auth |
| created_at | Timestamp | |

---

## Why this table exists

Every district belongs to one tutor.

This allows TutorTrack to support multiple tutors while keeping everyone's data separate.

---

# Table 2 — Districts

| Field | Type |
|---------|------|
| id | UUID |
| tutor_id | UUID |
| name | Text |
| created_at | Timestamp |

Relationship:

---

# Table 3 — Companionships

| Field | Type |
|---------|------|
| id | UUID |
| district_id | UUID |
| name | Text *(optional)* |
| created_at | Timestamp |

Relationship

We may not actually display a companionship name (e.g., "Companionship 1"), but giving each companionship its own record makes the relationships much cleaner.

---

# Table 4 — Missionaries

This will be our main table.

| Field | Type |
|---------|------|
| id | UUID |
| companionship_id | UUID |
| first_name | Text |
| last_name | Text |
| long_term_goal | Text |
| short_term_goal | Text |
| study_plan | Text |
| reflection_progress | Text |
| next_follow_up_notes | Text |
| follow_up_date | Date |
| last_updated | Timestamp |
| created_at | Timestamp |

Relationship

Even though there are usually two missionaries, the database doesn't enforce exactly two. That gives us flexibility for unusual situations.

---

# Table 5 — Shared Teacher Views

This table supports the sharing feature.

| Field | Type |
|---------|------|
| id | UUID |
| share_token | Text |
| share_type | Text |
| reference_id | UUID |
| created_at | Timestamp |

The `share_type` could be:

- missionary
- companionship
- district

The `reference_id` points to whichever item is being shared.

---

# Why not create separate tables for goals or notes?

Because Version 1 only stores the **current** information.

Creating separate tables would make the application more complicated without providing additional value.

If TutorTrack later supports history, versioning, or multiple study plans, those tables can be added without changing the overall architecture.

---

# Database Design Principles

- Keep the schema simple.
- Store each piece of information only once.
- Use relationships instead of duplicated data.
- Design for future growth without overengineering Version 1.