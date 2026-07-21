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

For ownership columns, set `user_id` from the authenticated user (preferably a verified `getUser()` result), not from untrusted input.

---

# Feature 004A - District Detail & Companionship Management

---

## Parent-Child Database Relationships

### 1. What is it?

A parent-child relationship connects two tables so that child rows belong to exactly one parent row.

In TutorTrack:

- A district (parent) has many companionships (children)
- A companionship (parent) has many missionaries (children)

### 2. Why does it exist?

Real-world data is nested. Missionaries belong to companionships, and companionships belong to districts. Relationships keep that structure accurate without copying the same district name into every missionary row.

### 3. How does it work?

The child table stores a foreign key that points to the parent:

- `companionships.district_id` → `districts.id`
- `missionaries.companionship_id` → `companionships.id`

If the parent is deleted, related children can be removed automatically (`ON DELETE CASCADE`).

### 4. Simple analogy

A school has classrooms.

Each classroom has students.

You do not write the school address on every student’s notebook. You assign each student to a classroom, and each classroom already belongs to the school.

### 5. How TutorTrack uses it

When you open `/districts/:districtId`, TutorTrack loads companionships for that district, then shows the missionaries inside each companionship.

Ownership flows through the chain: tutor → district → companionship → missionary.

### 6. Key takeaway

Store relationships with foreign keys, not by duplicating parent data into every child row.

---

## Creating Related Records

### 1. What is it?

Creating related records means inserting a parent row and its child rows as one logical action.

Example: create one companionship, then create 2–3 missionaries that point to it.

### 2. Why does it exist?

Users think in complete units (“add this companionship”), not in isolated database rows. The app should create the whole unit correctly.

### 3. How does it work?

1. Insert the parent companionship and get its new `id`.
2. Insert missionary rows using that `companionship_id`.
3. If missionary inserts fail, remove the orphaned companionship.

### 4. Simple analogy

Ordering a meal combo:

First the kitchen opens an order ticket (parent).

Then it adds burger, fries, and drink lines (children) under that ticket number.

If the drink cannot be added, the kitchen should not leave a half-finished ticket sitting around.

### 5. How TutorTrack uses it

`createCompanionshipWithMissionaries()` creates the companionship first, then inserts missionary `display_name` values linked to that companionship.

The District Detail page only calls the hook; the service owns the multi-step write.

### 6. Key takeaway

When users create a “group,” the app must create parent and children together and keep them consistent.

---

## Route Parameters

### 1. What is it?

A route parameter is a dynamic part of a URL, such as `:districtId` in `/districts/:districtId`.

### 2. Why does it exist?

One page template can show many different records. Instead of building `/district-a`, `/district-b`, and `/district-c` separately, one route reads the id from the URL.

### 3. How does it work?

1. Router defines `/districts/:districtId`.
2. User visits `/districts/abc-123`.
3. `useParams()` reads `{ districtId: "abc-123" }`.
4. The page fetches that district’s data.

### 4. Simple analogy

A library call number tells you which exact book to pull.

The shelves (page) stay the same; the call number (route param) changes which book you get.

### 5. How TutorTrack uses it

`DistrictDetailPage` reads `districtId` from the URL and passes it to `useDistrictDetail(districtId)`.

Dashboard and Districts links navigate to `/districts/${district.id}`.

### 6. Key takeaway

Use route params to open a specific record without inventing a new page for every item.

---

## Nested Navigation

### 1. What is it?

Nested navigation is moving from a broad list into a more specific detail view, then back again.

Example: Districts list → District detail → (later) Missionary profile.

### 2. Why does it exist?

Tutors manage information hierarchically. Navigation should mirror that hierarchy so the product feels natural.

### 3. How does it work?

- List pages link to detail pages.
- Detail pages include a clear Back action.
- Each level shows only the information relevant at that level.

### 4. Simple analogy

A map app:

Country → State → City.

You zoom in for detail, then zoom out when you are done.

### 5. How TutorTrack uses it

Tutors click a district from Dashboard or Districts, land on District Detail, review companionships, and use “Back to Districts” to return.

### 6. Key takeaway

Match navigation to the data hierarchy so users always know where they are and how to go back.

---

## Managing Relational Data in the UI

### 1. What is it?

Relational UI means the screen displays connected records together — for example a companionship card that lists its missionaries.

### 2. Why does it exist?

Users need the relationship, not just isolated rows. A companionship without names is not useful for tutoring prep.

### 3. How does it work?

The service fetches companionships with nested missionaries in one query shape, the hook stores that structure, and presentational components render it.

### 4. Simple analogy

A family photo labeled with each person’s name is more useful than a pile of unlabeled portraits and a separate family list.

### 5. How TutorTrack uses it

`CompanionshipCard` receives a companionship plus its missionaries and renders:

- Companionship heading
- Each missionary display name

The page does not assemble SQL-like joins itself.

### 6. Key takeaway

Fetch related data in a shape that matches how the UI needs to present it, then keep rendering components simple.

---

# Feature 004B - Companionship Workspace

---

## Parent-Child Page Hierarchy

### 1. What is the concept?

A parent-child page hierarchy is a set of screens that follow the same structure as the data.

In TutorTrack:

District → Companionship → Missionary

Each page focuses on one level of that hierarchy.

### 2. Why does it exist?

