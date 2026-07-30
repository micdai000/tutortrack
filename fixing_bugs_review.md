# Fixing Bugs Review — Stage 3A Response Pipeline

This note explains, in simple terms, what went wrong when TutorTrack tried to receive Google Form submissions, and how we fixed it.

---

## What we were trying to do

When a missionary submits the Render an Account Google Form, TutorTrack should:

1. Get the submission
2. Store the raw Google data
3. Store a clean TutorTrack version of the answers

The plan was:

**Google Form → Google Sheet → Apps Script → TutorTrack → Supabase**

---

## Why nothing showed up in Supabase at first

Sync said “Up To Date,” so it looked successful.

But Sync updating the Form is **not the same thing** as installing the response pipeline.

The Apps Script piece (the part that sends submissions to TutorTrack) had never finished installing. So submissions never arrived in:

- `render_form_submissions_raw`
- `render_form_submissions`
- `render_form_answers`

---

## Bug 1 — Reconnect did not ask for the new Google permissions

### What happened
We added Apps Script permissions to TutorTrack, but Reconnect was still using an older OAuth deploy. Google kept giving TutorTrack the **old** permissions.

### Error you saw
`ACCESS_TOKEN_SCOPE_INSUFFICIENT` / insufficient authentication scopes

### Fix
- Redeployed the Google OAuth Edge Functions with the full scope list
- Forced Google to show the full consent screen again
- You reconnected Google so the new permissions were actually granted

**Lesson:** When you add new Google permissions, the OAuth functions must be redeployed, and the user must reconnect so Google grants them.

---

## Bug 2 — Apps Script API was enabled in Cloud, but not for your Google account

### What happened
The Apps Script API was turned on in Google Cloud Console. That is required, but not enough.

Google also requires each user to enable Apps Script API here:

[https://script.google.com/home/usersettings](https://script.google.com/home/usersettings)

### Error you saw
`User has not enabled the Apps Script API`

### Fix
You turned on **Google Apps Script API** in your personal Apps Script settings.

**Lesson:** Cloud Console API enable ≠ personal Apps Script setting. Both matter.

---

## Bug 3 — TutorTrack tried to edit a read-only Apps Script deployment

### What happened
Google creates a special “HEAD” deployment that cannot be changed. Our install code tried to update it.

### Error you saw
`Read-only deployments may not be modified`

### Fix
Stopped updating Google’s read-only deployment. TutorTrack now creates/uses its own deployment when needed, and runs setup in a safer way.

**Lesson:** Never try to modify Google’s built-in HEAD deployment.

---

## Bug 4 — Google blocked automatic script execution (`scripts.run`)

### What happened
TutorTrack can create the Apps Script project and upload the code. But Google often blocks apps from **running** that script automatically (`scripts.run` returns 403).

### Error you saw
`The caller does not have permission`

### Fix
1. TutorTrack still creates/uploads the script automatically
2. You ran `installPipeline` once by hand in the Apps Script editor
3. That linked the Form to the Sheet and installed the On Form Submit trigger

**Lesson:** Creating a script is not the same as being allowed to run it remotely. One manual Run can finish setup when Google blocks automation.

---

## Bug 5 — Sync kept overwriting your successful manual install

### What happened
After you successfully ran `installPipeline`, Sync tried automatic setup again, failed again, and set the UI back to “Needs Attention.”

Your manual work was fine. Sync was being too pessimistic.

### Fix
Before complaining, Sync now checks:

> “Does this Google Form already have a linked response spreadsheet?”

If yes, that means `installPipeline` already worked, so TutorTrack marks:

**Response Pipeline: Installed**

**Lesson:** If a manual step already succeeded, don’t keep reporting failure just because the automatic path still fails.

---

## Extra safety net we added

Even when real-time Apps Script push is struggling, **Sync Changes** can also pull responses directly from the Google Forms API into TutorTrack.

So tutors have two paths:

1. **Real-time push** via Apps Script (best)
2. **Import on Sync** via Forms API (backup)

That way submissions are much harder to lose.

---

## Final working state

After these fixes, your card showed:

- Google Connected
- Google Form Created
- Status: Up To Date
- Response Pipeline: **Installed**

That means TutorTrack is ready to receive Form submissions.

---

## Simple checklist if this breaks again

1. Reconnect Google (so scopes are current)
2. Confirm Apps Script API is ON at [script.google.com/home/usersettings](https://script.google.com/home/usersettings)
3. Click Sync Changes
4. If Response Pipeline needs attention:
   - Open Apps Script
   - Run `installPipeline`
   - Approve permissions
   - Sync again
5. Submit a test Form response
6. Check Supabase tables for new rows

---

## One-sentence summary

Most of the pain was Google permissions and Apps Script automation limits — not your Form questions — and we fixed it by granting the right access, avoiding read-only deployments, using one manual `installPipeline` run when Google blocked auto-run, and teaching Sync to recognize when the pipeline was already installed.
