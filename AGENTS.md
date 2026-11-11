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

- Board and posting details are top-level public routes; account, resume, and admin pages stay under the client-only `_authenticated` gate, with RLS and requireStudent enforcing private access independently.
- Resume storage is opt-in account storage or browser storage; fit checks use the zero-retention Gateway Responses surface without input logs, so transient submission never persists the resume.
- Account bookmarks store snapshots and application status under owner-scoped RLS; React Query invalidation synchronizes all lists and one-time import preserves prior browser bookmarks.
- Job postings live in the Cloud postings table with visible-row public read policies (src/data/jobs.ts only holds types); status (Open/Closing soon/Deadline passed/Expired) is computed from dates in src/lib/status.ts, never stored, so it stays correct daily.
- Hourly link checking skips excluded hosts, flags transient failures, and expires only confirmed 404s; source absence expires only after a successful complete source read. Why: blocked pages must never remove valid openings.
- Daily source scraping uses independent authenticated managed callbacks per active source at the same morning window; each reads its public ATS API or parses HTML, then transactional RPCs claim and record the aggregate daily scrape_runs entry. Why: short scheduler callbacks cannot safely run a whole multi-source crawl, and database locking prevents duplicate writes.
- HTML source parsing must import cheerio/slim, not cheerio; the full entry loads Node-only networking dependencies that crash published daily callbacks.
- HTML adapters read job headings and location fields on Breezy, JazzHR and iCIMS; incomplete paginated iCIMS lists fail safely rather than expiring unseen jobs.
- Applied Ventures uses Eightfold's public ventures search with schema and completeness checks; generic parent-company or non-eligible titles never become invented investment postings.
- John Gannon discovery reads its public rolling RSS feed, stores actual employers and dates, and uses a separate completion RPC that preserves company-source ownership and never expires jobs merely missing from the feed; hourly checks still verify saved links.
- Public board reads use a server publishable client with a safe column projection and visible-row anon RLS; last-verification RPC exposes only the aggregate timestamp while detailed scrape errors remain admin-only.
- Deadline-passed postings are deleted daily by a SQL-only pg_cron job. Why: the user wants them gone, not just labelled.
- Confirmed expired postings are excluded from public reads immediately and deleted by hourly SQL-only cleanup; saved application snapshots remain independent of posting rows.

- Admin roles are separate protected rows; email grants require an already signed-in verified student, and the designated owner is granted by the auth verification trigger rather than browser logic.
- Every auth lifecycle profile insert uses ON CONFLICT (id) DO NOTHING; multiple signup triggers must coexist without duplicate-key failures or overwriting student profile edits.
- Avatars are private Storage objects under owner folders and render through short-lived signed URLs, so images never become anonymous public assets.
- Board pagination slices the filtered, sorted list on the client and resets on filter or sort changes; this preserves global counts and fit ranking across pages.
- Public board reads and daily source adapters share job-eligibility.ts for seniority filtering; this keeps current counts and future imports consistent without deleting saved postings.
- Board and personal-description checks share the same server-side evidence audit and result renderer; category scores derive from verified requirements and unspecified categories stay unscored to avoid fabricated criteria.
- Personal job descriptions are transient matching input, never public postings; resume uploads require text confirmation before replacing saved content to prevent parsing mistakes.
