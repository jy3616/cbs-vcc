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

- Job postings live in the Cloud postings table (admins edit them at /admin; src/data/jobs.ts only holds types); status (Open/Closing soon/Deadline passed/Expired) is computed from dates in src/lib/status.ts, never stored, so it stays correct daily; per-user applications are stored in Cloud keyed by job URL (with firm/title copies) so removed postings still show.
- Resume Match: resumes and AI fit analyses live in Cloud per user (RLS own-only); the AI call runs in a server function that fetches the posting page text so it never relies on invented job details.
- Daily link check (pg_cron -> /api/public/hooks/check-links) only raises Needs review flags, never expires postings, so the bearer-token filter is enough and replays are harmless.
