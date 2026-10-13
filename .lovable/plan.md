# Make the job board require sign-in first

## Goal
Visiting the site lands on a sign-in page. Only after signing in (or creating an account and confirming the email) can anyone see the job postings. The tracking features work exactly as today.

## New structure

```
Before                          After
/            -> job board       /            -> sign-in page (public)
/auth        -> sign-in page    /auth        -> removed
/my-apps     -> gated           /board       -> job board (gated)
                                /my-applications -> gated (unchanged)
```

## Changes

1. **`/` becomes the sign-in page.** Move the email/password form (sign in, create account, forgot password) from `src/routes/auth.tsx` into `src/routes/index.tsx`. If a visitor already has a session, `/` redirects straight to the board. After a successful sign-in, go to the board. Update the page title/description for a sign-in page. Delete `src/routes/auth.tsx`.

2. **The job board moves to `/board` behind the existing gate.** Move the board (logos, "New in the last 24 hours", filters, search, sorting, footer) into a new `src/routes/_authenticated/board.tsx`. The existing `_authenticated` gate already blocks signed-out visitors, so the board is never reachable without a session. Give it its own page title/description.

3. **Signed-in header.** On the board, everyone is signed in, so the header always shows the greeting, "My applications (n)" and "Sign out". Signing out goes back to the sign-in page at `/`. The "Sign in to track" variant of the job card goes away — every card just shows "Mark as applied".

4. **Point existing links at the new pages.**
   - The gate (`_authenticated/route.tsx`) redirects signed-out visitors to `/` instead of `/auth`.
   - "My applications" page: "← Back to job board" now goes to `/board`.
   - Password-reset page already returns to `/`, which now redirects signed-in users to the board — no change needed there.

5. **Signup note.** New accounts still get a confirmation email; after clicking it, they sign in at `/` and land on the board.

## Verification
- Signed-out Playwright visit: `/` shows the sign-in form; `/board` and `/my-applications` bounce back to `/`.
- Sign in with a real account: lands on `/board` with all 11 postings, filters and "Mark as applied" working.
- Build log clean.

## No data changes
No database, postings, or tracking behavior changes — only page placement.