Tutors think in layers. They pick a district first, then a companionship, then a missionary. Pages should match that mental model so navigation feels natural.

### 3. How does it work?

- A parent page lists children.
- Clicking a child opens a more specific page.
- The child page includes a Back link to its parent.

### 4. Simple analogy

A filing cabinet:

Drawer (district) → Folder (companionship) → Document (missionary).

You open one level at a time instead of dumping every paper on the desk.

### 5. How TutorTrack uses it

- `/districts/:districtId` lists companionships
- `/companionships/:companionshipId` lists missionaries
- `/missionaries/:missionaryId` will hold the full language plan later

### 6. Key takeaway

Design pages around the hierarchy of your data, not as one giant screen that shows everything.

---

## Keeping Pages Focused on One Responsibility

### 1. What is the concept?

Each page should have one clear job.

The Companionship Workspace’s job is: help the tutor choose which missionary to work with.

It is not responsible for editing goals or study plans.

### 2. Why does it exist?

When a page tries to do too many jobs, it becomes crowded and hard to change. Focused pages are easier to understand and safer to extend.

### 3. How does it work?

Ask: “What decision or action should the user complete here?”

Then include only the information needed for that decision.

### 4. Simple analogy

A restaurant host stand seats guests.

It does not cook food or take payment.

Those are separate stations with separate responsibilities.

### 5. How TutorTrack uses it

The Companionship Workspace shows:

- district context
- companionship heading
- missionary cards

It intentionally hides goals, notes, and follow-up dates. Those belong on the Missionary Profile page.

### 6. Key takeaway

If information is not needed for the page’s main decision, leave it off that page.

---

## Preparing Navigation for Future Features

### 1. What is the concept?

Preparing navigation means creating the route and click path now, even if the destination page is still a placeholder.

### 2. Why does it exist?

It lets you finish one milestone cleanly without blocking on later milestones. The user flow is already wired when the next feature is ready.

### 3. How does it work?

1. Define the future route (`/missionaries/:missionaryId`).
2. Link missionary cards to that route now.
3. Ship a simple placeholder page.
4. Later, replace the placeholder with the real profile page — without changing the links.

### 4. Simple analogy

Building a hallway to a room before the furniture arrives.

The path exists; the room can be finished later.

### 5. How TutorTrack uses it

Missionary cards already navigate to `/missionaries/:missionaryId`.

Right now that route shows a temporary placeholder. When Missionary Profiles are built, the same links will open the real page.

### 6. Key takeaway

Wire the path early. Finish the destination when that milestone begins.

---

# Feature 005 - Missionary Profile & Auto-Save

---

## Debouncing

### 1. What is the concept?

Debouncing means waiting until the user pauses before running an action.

Instead of saving on every keystroke, TutorTrack waits about one second after typing stops.

### 2. Why does it exist?

Saving on every letter would send too many requests, create flicker, and interrupt the tutor’s flow.

Debouncing keeps the UI responsive while reducing unnecessary work.

### 3. How does it work?

1. User types in a field.
2. A timer starts (about 1 second).
3. If the user types again, the timer resets.
4. When the timer finishes, the save runs once.

### 4. Simple analogy

An elevator door.

It does not close the instant someone steps in.

It waits a moment. If another person arrives, it waits again. It closes only after people stop arriving.

### 5. How TutorTrack uses it

`useMissionaryProfile` marks the status as “Typing...”, waits one second of quiet, then saves to Supabase.

### 6. Key takeaway

Debounce frequent events so the system reacts to pauses, not every tiny change.

---

## Auto-Save

### 1. What is the concept?

Auto-save writes changes in the background without asking the user to click Save.

### 2. Why does it exist?

During tutoring, tutors should stay focused on the missionary, not on form buttons.

If the conversation moves quickly, a Save button is easy to forget.

### 3. How does it work?

- Local form state updates immediately as the tutor types.
- After a short pause, the hook sends an update to the database.
- A status message confirms progress: Typing → Saving → Saved (or Error).

### 4. Simple analogy

A notes app on a phone.

You write. It saves. You never hunt for a Save button.

### 5. How TutorTrack uses it

The Missionary Profile has no Save button.

`updateMissionaryProfile()` persists the current draft and updates `last_updated_at` after a successful write.

### 6. Key takeaway

For high-frequency editing workflows, auto-save reduces friction and prevents lost work.

---

## Controlled React Components

### 1. What is the concept?

A controlled component gets its value from React state and reports every change back to React through an event handler.

### 2. Why does it exist?

When React owns the value, the UI and application state stay synchronized. That makes auto-save, validation, and status updates much easier.

### 3. How does it work?

```tsx
<input
  value={draft.display_name}
  onChange={(event) => onChange("display_name", event.target.value)}
/>
```

React state is the source of truth. The input displays that state.

### 4. Simple analogy

A thermostat.

The display always shows the system’s current setting.

When you turn the dial, you tell the system the new value, and the display updates from the system — not from the dial alone.

### 5. How TutorTrack uses it

`MissionaryProfileForm` is fully controlled by the draft in `useMissionaryProfile`.

Every field change flows through `updateField`, which keeps auto-save in sync.

### 6. Key takeaway

For editable forms that need auto-save or validation, keep field values in React state.

---

## Updating Database Records

### 1. What is the concept?

An update changes an existing row instead of creating a new one.

