import { MatchResults } from "@/components/MatchResults";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStudent } from "@/lib/auth";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BrandLockup } from "@/components/BrandLockup";
import { PostingExtras } from "@/components/PostingExtras";
import { postedDays } from "@/lib/student";
import { todayET } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { BoardNav } from "@/components/BoardNav";
import { usePostings, fmtDay } from "@/lib/postings";
import { StatusLabel } from "@/components/StatusLabel";
import { jobSlug } from "@/lib/fit";
import { analyzeFit } from "@/lib/fit.functions";
import { useAnalyses, useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/jobs/$slug")({
  head: () => {
    const t = "Job posting";
    return {
      meta: [
        { title: `${t} · CBS Venture Capital Club Job Board` },
        { name: "description", content: `Details and resume fit check for ${t}.` },
        { property: "og:title", content: `${t} · CBS Venture Capital Club Job Board` },
        { property: "og:description", content: `Check your fit and prep for interviews for ${t}.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: JobDetail,
});

const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function JobDetail() {
  const { slug } = Route.useParams();
  const { data: postings, isLoading } = usePostings();
  const job = postings?.find((j) => jobSlug(j) === slug);
  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>;
  if (!job) return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p>This posting is no longer on the board.</p>
      <Link to="/" className="text-primary hover:underline">← Back to job board</Link>
    </div>
  );
  return <JobDetailBody job={job} />;
}

function JobDetailBody({ job }: { job: import("@/data/jobs").Job }) {
  const { user } = useStudent();
  const { text: resume, ready } = useResume();
  const { map, save } = useAnalyses();
  const saved = map[job.url];
  const run = useServerFn(analyzeFit);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");

  async function check() {
    setRunning(true); setErr("");
    try {
      const result = await run({ data: { jobUrl: job.url, resumeText: resume } });
      save(job.url, result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The analysis failed.");
    } finally {
      setRunning(false);
    }
  }

  const hasResume = !!resume.trim();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <BrandLockup />
        <BoardNav />
      </div>
      <div className="mt-6">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">← Back to job board</Link>
      </div>
      <article className="mt-4 rounded-lg border bg-card p-5">
        <p className="text-sm font-semibold text-muted-foreground">{job.firm}</p>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <StatusLabel p={job} className="text-sm" />
          {[job.roleType, job.firmType, job.focus, job.location].filter(Boolean).map((t) => (
            <span key={t} className="rounded bg-secondary px-2 py-0.5 text-secondary-foreground">{t}</span>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Posted {postedDays(job.datePosted,todayET())} days ago · {job.rolling || !job.deadline ? "Rolling / no deadline" : `Deadline ${fmt(job.deadline)}`} · Last verified {fmtDay(job.lastVerified)}
        </p>
        <a href={job.url} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-block rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          View full posting & apply ↗
        </a>
      <PostingExtras job={job}/>
      </article>

      {user && <section className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">Resume Match</h2>
          {user && hasResume && (
            <Button onClick={check} disabled={running}
              className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {running ? "Analyzing…" : saved ? "Regenerate" : "Check My Fit"}
            </Button>
          )}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">Your resume text is sent to an AI service for this check and is not stored afterward; only your chosen resume storage and cached results remain.</p>
        {user && ready && !hasResume && (
          <p className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Add your resume first to check your fit.{" "}
            <Link to="/my-resume" className="font-medium text-primary hover:underline">Go to My Resume →</Link>
          </p>
        )}
        {err && <p className="mt-4 rounded-lg border border-destructive p-4 text-sm text-destructive">{err}</p>}
        {running && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Reading the posting and comparing it with your resume — this can take up to a minute…
          </div>
        )}
        {user && !running && saved && <MatchResults r={saved.result} at={saved.at} />}
      </section>}
    </div>
  );
}

