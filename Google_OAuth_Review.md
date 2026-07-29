# Google OAuth Review - What You Just Did (Simple Tutor Version)

You successfully connected TutorTrack to Google. This guide explains **what** that means, **why** you needed each step, and **what words like Client ID and secrets mean**.

Read it like a short lesson. No jargon without an explanation.

## The big picture (one sentence)

**OAuth** is a safe way for TutorTrack to ask Google:

"May this tutor let TutorTrack manage Google Forms for them?"

...without TutorTrack ever seeing the tutor's Google password.

## Two different logins (this confuses everyone at first)

TutorTrack has **two** separate authorizations:

1. **TutorTrack login (Supabase Auth)**  
   How you sign into TutorTrack itself (email/password, etc.).

2. **Google connection (OAuth)**  
   A second permission that says: "This TutorTrack user is allowed to use my Google account to create Forms."

Those are not the same thing.

Signing into TutorTrack does **not** automatically give TutorTrack access to Google Forms. That is why you had to click **Publish to Google Forms** and go through Google's consent screen.

## The story of what happened when it worked

Here is the flow in plain English:

1. You clicked **Publish to Google Forms** in TutorTrack.
2. TutorTrack's backend (a **Supabase Edge Function** called `google-oauth-start`) built a special Google link.
3. Your browser opened Google's page.
4. Google asked: "Do you trust TutorTrack to manage Forms on your account?"
5. You said yes.
6. Google sent TutorTrack back a temporary **code** (not your password).
7. Another Edge Function (`google-oauth-callback`) traded that code for **tokens** using a secret only the server knows.
8. TutorTrack saved the connection (email, tokens, etc.) in the `google_connections` table.
9. The app showed you as **Connected**.

You never typed your Google password into TutorTrack. That is the whole point of OAuth.

## What is a Client ID?

Think of the **Client ID** as TutorTrack's **public name tag** at Google.

- Google created an "OAuth client" for your app in Google Cloud Console.
- That client has a long ID that looks like: `721563490204-something.apps.googleusercontent.com`
- When TutorTrack sends someone to Google, it includes this ID so Google knows which app is asking for permission.

### Is the Client ID secret?

**No.** It is okay for it to appear in authorization URLs.

It identifies your app. It does **not** prove you are allowed to act as the app's owner by itself.

What **is** secret is the **Client Secret** (next section).

## What is a Client Secret?

Think of the **Client Secret** as TutorTrack's **private password with Google**.

- Only your **server** (Supabase Edge Functions) should know it.
- It must **never** go in the Vite frontend, Vercel public env vars named `VITE_...`, or GitHub.

### Why does Google need both?

| Piece | Role |
| --- | --- |
| **Client ID** | "Which app is this?" (public name tag) |
| **Client Secret** | "Prove you're really that app's backend" (private key) |

When Google redirects back with a one-time **authorization code**, TutorTrack's server uses:

- Client ID
- Client Secret
- that code

...to get **access** and **refresh tokens**.

If a random website only knew the Client ID, it still could not finish that trade without the Client Secret.

That is why Stage 2B put the code exchange in an **Edge Function**, not in the React app.

## What are "secrets" in Supabase?

In everyday English, a secret is something private.

In Supabase, **Edge Function secrets** are environment variables stored safely on Supabase's servers, for example:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SITE_URL`
- `GOOGLE_REDIRECT_URI` (optional if you rely on the default)

When your Edge Function runs, it reads them with code like this:

```ts
Deno.env.get("GOOGLE_CLIENT_ID")
```

Your laptop's `.env.local` for Vite is **different**.

Frontend env vars that start with `VITE_` get shipped to the browser.

**Never** put `GOOGLE_CLIENT_SECRET` there.

## What is a redirect URI?

After you approve access, Google needs to know **where to send the browser next**.

That address is the **redirect URI**. For TutorTrack it is:

```text
https://ogascohumktfenbpvzgi.supabase.co/functions/v1/google-oauth-callback
```

### Why must it match exactly?

Google only redirects to URIs you pre-approved in Google Cloud Console.

If even one character is wrong (http vs https, trailing slash, typo), Google blocks the login.

Your runtime log showed the redirect URI TutorTrack was actually using.

That exact string had to be listed under **Authorized redirect URIs** for your OAuth client.

## What went wrong with invalid_client - and what you fixed

Google showed:

> Access blocked... The OAuth client was not found.  
> Error 401: invalid_client

### What that means in simple terms

Google looked at the Client ID TutorTrack sent and said:

"I don't recognize this client" (or "this ID is malformed").

### What your logs revealed

The Client ID in Supabase started with:

```text
* 721563490204-...
```

instead of:

```text
721563490204-...
```

Someone (very commonly when copying from a bullet list) saved the secret with a leading `* ` (asterisk + space).

Google does not strip that. It treats `* 7215...` as a **different**, invalid Client ID.

### What you did to fix it

You ran:

```bash
supabase secrets set GOOGLE_CLIENT_ID="721563490204-....apps.googleusercontent.com"
```

with the **real, clean** Client ID from Google Cloud - no bullet, no extra spaces.

Then Google recognized the app, showed the consent screen, and authorization worked.

## What are access tokens and refresh tokens? (simple)

After you approve TutorTrack:

- **Access token** - a short-lived "visitor badge" that lets TutorTrack call Google APIs (create a Form, etc.) for a while.
- **Refresh token** - a longer-lived "renewal pass" so TutorTrack can get a new access token later **without** asking you to click through Google again every hour.

