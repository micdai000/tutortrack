# TutorTrack Technology Architecture

**Project Name:** TutorTrack

**Version:** 1.0

**Status:** Planning

**Author:** Michael Davila

**Last Updated:** July 19, 2026

---

# 1. Overview

TutorTrack is a modern web application built using a client-server architecture.

The application consists of four primary layers:

- Frontend (User Interface)
- Backend Services
- Database
- Hosting

Each layer has a clearly defined responsibility, making the application easier to develop, maintain, and scale.

---

# 2. Architecture Overview

Frontend (React + Vite)

↓

Supabase Services

↓

PostgreSQL Database

↓

Vercel Hosting

---

# 3. Frontend

Technology:
- React
- Vite
- TypeScript

Purpose:

The frontend provides the user interface for tutors and teachers.

Responsibilities include:

- Displaying dashboards
- Editing missionary information
- Auto-saving user changes
- Navigation
- Authentication
- Calling Supabase APIs

---

# 4. Backend

TutorTrack uses Supabase as its Backend-as-a-Service (BaaS).

Supabase provides:

- Authentication
- Database access
- Security
- APIs

This eliminates the need to build and maintain a custom backend server for Version 1.

---

# 5. Database

Database:
- PostgreSQL (Hosted by Supabase)

The database stores:

- Tutors
- Districts
- Companionships
- Missionaries
- Language study plans

Relationships between these entities are enforced using foreign keys.

---

# 6. Authentication

Authentication is handled through Supabase Auth.

Each tutor has their own account.

After logging in, tutors can only access their own districts and missionaries.

Teachers do not need accounts to view shared Teacher Views.

---

# 7. Hosting

Frontend:
- Vercel

Backend:
- Supabase Cloud

This architecture allows deployments without managing servers.

---

# 8. Project Structure

src/
    components/
    pages/
    layouts/
    hooks/
    services/
    types/
    lib/
    assets/

public/

docs/

---

# 9. Why This Architecture?

This architecture was selected because it is:

- Simple to understand
- Fast to develop
- Easy to maintain
- Scalable for additional tutors
- Built using widely adopted industry technologies

It also minimizes infrastructure management by leveraging Supabase for backend services and Vercel for hosting.