TutorTrack updates the current missionary profile values only — no history table.

### 2. Why does it exist?

Version 1 needs the latest study plan, not a full timeline of every edit.

Keeping one current row is simpler and faster.

### 3. How does it work?

1. Identify the row (`id`).
2. Send the new field values.
3. Set `last_updated_at` to now.
4. Return the updated row to the UI.

### 4. Simple analogy

Editing a whiteboard.

You erase and rewrite the current plan.

You do not keep a stack of every previous whiteboard photo.

### 5. How TutorTrack uses it

`missionaryService.updateMissionaryProfile()` runs a Supabase `.update()` on `missionaries` and selects the refreshed profile.

### 6. Key takeaway

If you only need current state, update in place. Add history later only when the product requires it.

---

## Custom Hooks & Separation of Concerns

### 1. What is the concept?

A custom hook packages stateful logic (loading, draft, debounce, save status) so the page can stay focused on layout.

Separation of concerns means UI, state orchestration, and database access live in different layers.

### 2. Why does it exist?

If the page owned debounce timers, save races, and Supabase calls, it would become hard to read and hard to reuse.

### 3. How does it work?

- Service: talks to Supabase
- Hook: manages draft + auto-save behavior
- Components: render fields and status
- Page: composes the workspace

### 4. Simple analogy

A restaurant:

Kitchen (service), waiter (hook), table setting (components), dining room layout (page).

Each role stays clearer when not mixed together.

### 5. How TutorTrack uses it

`MissionaryProfilePage` does not call Supabase.

It uses `useMissionaryProfile`, which calls `missionaryService`.

`follow_up_date` and `last_updated_at` remain available on `MissionaryProfile` for a future Dashboard without rewriting this page.

### 6. Key takeaway

Put reusable behavior in hooks and services so pages stay calm and readable.

---

# Feature 006 - Companionship Teacher View

---

## Read-Only Presentation Layers

### 1. What is it?

A read-only presentation layer shows information without allowing edits.

It is a viewing surface, not a workspace for changing data.

### 2. Why does it exist?

Different people need different modes.

Tutors edit. Teachers review.

If teachers see input fields and save controls, the page becomes slower to scan and riskier to use.

### 3. How does it work?

The page loads the same underlying records, but renders them as plain text inside a document layout.

No controlled inputs. No debounce. No update calls.

### 4. Simple analogy

A printed class syllabus.

Students can read it. They cannot rewrite the syllabus by tapping the paper.

### 5. How TutorTrack uses it

`/teacher/companionship/:companionshipId` shows goals and study plans only.

Tutor Notes, Follow-up Date, and editing controls stay on the Missionary Profile.

### 6. Key takeaway

When the audience only needs to understand information, remove every control that is not required for reading.

---

## Separating Editable and Read-Only Interfaces

### 1. What is it?

The same data can power two interfaces:

- an editable interface for people who update records
- a read-only interface for people who consume those records

### 2. Why does it exist?

One page that tries to be both a tutoring workspace and a teacher handout becomes cluttered and confusing.

Separate interfaces keep each job clear.

### 3. How does it work?

- Missionary Profile: draft state + auto-save
- Teacher View: mapped display data + static cards

Both can call the same service methods for loading.

### 4. Simple analogy

A chef uses a working recipe card with scribbles and timers.

Guests receive a clean menu with finished descriptions.

Same meal. Different documents.

### 5. How TutorTrack uses it

Companionship Workspace links to Teacher View.

The workspace stays action-oriented (“choose a missionary”).

The Teacher View stays briefing-oriented (“scan goals before class”).

### 6. Key takeaway

Do not force every audience through the same UI. Split edit and review experiences.

---

## Reusing Business Logic

### 1. What is it?

Business logic is the shared rules for loading and shaping data.

Reuse means multiple pages call the same service instead of copying queries.

### 2. Why does it exist?

Duplicated queries drift apart. One page gets a bug fix; the other stays broken.

Shared services keep behavior consistent.

### 3. How does it work?

1. Service fetches companionship + missionaries + district.
2. Hook adapts that data for a specific page.
3. Components render the adapted shape.

### 4. Simple analogy

One kitchen prepares food.

The dining room and the takeout counter both serve from that kitchen.

They do not each run a separate stove with different recipes.

### 5. How TutorTrack uses it

`useCompanionshipTeacherView` reuses `getCompanionshipById`.

`toCompanionshipTeacherView()` maps workspace data into `TeacherViewData` without a second database design.

### 6. Key takeaway

Share loading logic. Specialize only the presentation.

---

## Designing for Future Scalability

### 1. What is it?

Building today’s feature with seams that make tomorrow’s feature easier — without overbuilding.

### 2. Why does it exist?

TutorTrack will later need `/teacher/district/:districtId`.

If the companionship Teacher View is hardcoded as a one-off page, district support becomes a rewrite.

### 3. How does it work?

Extract shared pieces now:

- `TeacherViewContext`
- `TeacherViewDocument`
- `TeacherMissionaryCard`

A future district page can supply the same context shape with `scopeLabel: "District"` and a longer missionary list.

### 4. Simple analogy

Building a lamp with a standard bulb socket.

Today you use one bulb. Tomorrow you can change brightness without rebuilding the lamp.

### 5. How TutorTrack uses it

Companionship Teacher View already uses reusable Teacher View components and a shared `TeacherViewData` type.

