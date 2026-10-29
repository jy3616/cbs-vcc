# Roadmap

## Done
- Build CBS VC job board (7 postings, filters, search, sort, NYC/MBA highlights)
- Columbia Business School logo at top + browser tab icon
- Venture Capital Club logo in the header
- Add job postings from LinkedIn (public guest listings, no login)
- Login page + "My applications" tracking
- Sign-in page first: `/` is the sign-in page, the board moved to `/board` behind the gate
- Renamed to "CBS Venture Capital Club Job Board" (titles, headings, tab icon metadata); heading keeps "CBS Venture Capital Club" on one line
- Removed the falling CBS logo animation at the user's request; header logos stay static and do not fall
- Posting card buttons ("Mark as applied", "Check My Fit", "Apply") stay aligned to the right edge of the card at every window width
- Header logo lockup is now a link back to the job board; it also appears on "My applications"

- Resume Match: My resume page, job detail pages with Check My Fit + Interview Prep, saved results, Regenerate, fit badges on cards

- Deadline tracking: status labels, deadline sort, hide-expired toggle, admin page, daily link check
- Removed the "Admin" button from the board header (admin page still reachable at /admin)
- Removed sign-in entirely: the board is public at `/`; login, Mark as applied, My applications, and the admin page are all deleted
- Restored Resume Match without accounts: My resume page (browser-only storage), job detail pages with Check My Fit + Interview Prep, fit badges on cards
- Bookmark button on every job card (browser-only localStorage, keyed by job URL)
- Bookmarks page at /bookmarks from the header ("My resume" + "Bookmarks (n)"): saved postings newest first, each with remove, Check My Fit and Apply; saved links that left the board are listed separately
- Scraped Indeed/Glassdoor/other job sites for VC postings: added 6 verified roles (HOF Capital Analyst, Associate, Fall 2026 Intern; J2 Ventures Associate; Intermountain Ventures Analyst; Impression Ventures Analyst) — board now 20 postings

## Open
- Publish the updated daily checks (awaiting user publishing request)

## Source scraper completed
- Diagnosed misleading zero/dash loading fallback; public server reads and explicit loading/error states now protect homepage totals
- Added 30 confirmed careers sources, uncertainty flags, and aggregate scrape_runs with per-source outcomes
- Added Greenhouse, Lever, Ashby and conservative HTML adapters; investment-only filtering, firm/title deduplication, source-absence expiration, and LinkedIn exclusion
- Configured independent managed source callbacks around 6am ET with daylight-saving guard (29 active sources; Pear inactive pending mixed-board review)
- Ran today: 29 sources checked, 23 succeeded, 6 HTML lists failed safely; 18 added, 1 updated, 0 expired; board has 47 open postings
- Verified homepage, unauthorized callback rejection, replay prevention, all 57 tests, and clean build
