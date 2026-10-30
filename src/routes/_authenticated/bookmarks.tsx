import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BrandLockup } from "@/components/BrandLockup";
import { BoardNav } from "@/components/BoardNav";
import { StatusLabel } from "@/components/StatusLabel";
import { fmtDay, usePostings } from "@/lib/postings";
import { isInactive, postingStatus, todayET } from "@/lib/status";
import { fitLabelFor, jobSlug } from "@/lib/fit";
import { useAnalyses } from "@/lib/resume-store";
import { useBookmarks } from "@/lib/bookmarks";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks · CBS Venture Capital Club Job Board" },
      { name: "description", content: "Postings you bookmarked, saved in your own browser, so you can come back to them later." },
      { property: "og:title", content: "Bookmarks · CBS Venture Capital Club Job Board" },
      { property: "og:description", content: "Postings you saved to review later." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Bookmarks,
});

const fmtDate = (d: string) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

function Bookmarks() {
  const { data: JOBS = [] } = usePostings();
  const { map: bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { map: analyses } = useAnalyses();
  const today = todayET();

  const saved = useMemo(() => {
    const urls = Object.keys(bookmarks);
    const at = (u: string) => bookmarks[u] ?? "";
    const rows = urls
      .map((u) => ({ job: JOBS.find((j) => j.url === u), at: at(u) }))
      .filter((r): r is { job: NonNullable<typeof r.job>; at: string } => !!r.job)
      // Most recently bookmarked first.
      .sort((a, b) => b.at.localeCompare(a.at));
    const gone = urls
      .filter((u) => !JOBS.some((j) => j.url === u))
      .sort((a, b) => at(b).localeCompare(at(a)));
    return { rows, gone };
  }, [JOBS, bookmarks]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="border-b pb-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <BrandLockup />
          <BoardNav current="bookmarks" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Columbia Business School · Venture Capital Club</p>
        <h1 className="mt-2 text-2xl font-bold text-primary sm:text-4xl">Bookmarks</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {saved.rows.length
            ? `${saved.rows.length} posting${saved.rows.length === 1 ? "" : "s"} saved in this browser — newest first.`
            : "You haven't bookmarked anything yet."}{" "}
          Bookmarks live only in this browser, so they don't follow you to another device and are cleared with your browser data.
        </p>
      </header>

      <section className="mt-8">
        <div className="space-y-3">
          {saved.rows.length ? (
            saved.rows.map(({ job: j, at }) => {
              const score = analyses[j.url]?.result.fitScore;
              const dim = isInactive(postingStatus(j, today));
              return (
                <article
                  key={j.url}
                  className={`rounded-lg border bg-card p-4 sm:p-5 ${dim ? "opacity-60" : ""}`}
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-muted-foreground">{j.firm}</p>
                      <h2 className="text-lg font-semibold leading-snug">
                        <Link to="/jobs/$slug" params={{ slug: jobSlug(j) }} className="hover:text-primary hover:underline">
                          {j.title}
                        </Link>
                        {score !== undefined && (
                          <span
                            className="ml-2 inline-block rounded-full bg-primary px-2 py-0.5 align-middle text-xs font-semibold text-primary-foreground"
                            title={`${fitLabelFor(score)} — your Resume Match score`}
                          >
                            Your fit: {score}
                          </span>
                        )}
                      </h2>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBookmark(j.url)}
                        title="Remove bookmark"
                        className="rounded-md border border-accent bg-highlight px-3 py-1.5 text-sm font-medium text-highlight-foreground"
                      >
                        ★ Bookmarked
                      </button>
                      <Link
                        to="/jobs/$slug"
                        params={{ slug: jobSlug(j) }}
                        className="rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary"
                      >
                        Check My Fit
                      </Link>
                      <a
                        href={j.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                      >
                        Apply ↗
                      </a>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <StatusLabel p={j} />
                    {j.nyc && <span className="rounded bg-highlight px-2 py-0.5 font-semibold text-highlight-foreground">NYC</span>}
                    {j.mentionsMba && <span className="rounded bg-highlight px-2 py-0.5 font-semibold text-highlight-foreground">MBA</span>}
                    {[j.roleType, j.firmType, j.focus].filter(Boolean).map((t) => (
                      <span key={t} className="rounded bg-secondary px-2 py-0.5 text-secondary-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                  <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    {j.location && (
                      <div>
                        <dt className="sr-only">Location</dt>
                        {j.location}
                      </div>
                    )}
                    <div>Posted {fmtDate(j.datePosted)}</div>
                    <div className="font-medium text-foreground">
                      {j.rolling || !j.deadline ? "Rolling / no deadline" : `Deadline ${fmtDate(j.deadline)}`}
                    </div>
                    <div>Last verified {fmtDay(j.lastVerified)}</div>
                    <div>
                      Bookmarked{" "}
                      {new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </dl>
                </article>
              );
            })
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Nothing saved yet. Use the{" "}
              <span className="font-medium text-foreground" aria-hidden="true">
                ☆ Bookmark
              </span>{" "}
              button on any posting and it will show up here.
            </p>
          )}
        </div>
      </section>

      {saved.gone.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Saved but no longer on the board</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These links are still bookmarked in your browser, but the posting isn't on the board anymore.
          </p>
          <ul className="mt-3 space-y-2">
            {saved.gone.map((u) => (
              <li key={u} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 text-sm">
                <a href={u} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-primary hover:underline">
                  {u}
                </a>
                <button
                  type="button"
                  onClick={() => toggleBookmark(u)}
                  className="rounded-md border border-input px-3 py-1.5 font-medium text-muted-foreground hover:bg-secondary"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10">
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Back to job board
        </Link>
      </div>
    </div>
  );
}