District Teacher View can compose the same document shell.

### 6. Key takeaway

Create small reusable seams for known next steps — not speculative frameworks for imaginary futures.

---

# Feature 007 - UX Friction Review (Pre-1.0 Polish)

---

## Cognitive Load

### 1. What is it?

Cognitive load is the amount of mental effort a user needs to understand and use a screen.

### 2. Why does it exist?

People tutoring missionaries already hold a conversation in their head. Software should not add extra puzzles.

### 3. How does it work?

Clear labels, honest empty states, and consistent wording reduce the number of questions a user must answer while using the app.

### 4. Simple analogy

A well-labeled kitchen drawer.

If forks are always in the same place, you do not stop cooking to hunt for them.

### 5. How TutorTrack uses it

Companionship cards now show missionary names instead of a generic emoji title.

The Missionary Profile shows whose plan you are editing at the top.

### 6. Key takeaway

Every screen should answer “Where am I?” and “What can I do next?” without making the user guess.

---

## Consistency

### 1. What is it?

Consistency means similar actions use similar words, patterns, and visual cues across the product.

### 2. Why does it exist?

When every page invents its own language, users relearn the product on each screen.

### 3. How does it work?

Reuse the same action patterns:

- Back links name the destination
- List rows offer an “Open →” cue
- Primary actions use calm, parallel wording (“Add district”, “Add companionship”)

### 4. Simple analogy

Traffic lights.

Red always means stop. If every city used different colors, driving would be exhausting.

### 5. How TutorTrack uses it

District rows, companionship cards, and missionary cards all signal that they are clickable in a similar way.

Teacher View back links say where you will return.

### 6. Key takeaway

Same job, same language. Consistency turns a set of pages into one product.

---

## Trustworthy Empty States

### 1. What is it?

An empty state explains what is missing and what to do next when there is no data yet.

### 2. Why does it exist?

A blank area feels like a bug. A clear empty state feels like guidance.

### 3. How does it work?

Say what is empty, then point to the next action in plain language.

Avoid fake sample data that looks real.

### 4. Simple analogy

An empty fridge with a note:

“No groceries yet. Add milk and eggs.”

That is more helpful than a sticker of fake milk.

### 5. How TutorTrack uses it

Dashboard follow-ups no longer show invented missionary names.

Empty districts and companionships tell tutors exactly how to start.

### 6. Key takeaway

Never fake real work data. Empty should mean empty — and still be helpful.

---

## Progressive Disclosure of Effort

### 1. What is it?

Show people only what they need for the current decision, with clear next steps for deeper work.

### 2. Why does it exist?

If every page exposes every control, users slow down and feel overwhelmed.

### 3. How does it work?

Each layer has one job:

- District list → choose a district
- Companionship list → choose a companionship
- Missionary cards → open a language plan
- Teacher View → read, do not edit

### 4. Simple analogy

A coat closet.

You open the door for jackets. You do not dump shoes, tools, and laundry into the same doorway.

### 5. How TutorTrack uses it

Button labels now match the user’s intent at that layer (“Share Teacher View”, “Open language plan”).

### 6. Key takeaway

Reduce clicks by clarifying the next click — not by stuffing more actions onto every screen.

---

## Accessibility Affordances

### 1. What is it?

Accessibility affordances are small cues that help more people use the interface successfully — keyboard focus, status announcements, and clear alerts.

### 2. Why does it exist?

Not everyone uses a mouse. Not everyone notices a quiet color change.

### 3. How does it work?

- Visible focus outlines for keyboard navigation
- `role="status"` for loading and save updates
- `role="alert"` for errors that need attention

### 4. Simple analogy

Subtitles on a video.

They do not change the story. They make the story reachable for more people.

### 5. How TutorTrack uses it

Login, loading states, save status, and errors now announce themselves more clearly to assistive tech and keyboard users.

### 6. Key takeaway

Polish is not only visual. If users can find, focus, and understand feedback, the product feels calmer and more reliable.

---

# Feature 008 - Safe District Deletion

---

## Safe Destructive Actions

### 1. What is it?

A destructive action permanently removes data (or makes recovery difficult).

Safe destructive actions add friction on purpose before the delete happens.

### 2. Why does it exist?

Delete buttons are easy to click by accident.

Recovering a deleted district — and every missionary plan inside it — may be impossible in Version 1.

### 3. How does it work?

1. User chooses Delete.
2. App pauses and explains consequences.
3. User must confirm again.
4. Only then does the delete run.

### 4. Simple analogy

A paper shredder with a safety flap.

You cannot feed documents through until you intentionally open the guard.

### 5. How TutorTrack uses it

Districts are never deleted from a single click on the list.

Tutors open a menu, choose Delete district, then confirm in a dialog.

### 6. Key takeaway

Make irreversible actions harder than reversible ones.

---

## Confirmation Dialogs

### 1. What is it?

A confirmation dialog is a focused prompt that asks the user to verify an important choice.

### 2. Why does it exist?

It gives people a moment to notice mistakes before damage is done.

### 3. How does it work?

The dialog states:

- what will be deleted
- what else will be affected
- that the action cannot be undone

Then it offers Cancel or a clearly labeled confirm action.

### 4. Simple analogy

“Are you sure you want to send this email?”

That second check prevents messages sent to the wrong person.

### 5. How TutorTrack uses it

