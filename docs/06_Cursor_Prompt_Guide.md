# TutorTrack Cursor Prompt Guide

**Project Name:** TutorTrack

**Version:** 1.0

**Status:** Planning

**Author:** Michael Davila

**Last Updated:** July 19, 2026

---

# Purpose

This document defines how Cursor should be used throughout the development of TutorTrack.

The goal is to produce clean, maintainable, and consistent code by giving Cursor focused tasks instead of large, open-ended requests.

---

# Prompting Principles

## 1. One Task at a Time

Each prompt should focus on a single feature or objective.

Good:

"Create the Dashboard page."

Bad:

"Build the entire application."

---

## 2. Provide Context

Whenever possible, explain where the new feature fits into the application.

Example:

"TutorTrack already has authentication and district management. Build the Missionary Profile page."

---

## 3. Reference Existing Documentation

Cursor should use the documentation in the `docs/` folder as the source of truth.

Before implementing a feature, instruct Cursor to review the relevant documentation.

---

## 4. Keep Existing Code

Unless explicitly instructed, Cursor should preserve the existing architecture, styling, and functionality.

---

## 5. Build Incrementally

Each completed feature should compile successfully and be testable before moving to the next feature.

---

# Prompt Template

Use this template for most development tasks.

---

You are a Senior Full-Stack Software Engineer.

You are working on TutorTrack, a React + Vite + TypeScript application using Supabase.

Before making changes, review the relevant documentation inside the `docs/` folder.

Requirements:

- Build only the requested feature.
- Preserve the existing project architecture.
- Write clean, readable TypeScript.
- Reuse components whenever appropriate.
- Keep the UI consistent with the project's design guidelines.
- Explain any significant architectural decisions.

Task:

<Describe the feature here>

---

# Development Workflow

For each feature:

1. Read the relevant documentation.
2. Understand the existing codebase.
3. Create a development plan.
4. Implement the feature.
5. Verify the project builds successfully.
6. Explain what was changed.

---

# Examples

## Example 1

Task:

Create the Dashboard page described in the Product Requirements Document.

---

## Example 2

Task:

Implement auto-save for the Missionary Profile page.

---

## Example 3

Task:

Create the District page and display all companionships.

---

# General Rules

- Do not remove existing functionality unless instructed.
- Do not introduce new libraries without justification.
- Prefer reusable components over duplicated code.
- Keep files organized and easy to understand.
- Follow the project's documentation.