TutorTrack stores these in `google_connections` on the **server side**.

The browser UI only sees safe summary info (Connected, email, dates) - not the tokens themselves.

That matches the security rule you followed:

**Client Secret and tokens stay on the server.**

## Why did you need OAuth at all for Render an Account?

Because creating a Google Form in *your* Google Drive requires **your** Google permission.

Without OAuth, TutorTrack would either:

- be unable to create Forms in tutors' accounts, or
- need everyone's Google passwords (terrible / not allowed).

OAuth is the standard, safe handshake:

1. Tutor proves identity to Google.
2. Google tells TutorTrack "this tutor said yes."
3. TutorTrack can call Google APIs on their behalf within the scopes you requested (Forms, Drive/Sheets, email identity).

## Mini glossary

| Term | Simple meaning |
| --- | --- |
| **OAuth** | "Login with permission" system between apps |
| **Authorization Code Flow** | The safe server-side OAuth style TutorTrack uses |
| **Client ID** | Public ID of your Google OAuth app |
| **Client Secret** | Private password of your Google OAuth app (server only) |
| **Redirect URI** | Where Google sends the user after they approve |
| **Edge Function** | Small server program running on Supabase |
| **Scope** | What powers you ask for (Forms, Sheets, email, ...) |
| **Consent screen** | Google's "Allow TutorTrack to...?" page |
| **invalid_client** | Google does not accept the Client ID (or sometimes Secret) you sent |
| **exchange_failed** | Consent worked, but trading the code for tokens failed (often a bad Client Secret) |
| **access_denied (testing)** | App is in Testing mode; that Google account is not on the Test users list |
| **Test users** | Allowed Google accounts while the OAuth app is still unpublished / in testing |
| **SITE_URL** | Where the callback sends you after Google finishes (must match the site you use) |

## What you should remember as a new developer

1. **Frontend builds the experience; backend holds the secrets.**
2. **Client ID is not Client Secret.** One is a name tag; one is a private key.
3. **Redirect URIs must match character-for-character.**
4. **Copy-paste carefully.** Bullets, quotes, and spaces break OAuth in confusing ways.
5. **Logs are your friend.** Prefix/suffix logs and callback logs are how you catch bad secrets.
6. **Google "Allow" is not the same as TutorTrack "Connected."** Connected only happens after tokens are saved.
7. **While the app is in Testing, every Gmail must be added as a Test user.**

## Optional: clean up later

Those `console.log` lines in `google-oauth-start` / `google-oauth-callback` were for debugging.

Once you are comfortable everything works, you can remove them and redeploy so secret fragments are not printed in logs forever.

You did real OAuth debugging: fixed a malformed Client ID, added Test users, diagnosed `exchange_failed` from a bad Client Secret, and got TutorTrack to show **Connected**. That is exactly how professionals troubleshoot this.

## Problems you hit (in order) - and what each taught you

### 1) invalid_client on Google's page

**Symptom:** "The OAuth client was not found."

**Cause:** `GOOGLE_CLIENT_ID` in Supabase started with `* ` (copied from a bullet list).

**Fix:** Reset the secret to the clean Client ID from Google Cloud (no asterisk, no spaces).

**Lesson:** The Client ID must match Google Cloud **exactly**.

### 2) "App has not completed Google verification" / only testers

**Symptom:** Gmail blocked with a message about testing / developer-approved testers.

**Cause:** Your OAuth consent screen is in **Testing** mode. Only listed **Test users** can connect.

**Fix:** Google Cloud -> OAuth consent screen -> **Test users** -> add that Gmail.

**Lesson:** Until you publish/verify the app for production, every tutor account you try must be a Test user.

### 3) Still "Not Connected" after approving Google

**Symptom:** Google consent seemed fine, but Render an Account still said Not Connected.

**What "Connected" actually requires:**

1. Callback receives Google's redirect
2. Code is exchanged for tokens
3. Row is saved in `google_connections`
4. Browser returns to `/render-account?google_oauth=connected`
5. TutorTrack loads that row while you are signed in

**Also check SITE_URL:** it must be the same origin you use while testing (for you, often `http://localhost:5173`), with no trailing slash.

**Lesson:** Approving Google is only half the handshake.

### 4) URL showed google_oauth=error and exchange_failed

**Symptom:**

```text
/render-account?google_oauth=error&google_oauth_error=exchange_failed
```

**Meaning in plain English:**

Google said "yes," then TutorTrack's **server** tried to trade the one-time code for tokens using:

- Client ID
- Client Secret
- redirect URI

...and Google rejected that request. **No connection row was saved**, so the UI stayed Not Connected.

**Most common cause:** `GOOGLE_CLIENT_SECRET` was wrong or pasted with extra characters (same family of mistake as the Client ID bullet).

**Fix:**

```bash
supabase secrets set GOOGLE_CLIENT_SECRET="paste_the_real_secret_here"
supabase functions deploy google-oauth-callback
```

Then connect again.

**Lesson:** Client Secret is required for the code-to-token step. A bad secret fails *after* the consent screen, which feels confusing until you learn to read the `google_oauth_error` query param and callback logs.

### 5) Success - Connected!

When everything matched (clean Client ID, clean Client Secret, Test user allowed, redirect URI correct, SITE_URL correct), TutorTrack saved the Google connection and the Render an Account page showed **Connected**.

That is the finish line for Stage 2B authorization.

## End of review

If preview still looks short, close the preview tab and reopen it (or run **Markdown: Open Preview** again) so Cursor reloads the full file.