`ConfirmDeleteDistrictDialog` explains that companionships and missionaries in the district will also be removed.

### 6. Key takeaway

A good confirmation explains consequences — it does not only ask “Are you sure?”

---

## Cascading Deletes & Referential Integrity

### 1. What is it?

Referential integrity keeps relationships valid.

A cascading delete removes child rows automatically when a parent row is deleted.

### 2. Why does it exist?

Without cascades (or careful manual cleanup), deleting a district could leave companionships and missionaries pointing at a missing parent — orphaned records.

### 3. How does it work?

TutorTrack’s schema already defines:

- companionships → districts (`ON DELETE CASCADE`)
- missionaries → companionships (`ON DELETE CASCADE`)

Deleting one district removes its companionships, which removes their missionaries.

### 4. Simple analogy

Removing a binder from a shelf.

If every page inside belongs only to that binder, the pages leave with it.

### 5. How TutorTrack uses it

`deleteDistrict()` deletes the district row.

PostgreSQL cascade rules clean up related companionships and missionaries, so the app does not leave broken relationships behind.

### 6. Key takeaway

Trust well-designed database relationships for cleanup. Do not invent ad-hoc orphan cleanup when cascades already express the rule.

---

## Designing Trustworthy Experiences

### 1. What is it?

A trustworthy experience makes serious actions feel controlled, clear, and recoverable when possible.

### 2. Why does it exist?

Users hesitate when software feels unpredictable — especially around data they care about.

### 3. How does it work?

- Keep delete behind a quiet menu (less clutter, less accidental clicks)
- Explain blast radius before confirming
- Show success after completion
- Show a clear error if deletion fails

### 4. Simple analogy

A bank transfer review screen.

You see the amount and destination before money moves.

### 5. How TutorTrack uses it

After a successful delete, the district list updates immediately and a success message confirms what happened.

### 6. Key takeaway

Trust grows when the product is honest about risk and clear about outcomes.

---

# Feature 009 - Companionship Missionary Management

---

## Business Rules

### 1. What is it?

A business rule is a product constraint that reflects how the real world works.

Example: a companionship must contain at least two missionaries.

### 2. Why does it exist?

Software should model real tutoring workflows, not just store rows freely.

Without rules, tutors could create invalid companionships that do not match MTC reality.

### 3. How does it work?

Before a remove is allowed, TutorTrack checks the current missionary count.

If removal would leave fewer than two missionaries, the action is blocked with a clear explanation.

### 4. Simple analogy

A tandem bicycle needs two riders.

You can swap riders, but you cannot remove one and still call it a tandem ride.

### 5. How TutorTrack uses it

`removeMissionaryFromCompanionship()` enforces the minimum of two missionaries in the service layer.

The UI also disables Remove on duos so tutors see the rule before they try.

### 6. Key takeaway

Encode important real-world constraints in code — and explain them in human language.

---

## Data Validation

### 1. What is it?

Validation checks that data is acceptable before it is saved or deleted.

### 2. Why does it exist?

Invalid data creates confusing screens and broken workflows later.

### 3. How does it work?

Validation can happen in:

- the UI (fast feedback)
- the service (trusted enforcement)
- the database (final safety net)

TutorTrack validates names are non-empty and membership counts before delete.

### 4. Simple analogy

A shipping form that refuses an address with no street name.

It stops the package from leaving with incomplete information.

### 5. How TutorTrack uses it

Adding a missionary requires a name.

Removing a missionary requires the companionship to still have at least two members afterward.

### 6. Key takeaway

Validate early for usability, and validate again in services for safety.

---

## Designing Around Real-World Workflows

### 1. What is it?

Designing around real-world workflows means matching the product to how tutors actually manage companionships.

### 2. Why does it exist?

If the app ignores real assignment rules, tutors stop trusting it.

### 3. How does it work?

- Add missionary when someone joins
- Remove missionary when someone transfers out
- Keep a minimum of two members
- Guide tutors to delete the whole companionship when the unit no longer exists

### 4. Simple analogy

A classroom attendance sheet.

You can add or remove students, but a “pair project” group still needs two names.

### 5. How TutorTrack uses it

The companionship workspace now supports membership changes without forcing tutors to recreate the whole companionship.

### 6. Key takeaway

Good features follow the work people already do — they do not invent awkward extra steps.

---

# Feature 010 - Safe Companionship Deletion

---

## Safe Destructive Actions (Applied Again)

### 1. What is it?

Deleting a companionship removes an entire tutoring unit and every missionary plan inside it.

That makes it a high-impact destructive action.

### 2. Why does it exist?

Companionships change often at the MTC. Tutors need a way to remove outdated units without risking accidental data loss.

### 3. How does it work?

TutorTrack keeps Delete companionship secondary, asks for confirmation, then deletes only after explicit approval.

### 4. Simple analogy

Throwing away a whole folder, not one sticky note.

You double-check the folder label before it goes in the shredder.

### 5. How TutorTrack uses it

The delete control sits below the missionary list as a quiet secondary action.

The confirmation explains that all missionaries and language plans will be removed too.

### 6. Key takeaway

Place irreversible actions away from primary workflows, then require a clear second confirmation.

---

## Cascading Deletes Across Nested Relationships

### 1. What is it?

When a parent companionship is deleted, child missionaries can be removed automatically by the database.

