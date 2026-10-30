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

- Student content lives under the client-only `_authenticated` gate; database RLS and requireStudent independently verify the confirmed school mailbox, so routes are not the security boundary.
- Resume storage is opt-in account storage or browser storage; fit checks use the zero-retention Gateway Responses surface without input logs, so transient submission never persists the resume.
- Account bookmarks store snapshots and application status under owner-scoped RLS; React Query invalidation synchronizes all lists and one-time import preserves prior browser bookmarks.
- Job postings live in the Cloud postings table with verified-student read policies (src/data/jobs.ts only holds types); status (Open/Closing soon/Deadline passed/Expired) is computed from dates in src/lib/status.ts, never stored, so it stays correct daily.
- Hourly link checking skips excluded hosts, flags transient failures, and expires only confirmed 404s; source absence expires only after a successful complete source read. Why: blocked pages must never remove valid openings.
- Daily source scraping uses independent authenticated managed callbacks per active source at the same morning window; each reads its public ATS API or parses HTML, then transactional RPCs claim and record the aggregate daily scrape_runs entry. Why: short scheduler callbacks cannot safely run a whole multi-source crawl, and database locking prevents duplicate writes.
- Board reads use requireStudent and the protected suspense loader; last-verification RPC exposes only the aggregate timestamp while detailed scrape errors remain admin-only.
- Deadline-passed postings are deleted daily by a SQL-only pg_cron job. Why: the user wants them gone, not just labelled.

- Admin roles are separate protected rows; email grants require an already signed-in verified student, and the designated owner is granted by the auth verification trigger rather than browser logic.
- Every auth lifecycle profile insert uses ON CONFLICT (id) DO NOTHING; multiple signup triggers must coexist without duplicate-key failures or overwriting student profile edits.
- Avatars are private Storage objects under owner folders and render through short-lived signed URLs, so images never become anonymous public assets.
