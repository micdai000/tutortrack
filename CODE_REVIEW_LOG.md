Supabase URL vs REST endpoint — VITE_SUPABASE_URL must be the project root (https://xxx.supabase.co), not /rest/v1/.
Env vars require a Vite restart — .env.local changes are not picked up by HMR.
Distinguish UI 404s from API 404s — React Router * vs a failed Supabase network request in DevTools.

# Component Composition

## What is it?

Component composition is the practice of building larger interfaces by combining smaller, focused components.

Instead of creating one massive Dashboard component, we create smaller pieces that each have one responsibility.

## Why does it exist?

Large components become difficult to understand and modify.

Breaking the UI into smaller components makes each piece easier to:
- understand
- test
- update
- reuse

## Analogy

Think of building a house.

A house is not built as one giant piece of material.

It is built from:
- bedrooms
- kitchens
- bathrooms
- walls

Each part has a purpose, but together they create the whole house.

## How TutorTrack uses it

DashboardPage combines:

- WelcomeSection
- FollowUpsCard
- DistrictListCard

Each component focuses only on displaying its own information.

## Key Takeaway

A component should have a clear responsibility. Large pages should be built by combining smaller reusable pieces.

---

# Feature 003 - District Management

---

## Supabase Database Queries

### 1. What is this concept?

A database query is a request asking Supabase/PostgreSQL to read or write specific rows of data.

In the frontend, TutorTrack uses the Supabase JavaScript client (for example `.from("districts").select(...)`) to make those requests.

### 2. Why does this concept exist?

Applications need a reliable way to ask the database for exactly the information they need — no more, no less.

Queries turn vague goals like “show my districts” into precise instructions the database can execute.

### 3. How does it work?

1. The app calls a service function such as `getDistricts()`.
2. That function builds a Supabase query.
3. Supabase runs the query against PostgreSQL.
4. The result (or an error) is returned to the app.
5. React state updates and the UI re-renders.

### 4. Simple analogy

A query is like filling out a library request form:

“Please bring me every district book on the ‘districts’ shelf, sorted by title.”

The librarian (database) finds the matching books and hands them back.

### 5. How TutorTrack uses it

TutorTrack loads districts with a `select` query and creates districts with an `insert` query inside `districtService.ts`.

Pages never talk to Supabase directly; they call the service through the `useDistricts` hook.

### 6. Key takeaway

Keep database queries in a service layer so pages stay focused on UI and the same query logic can be reused in multiple places.

---

## CRUD Operations

### 1. What is this concept?

CRUD stands for the four basic data operations:

- **C**reate — add new data
- **R**ead — fetch existing data
- **U**pdate — change existing data
- **D**elete — remove data

### 2. Why does this concept exist?

Almost every app manages living data. CRUD is the shared vocabulary for those operations, which keeps features predictable and easier to design.

### 3. How does it work?

Each operation maps to a database action:

- Create → `insert`
- Read → `select`
- Update → `update`
- Delete → `delete`

The UI triggers the operation, the service performs it, and the UI reflects the new state.

### 4. Simple analogy

CRUD is like managing a notebook:

- Create: write a new page
- Read: open and read pages
- Update: edit a page
- Delete: tear a page out

### 5. How TutorTrack uses it

Milestone 3 implements the first half of district CRUD:

- **Create** a district from the Districts page form
- **Read** districts on both `/districts` and the Dashboard

Update and delete can be added later using the same service/hook pattern.

### 6. Key takeaway

When building a feature, identify which CRUD operations it needs first. You do not have to implement all four at once.

---

## Authentication-Based Data Ownership

### 1. What is this concept?

Data ownership means every row belongs to a specific user, and that ownership is tied to authentication identity.

In TutorTrack, each district stores a `user_id` that matches the signed-in tutor’s Auth user id.

### 2. Why does this concept exist?

Multi-user apps must keep personal data separated. Without ownership, one tutor could accidentally (or intentionally) see another tutor’s districts.

### 3. How does it work?

1. A tutor signs in through Supabase Auth.
2. Supabase knows their `auth.uid()`.
3. New districts are saved with that user’s id in `user_id`.
4. Later reads only return rows owned by that same user.

### 4. Simple analogy

Think of school lockers.

Each locker has an owner. Your key only opens your locker — even if every locker looks the same from the outside.

### 5. How TutorTrack uses it

When creating a district, TutorTrack inserts:

- `name` (what the tutor typed)
- `user_id` (the authenticated tutor’s id)

The Dashboard and Districts pages then load only that tutor’s districts.

### 6. Key takeaway

Always associate user-generated data with the authenticated user id. Ownership is the foundation of private multi-user apps.

---

## Row Level Security (RLS)

### 1. What is this concept?

Row Level Security is a PostgreSQL/Supabase feature that enforces access rules on each row of a table.

Even if the frontend makes a broad query like “select all districts,” RLS can still hide rows the current user is not allowed to see.

### 2. Why does this concept exist?

Frontend checks are not enough. Anyone can call your API with a modified request.

RLS protects data at the database boundary — the last and most trustworthy line of defense.

### 3. How does it work?

1. RLS is enabled on a table.
2. Policies define who can select/insert/update/delete which rows.
3. Every request runs with the caller’s auth identity.
4. PostgreSQL filters rows according to those policies automatically.

### 4. Simple analogy

RLS is like a museum security system.

You may enter the building (be authenticated), but sensors still decide which rooms your badge can open.

### 5. How TutorTrack uses it

The `districts` table policies allow tutors to:

- view only rows where `auth.uid() = user_id`
- create only rows where `auth.uid() = user_id`
- update/delete only their own rows

So even a query without an explicit `.eq("user_id", ...)` filter remains safe.

### 6. Key takeaway

Never rely on the UI alone for security. Enforce ownership in the database with RLS.

---

## Database Constraints

### 1. What is this concept?

A database constraint is a hard rule the database enforces on stored data.

Examples include `NOT NULL`, foreign keys, and unique indexes.

### 2. Why does this concept exist?

Application code can have bugs or be bypassed. Constraints guarantee important rules remain true no matter how data is written.

### 3. How does it work?

When an insert/update violates a constraint, PostgreSQL rejects the operation and returns an error (for uniqueness, error code `23505`).

The app can catch that error and show a friendly message.

### 4. Simple analogy

Constraints are like rules printed on a contest entry form:

“Only one entry per person.”

If someone tries to submit twice, the form is rejected — the rule is not just a polite request.

### 5. How TutorTrack uses it

District names must be unique per tutor, but different tutors may reuse the same name.

TutorTrack enforces this with a unique index on `(user_id, lower(name))` in `006_unique_district_names.sql`.

If a tutor tries to create “14-Q” twice, Supabase returns a unique violation and the UI says they already have that district.

### 6. Key takeaway

Put critical business rules in the database when correctness matters. The UI should explain errors; the database should prevent invalid data.

---

## Component / Data Separation

### 1. What is this concept?

Component/data separation means UI components render information, while data access lives elsewhere (services and hooks).

### 2. Why does this concept exist?

If pages contain both markup and database logic, they become hard to reuse and hard to change.

Separating concerns keeps each layer simpler.

### 3. How does it work?

TutorTrack uses three layers for districts:

1. **Service** (`districtService.ts`) — talks to Supabase
2. **Hook** (`useDistricts.ts`) — manages loading/error/state for React
3. **Components/Pages** — display data and gather user input

### 4. Simple analogy

A restaurant works better with roles:

- Kitchen prepares food (service)
- Waiter brings it to the table (hook)
- Customer enjoys the meal (UI)

If one person did everything at once, service would slow down and mistakes would increase.

### 5. How TutorTrack uses it

`DistrictsPage` does not contain Supabase calls.

It uses `useDistricts()`, which calls `getDistricts()` / `createDistrict()`.

The same hook powers the Dashboard district card, so both screens stay in sync with one data pattern.

### 6. Key takeaway

UI should ask for data; it should not know the details of how that data is fetched or saved.

---

# Debugging Lesson - District Creation Failure

---

## Surfacing Underlying API Errors

### 1. What is this concept?

Surfacing underlying errors means showing (or logging) the real message from Supabase/PostgreSQL instead of replacing it with a generic fallback like “Unable to create district.”

### 2. Why does this concept exist?

Generic messages hide the true cause. Without the real error, you cannot tell whether the failure is RLS, a unique constraint, a missing column, or something else.

### 3. How does it work?

1. Call Supabase and receive `{ data, error }`.
2. If `error` exists, read `error.message` / `error.code`.
3. Convert that into a real `Error` (or extract `.message` safely).
4. Show that message in the UI while developing, or map known codes to friendly text.

### 4. Simple analogy

If your car won’t start, “Car broken” is not enough.

You need the dashboard code — “No fuel,” “Battery dead,” or “Oil pressure low” — to fix the right problem.

### 5. How TutorTrack uses it

District creation originally did `throw error` with a plain Supabase object, then the form checked `err instanceof Error`.

Because Supabase’s `{ error }` value is often a plain object, that check failed and the UI always showed “Unable to create district.”

TutorTrack now uses `getErrorMessage()` and converts query failures into real `Error` instances in `districtService.ts`.

### 6. Key takeaway

Never assume a thrown value is an `Error`. Read the provider’s actual error payload before showing a fallback.

---

## Supabase `{ data, error }` Error Shape

### 1. What is this concept?

The Supabase client usually does not throw on failed queries. It returns:

```ts
const { data, error } = await supabase.from("districts").insert(...)
```

Here, `error` is often a plain object with `message`, `code`, `details`, and `hint` — not always an `instanceof Error`.

### 2. Why does this concept exist?

Returning errors instead of throwing lets you handle failures locally without try/catch at every step. But if you rethrow that object, JavaScript `catch` blocks may not treat it like an `Error`.

### 3. How does it work?

- Success → `data` filled, `error` is `null`
- Failure → `data` is `null`, `error` contains the API/database message
- Your app must check `error` and decide what to throw/display

### 4. Simple analogy

Supabase hands you a folder:

- one pocket for the result (`data`)
- one pocket for the problem note (`error`)

If you ignore the problem note, you only see “it didn’t work.”

### 5. How TutorTrack uses it

`createDistrict()` inspects `error.code`:

- `23505` → friendly duplicate-name message
- other codes → throw `new Error(error.message)` so the UI can display the real cause

### 6. Key takeaway

When using Supabase, always check `error`, and normalize it before it reaches React components.

---

## RLS Insert Checks and `auth.uid()`

### 1. What is this concept?

For inserts, Supabase RLS uses a `WITH CHECK` policy. TutorTrack’s policy requires:

```sql
auth.uid() = user_id
```

`auth.uid()` comes from the signed-in user’s JWT. `user_id` comes from the row being inserted.

### 2. Why does this concept exist?

It prevents one tutor from creating districts that belong to another tutor, even if they manually craft an API request.

### 3. How does it work?

1. Browser sends the insert with the user’s access token.
2. Postgres reads `auth.uid()` from that token.
3. Postgres compares it to the inserted `user_id`.
4. If they differ (or the user is anonymous), the insert is rejected with code `42501`.

### 4. Simple analogy

You can only put mail into your own mailbox.

If your ID badge says “Tutor A” but you try to put a letter into Tutor B’s box, security blocks it.

### 5. How TutorTrack uses it

`createDistrict()` now calls `supabase.auth.getUser()` and inserts that verified user’s id as `user_id`.

That keeps the inserted owner aligned with `auth.uid()` in the RLS policy.

### 6. Key takeaway

For ownership columns, set `user_id` from the authenticated user (preferablyally a verified `getUser()` result), not from untrusted input.
