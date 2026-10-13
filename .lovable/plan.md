# Login + "My applications"

## What people get
- **Sign in / Sign up page** (`/auth`): email + password, plus a name field on sign-up. Includes "Forgot password" and a reset-password page.
- **Header on the job board**: "Sign in" button when signed out; when signed in, shows their name, a "My applications" link, and "Sign out".
- **"Mark as applied" button on every job card** (next to Apply). Toggles to "Applied ✓". Signed-out visitors see "Sign in to track".
- **My applications page** (`/my-applications`, signed-in only): list of postings they marked, with the date they marked it, and an option to remove each.
- Each person sees only their own applications. The job board itself stays public.

## Technical details
- Enable Lovable Cloud; turn on email/password auth.
- Tables: `profiles` (id → auth user, display_name; auto-created on sign-up via trigger) and `applications` (user_id, job_url, applied_at, unique per user+job). RLS: users read/write only their own rows. Grants per table.
- Jobs stay in `src/data/jobs.ts`; applications reference jobs by URL. Postings later removed from the board still show in My applications using saved firm/title copies stored on the row.
- Routes: `src/routes/auth.tsx`, `src/routes/reset-password.tsx`, `src/routes/_authenticated/my-applications.tsx` (managed auth gate).
- Single `onAuthStateChange` listener in root; Toaster mounted in root.
- Add a small test that the applied toggle only works for signed-in users.