### 2. Why does it exist?

Missionaries belong to companionships. Keeping orphaned missionary rows would break the data model and confuse future queries.

### 3. How does it work?

`missionaries.companionship_id` references `companionships(id)` with `ON DELETE CASCADE`.

Deleting one companionship deletes its missionaries in the same database operation.

### 4. Simple analogy

Removing a team roster page.

Every player listed only on that page leaves with it.

### 5. How TutorTrack uses it

`deleteCompanionship()` deletes the companionship row.

PostgreSQL cascade rules clean up related missionaries, so the service stays simple and consistent.

### 6. Key takeaway

Let referential integrity express ownership. Cascade when children cannot exist without the parent.

---

## Referential Integrity

### 1. What is it?

Referential integrity means foreign keys keep related tables consistent.

A missionary row can only point at a companionship that actually exists.

### 2. Why does it exist?

Without it, the app can show records that point nowhere — broken links, empty screens, and confusing bugs.

### 3. How does it work?

PostgreSQL rejects invalid relationships and can cascade deletes when ownership is clear.

TutorTrack relies on that guarantee instead of manually deleting missionaries in application code.

### 4. Simple analogy

A library catalog that refuses a book card with a shelf number that does not exist.

### 5. How TutorTrack uses it

Deleting a companionship is one service call.

Integrity rules make sure missionary plans disappear with it, so the district detail list stays accurate.

### 6. Key takeaway

Trust the database for relationship rules. Application code should not reinvent cleanup that foreign keys already define.

---

## Confirmation Dialogs for Nested Deletes

### 1. What is it?

A confirmation dialog pauses a destructive action and states the consequences before commit.

### 2. Why does it exist?

Nested deletes are easy to underestimate. Tutors may think they are removing a label when they are also removing missionary plans.

### 3. How does it work?

`ConfirmDeleteCompanionshipDialog` explains:

- the companionship is permanently deleted
- all missionaries are deleted with it
- the action cannot be undone

Cancel stays available until the request finishes.

### 4. Simple analogy

A “empty recycle bin” prompt that lists how many files will disappear.

### 5. How TutorTrack uses it

The dialog names the missionaries in the companionship so tutors can verify the right unit before confirming.

### 6. Key takeaway

Confirmation copy should describe blast radius, not just repeat the button label.

---

## Trustworthy UX After Destructive Actions

### 1. What is it?

Trustworthy UX means the product behaves predictably after something irreversible happens.

### 2. Why does it exist?

After a delete, tutors need to know where they are, what changed, and that the system did what they asked.

### 3. How does it work?

On success, TutorTrack:

- navigates back to the district detail page
- reloads the companionship list on that page
- shows a friendly success message via navigation state

On failure, the dialog stays open with a helpful error so tutors can retry or cancel.

### 4. Simple analogy

After shredding a document, you are returned to the filing cabinet with a note that says the folder is gone.

### 5. How TutorTrack uses it

`deleteCurrentCompanionship()` returns the district id for navigation.

District detail reads `location.state.successMessage`, shows it once, then clears the state so refresh does not replay the toast forever.

### 6. Key takeaway

Destructive flows earn trust when success is visible, failure is recoverable, and the UI never leaves tutors stranded on a deleted page.

---

# Feature 011 - District Teacher View

---

## Component Composition

### 1. What is it?

Component composition means building a larger screen by combining smaller, focused components.

### 2. Why does it exist?

A district briefing has several jobs: document chrome, header, companionship sections, and missionary cards.

If one giant component does everything, changes become risky and hard to reuse.

### 3. How does it work?

`TeacherViewDocument` assembles:

- header
- optional companionship sections
- missionary cards
- optional future toolbar actions

Each piece stays independently understandable.

### 4. Simple analogy

A briefing binder made of tabbed sections.

You can add a new tab without reprinting the whole binder cover.

### 5. How TutorTrack uses it

District Teacher View reuses `TeacherViewHeader` and `TeacherMissionaryCard`, then adds `TeacherCompanionshipSection` for grouping.

Companionship Teacher View still uses the same document shell.

### 6. Key takeaway

Compose screens from small presentation parts instead of copying whole page layouts.

---

## Reusing Presentation Layers

### 1. What is it?

A presentation layer is the read-only UI that displays mapped data.

Reusing it means multiple routes share the same document components.

### 2. Why does it exist?

Teachers need the same fields whether they open one companionship or a whole district.

Duplicating card markup would let the two views drift apart.

### 3. How does it work?

Both routes map domain data into `TeacherViewData`.

Both render through `TeacherViewDocument`.

Only the data shape differs: flat missionaries vs companionship sections.

### 4. Simple analogy

One printable form template.

Sometimes you print one student’s sheet. Sometimes you print a class set with section dividers. Same form fields either way.

### 5. How TutorTrack uses it

`toCompanionshipTeacherView()` and `toDistrictTeacherView()` both produce `TeacherViewData`.

`TeacherMissionaryCard` still shows only Name, Long-Term Goal, Short-Term Goal, and Current Language Study Plan.

### 6. Key takeaway

Share the presentation contract. Specialize only the data mapping for each scope.

---

## Scaling UI Without Duplication

### 1. What is it?

Scaling UI without duplication means supporting a larger scope (district) by extending seams, not cloning pages.

### 2. Why does it exist?

