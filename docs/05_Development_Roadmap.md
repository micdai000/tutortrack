# TutorTrack Development Roadmap

**Project Name:** TutorTrack

**Version:** 1.0

**Status:** Planning

**Author:** Michael Davila

**Last Updated:** July 19, 2026

---

# Overview

This roadmap breaks the development of TutorTrack into small, manageable phases. Each phase should result in a working, testable version of the application before moving on to the next.

---

# Phase 1 – Project Setup

## Goal

Create the foundation of the application.

### Tasks

- Create React + Vite project
- Configure TypeScript
- Initialize Git repository
- Connect GitHub repository
- Create Supabase project
- Connect Supabase to the frontend
- Configure environment variables
- Verify the application runs locally

**Milestone:** A running application connected to Supabase.

---

# Phase 2 – Authentication

## Goal

Allow tutors to securely log in.

### Tasks

- Configure Supabase Authentication
- Create Login page
- Create protected routes
- Add Logout functionality
- Verify tutors only access their own data

**Milestone:** Secure login is working.

---

# Phase 3 – Dashboard

## Goal

Build the tutor's home page.

### Tasks

- Display today's follow-ups
- Display recently updated missionaries
- Display district list
- Add navigation to district pages

**Milestone:** Dashboard displays real data.

---

# Phase 4 – District Management

## Goal

Allow tutors to manage districts.

### Tasks

- Create district
- Edit district
- Delete district
- View district details

**Milestone:** District management is complete.

---

# Phase 5 – Companionship Management

## Goal

Organize missionaries into companionships.

### Tasks

- Create companionship
- Edit companionship
- Delete companionship
- Display companionships within districts

**Milestone:** Districts display companionships correctly.

---

# Phase 6 – Missionary Profiles

## Goal

Create the primary workspace for tutors.

### Tasks

- Create missionary
- Edit missionary
- Delete missionary
- Auto-save changes
- Display all profile fields

**Milestone:** Missionary profiles are fully functional.

---

# Phase 7 – Teacher Views

## Goal

Share read-only study plans.

### Tasks

- Individual Teacher View
- Companionship Teacher View
- District Teacher View
- Generate shareable links

**Milestone:** Teacher Views are shareable.

---

# Phase 8 – UI Polish

## Goal

Improve usability and appearance.

### Tasks

- Loading states
- Empty states
- Error handling
- Responsive layout
- Final styling

**Milestone:** Version 1 is polished and ready for use.

---

# Version 1 Complete

TutorTrack Version 1 is complete when:

- Tutors can log in.
- Districts and companionships can be managed.
- Missionary profiles support auto-save.
- Teacher Views can be shared.
- Dashboard displays relevant tutoring information.