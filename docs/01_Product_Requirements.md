TutorTrack Product Requirements Document (PRD)

Project Name: TutorTrack

Version: 1.0

Status: Planning

Author: Michael Davila

Technical Architect: ChatGPT

Last Updated: July 19, 2026

1. Project Overview
Purpose

TutorTrack is a web application designed to help language tutors organize, review, and share individualized language study plans for missionaries.

The application provides a centralized workspace where tutors can manage districts, companionships, and missionary profiles while preparing for tutoring sessions. TutorTrack also allows tutors to generate clean, read-only Teacher Views that can be shared with classroom teachers, ensuring consistent communication and helping teachers better support each missionary's language development.

2. Problem Statement

Language tutors often work with multiple districts and companionships, each containing missionaries with unique language goals and study plans.

Because these plans frequently change, tutors need an efficient way to review, update, and organize this information before tutoring sessions. Existing tools require information to be spread across notes, documents, or conversations, making it difficult to quickly understand where each missionary is in their language learning journey.

In addition, classroom teachers benefit from having access to current language study plans, but there is no simple way to share organized, read-only summaries.

TutorTrack solves these problems by providing one centralized application where tutors can prepare for tutoring sessions, maintain current study plans, and easily share information with teachers.

3. Product Vision

TutorTrack should become the central workspace that language tutors use throughout their tutoring day.

The application should allow tutors to:

Quickly prepare for tutoring sessions.
Maintain organized language study plans.
Track follow-up responsibilities.
Share clear and professional study plans with classroom teachers.
Spend less time managing information and more time coaching missionaries.

The application should prioritize clarity, simplicity, and speed over unnecessary features.

4. Target Users
Primary Users
Language Tutors
Secondary Users
Classroom Teachers (Read-Only Teacher View)

Future versions of TutorTrack should support multiple tutors, with each tutor having access only to their own districts and missionaries.

5. Product Goals

TutorTrack should enable tutors to:

Organize districts and companionships.
Maintain current language study plans.
Update goals quickly during tutoring sessions.
Automatically save changes.
Review upcoming follow-ups.
Easily navigate between missionaries.
Share professional Teacher Views with classroom teachers.
6. Core User Workflow
Before Tutoring

The tutor logs into TutorTrack.

The dashboard immediately displays:

Follow-ups due today.
Recently updated language study plans.
A list of the tutor's districts.

The tutor selects a district and reviews the missionaries' current language study plans before meeting with the companionship.

During Tutoring

The tutor opens a missionary profile.

The tutor discusses progress with the missionary and updates:

Long-Term Goal
Short-Term Goal
Current Language Study Plan
Reflection / Progress
Next Follow-Up Notes
Follow-Up Date

All changes are automatically saved.

After Tutoring

The tutor may share a Teacher View.

Teacher Views can be generated for:

An individual missionary.
A companionship.
An entire district.

Teacher Views are read-only and designed for quick review before class.

7. Version 1 Features
Authentication
Tutor login
Multiple tutor support
Dashboard
Follow-ups due today
Recently updated plans
District overview
District Management
Create districts
Edit district names
Delete districts
Companionship Management
Organize missionaries into companionships
Navigate to either missionary
Missionary Profiles

Each missionary profile includes:

Full Name
Companion
District
Long-Term Goal
Short-Term Goal
Current Language Study Plan
Reflection / Progress
Next Follow-Up Notes
Last Updated
Follow-Up Date
Auto-Save

Changes save automatically while editing.

Teacher Views

Generate read-only Teacher Views for:

Individual missionaries
Companionships
Entire districts
8. Out of Scope (Version 1)

The following features are intentionally excluded:

Notifications
Email integration
Goal history
Analytics
Charts
Mobile application
Offline support
Attachments or file uploads
Calendar integration
AI-generated tutoring suggestions

These may be considered in future versions.

9. Success Criteria

TutorTrack Version 1 is considered successful if a tutor can:

Log in securely.
Create districts.
Organize missionaries into companionships.
Maintain language study plans.
Prepare for tutoring sessions using the dashboard.
Automatically save updates.
Share Teacher Views with classroom teachers.
10. Future Enhancements

Potential future features include:

Goal history
Search across missionaries
Tags or focus areas (e.g., pronunciation, grammar, confidence)
Custom dashboard widgets
Notifications for upcoming follow-ups
Teacher comments
AI-assisted tutoring recommendations
Data analytics
Mobile application
Export to PDF