District view could have been a copy of companionship Teacher View with loops pasted in.

That would double every future design fix.

### 3. How does it work?

1. Keep shared types and cards.
2. Add an optional `companionships` array for grouped rendering.
3. Add a dedicated loader for district study-plan fields.
4. Keep the list query lean (names only) separate from teacher-view query (goals + plans).

### 4. Simple analogy

A lamp with a standard socket.

Adding a brighter bulb does not require building a second lamp.

### 5. How TutorTrack uses it

`getDistrictTeacherViewSource()` loads goals only for Teacher View.

`TeacherViewDocument` accepts an optional `toolbar` slot for future Copy Link / Print / PDF actions.

### 6. Key takeaway

Extend shared seams for the next known scope. Do not fork the whole feature.

---

## Information Hierarchy

### 1. What is it?

Information hierarchy is the order and emphasis that help readers scan a document.

### 2. Why does it exist?

A classroom teacher has limited prep time. The page must answer “what should each missionary practice?” quickly.

### 3. How does it work?

District Teacher View hierarchy:

1. Document title: Language Study Plans
2. District name
3. Companionship section
4. Missionary names summary
5. Missionary cards with goals and plan

Internal tutor fields stay hidden.

### 4. Simple analogy

A concert program.

Venue and title first, then each ensemble, then each piece — not a dump of backstage notes.

### 5. How TutorTrack uses it

Each companionship section shows member names before the detailed cards so teachers can orient at a glance.

Whitespace and section borders separate units without dashboard chrome.

### 6. Key takeaway

Put orientation first, details second, and hide anything the audience does not need.

---

## Designing Professional Document Layouts

### 1. What is it?

A professional document layout feels like a briefing handout, not an admin dashboard.

### 2. Why does it exist?

Teachers print or share these pages. Dense widgets and bright colors fight readability.

### 3. How does it work?

Use calm typography, clear headings, generous spacing, mobile padding, and print rules that hide tutor chrome.

Avoid cards-as-widgets, heavy color blocks, and editing controls.

### 4. Simple analogy

A clean syllabus PDF versus a colorful analytics board.

One is meant to brief people. The other is meant to manage systems.

### 5. How TutorTrack uses it

`/teacher/district/:districtId` is read-only.

No save buttons. No auto-save. No tutor notes or follow-up dates.

Print CSS keeps missionary cards from splitting awkwardly across pages.

### 6. Key takeaway

When the job is briefing, design a document — not another control panel.

---

# Feature 012 - Secure Public Teacher Share Links

---

## Persistent Share Links

### 1. What is it?

A persistent share link is a stable public URL that keeps working until someone revokes it.

Copying the link again does not mint a new token.

### 2. Why does it exist?

Tutors paste one link into Google Chat and expect teachers to reopen that same URL later.

If every “Copy Share Link” created a new token, old chat messages would break and tutors would lose track of which link is current.

### 3. How does it work?

1. Tutor clicks Copy Share Link.
2. The app looks for an active `teacher_shares` row for that resource.
3. If one exists, it reuses that token.
4. If none exists (or the old one was revoked), it creates a new token.
5. The public page always loads the latest Teacher View data for that resource.

### 4. Simple analogy

A classroom door code that stays the same all semester.

Students keep using the same code. Changing the code is a deliberate reset, not something that happens every time you write it on the board.

### 5. How TutorTrack uses it

`get_or_create_teacher_share()` returns `{ token, created }`.

The UI says either “New link created” or “Existing link reused” after “Share link copied!”

### 6. Key takeaway

A share link is ongoing permission, not a one-time disposable receipt.

---

## Public vs Authenticated Routes

### 1. What is it?

Authenticated routes require a signed-in tutor.

Public routes allow anyone with a valid token to open a specific briefing.

### 2. Why does it exist?

Tutors manage private workspaces.

Teachers only need a read-only document — without TutorTrack accounts.

### 3. How does it work?

- `/teacher/...` stays behind `ProtectedRoute`
- `/share/:token` is public
- Public loading goes through a SECURITY DEFINER RPC, not open table reads

### 4. Simple analogy

A school office vs a hallway bulletin board.

Staff need badges for the office. Visitors can read one posted notice without entering staff areas.

### 5. How TutorTrack uses it

`SharedTeacherViewPage` sits outside `ProtectedRoute` and still reuses `TeacherViewDocument`.

### 6. Key takeaway

Separate audience access at the route layer, then reuse presentation components.

---

## Token-Based Authorization

### 1. What is it?

Token-based authorization grants access because the request presents a secret capability token — not because the viewer is a known user.

### 2. Why does it exist?

Classroom teachers should not sign in.

The token itself is the proof of permission.

### 3. How does it work?

1. Tutor creates a long random token stored in `teacher_shares`.
2. Teacher opens `/share/<token>`.
3. `get_teacher_view_by_share_token()` finds an unrevoked row and returns Teacher View JSON.
4. No matching active token → friendly unavailable page.

### 4. Simple analogy

A hotel key card.

Possession of the card opens the room. The hotel does not ask guests to create employee accounts.

### 5. How TutorTrack uses it

Tokens are 32 random bytes from `extensions.gen_random_bytes`, encoded as hex.

The token is the only identifier in the public URL.

### 6. Key takeaway

Treat the token as a secret capability. Anyone with the link can read that briefing until it is revoked.

