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

## Open
- Next daily update run: add new postings, drop closed ones
