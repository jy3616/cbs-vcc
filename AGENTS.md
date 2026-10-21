<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The site is fully public with no accounts: `src/routes/index.tsx` is the job board; there is no sign-in or application tracking (removed at the user's request).
- Resume Match is browser-only: resume text and fit results live in the visitor's localStorage (src/lib/resume-store.ts); the AI check runs in the public analyzeFit server function, which only fetches posting URLs that exist in the postings table and never stores the resume server-side.
- Bookmarks are browser-only too: job-URL bookmarks live in the visitor's localStorage (src/lib/bookmarks.ts), never on the server.
- Job postings live in the Cloud postings table with an anonymous read policy (src/data/jobs.ts only holds types); status (Open/Closing soon/Deadline passed/Expired) is computed from dates in src/lib/status.ts, never stored, so it stays correct daily.
- Hourly link check (pg_cron -> /api/public/hooks/check-links) only raises Needs review flags, never expires postings, so the bearer-token filter is enough and replays are harmless.