---

## Resource-Based Permissions

### 1. What is it?

Resource-based permissions check whether the current tutor may act on a specific district or companionship.

### 2. Why does it exist?

Creating a share link is powerful. Only the owning tutor should mint links for their resources.

### 3. How does it work?

`get_or_create_teacher_share()`:

1. Requires `auth.uid()`
2. Calls `owns_district` or `owns_companionship`
3. Inserts a share only after ownership passes

Public reads authorize through the token, then verify the resource still belongs to that tutor.

### 4. Simple analogy

Only the teacher of record can hand out a classroom visitor pass.

A visitor pass does not let someone print more passes.

### 5. How TutorTrack uses it

RLS lets tutors manage their own `teacher_shares` rows.

Anonymous clients cannot query shares or missionary tables directly — only the share lookup RPC.

### 6. Key takeaway

Authorize link creation by resource ownership. Authorize public viewing by unrevoked token.

---

## Revoking Access

### 1. What is it?

Revocation ends a share link’s permission without deleting history.

Setting `revoked_at` makes that token stop working.

### 2. Why does it exist?

Transfers happen. Tutors change. A link pasted in chat may need to be turned off.

Persistent links need a deliberate off switch.

### 3. How does it work?

1. Active shares have `revoked_at = null`.
2. `revoke_teacher_share()` sets `revoked_at = now()` on the active row.
3. Public lookup ignores revoked rows.
4. The next Copy Share Link creates a fresh token because no active share remains.

### 4. Simple analogy

Deactivating a lost key card.

The old card stops opening the door. A new card can be issued later.

### 5. How TutorTrack uses it

The database and service expose `revoke_teacher_share` for a future management UI.

Invalid or revoked tokens show: “This link is no longer available.”

### 6. Key takeaway

Persistence is the default. Revocation is the intentional exception.

---

## Why Exposing Database IDs Is Dangerous

### 1. What is it?

Exposing database IDs means putting internal UUIDs (district, companionship, tutor) into public URLs or payloads.

### 2. Why does it exist as a risk?

Guessable or leaked IDs help attackers probe private resources and map your data model.

Even UUID guessing is weaker than random tokens, but IDs still reveal structure and enable targeted attacks if other checks fail.

### 3. How does it work (the safer pattern)?

Bad: `/teacher/district/<uuid>` shared with untrusted audiences.

Good: `/share/<random-token>` where the server maps token → resource privately.

Public JSON returns briefing fields only — no resource UUIDs.

### 4. Simple analogy

Shipping with a tracking number instead of printing the warehouse aisle and bin on the box.

Recipients follow the package without learning your warehouse map.

### 5. How TutorTrack uses it

`resource_id` and `tutor_user_id` stay inside `teacher_shares`.

The client assigns synthetic React keys (`shared-missionary-0`) so cards never need real IDs.

### 6. Key takeaway

Capability in the URL. Internal identity stays private.

---

# Feature 013 - Share Actions at the Workflow Entry Point

---

## Reducing User Steps

### 1. What is it?

Reducing user steps means removing unnecessary screens between the user’s intent and the result.

### 2. Why does it exist?

Every extra click increases friction. Tutors who only need a Google Chat link should not have to open the full Teacher View first.

### 3. How does it work?

Before: District/Companionship → Open Teacher View → Copy Share Link

After: District/Companionship → Copy Share Link

Opening the Teacher View remains available when tutors want to preview the briefing.

### 4. Simple analogy

A “copy meeting link” button on the calendar event itself, instead of opening the meeting first just to copy the invite.

### 5. How TutorTrack uses it

`TeacherViewEntryActions` places Open Teacher View and Copy Share Link together on District Detail and Companionship Workspace.

### 6. Key takeaway

Put the shortest path next to the moment the need appears.

---

## Designing Around User Workflows

### 1. What is it?

Designing around user workflows means matching the UI to how people already work, not forcing them through the app’s internal page structure.

### 2. Why does it exist?

Tutors think: “I need to send this district’s plans to the teacher.”

They do not think: “I need to navigate into the read-only presentation layer first.”

### 3. How does it work?

Identify the real job (share a link), then expose that action where the job starts (district or companionship page).

Keep deeper pages for deeper tasks (preview, review).

### 4. Simple analogy

A photocopier with a “share PDF” button on the home screen, not buried inside the print-preview menu.

### 5. How TutorTrack uses it

Sharing still uses the same service and persistent token logic.

Only the placement of the action changed to match the tutoring workflow.

### 6. Key takeaway

Architecture can stay layered while the UI follows the user’s path.

---

## Placing Actions Where Users Naturally Need Them

### 1. What is it?

Action placement puts controls next to the related content and decision point.

### 2. Why does it exist?

Hidden or distant actions get skipped. Users invent workarounds or abandon the task.

### 3. How does it work?

On district and companionship pages, tutors already decide whether to brief a teacher.

That is the natural place for:

- Open Teacher View (preview)
- Copy Share Link (send)

### 4. Simple analogy

Putting the light switch next to the door you enter, not in a utility closet down the hall.

### 5. How TutorTrack uses it

Both entry pages reuse `CopyShareLinkButton` through `TeacherViewEntryActions`.

Teacher View pages keep their own copy action without changing the document layout.

### 6. Key takeaway

Useful actions belong at the decision point, not only at the destination page.
