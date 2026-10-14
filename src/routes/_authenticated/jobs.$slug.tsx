import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrandLockup } from "@/components/BrandLockup";
import { JOBS } from "@/data/jobs";
import { jobSlug, type FitResult } from "@/lib/fit";
import { analyzeFit } from "@/lib/fit.functions";
import { useSessionUser } from "@/lib/applications";
import { resumeQuery, useAnalyses } from "@/lib/resume";

export const Route = createFileRoute("/_authenticated/jobs/$slug")({
  loader: ({ params }) => {
    const job = JOBS.find((j) => jobSlug(j) === params.slug);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.job.title} at ${loaderData.job.firm}` : "Posting";
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
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p>This posting is no longer on the board.</p>
      <Link to="/board" className="text-primary hover:underline">← Back to job board</Link>
    </div>
  ),
  component: JobDetail,
});

const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function JobDetail() {
  const { job } = Route.useLoaderData();
  const { user } = useSessionUser();
  const qc = useQueryClient();
  const { data: resume, isLoading: resumeLoading } = useQuery({ ...resumeQuery(user?.id ?? ""), enabled: !!user });
  const { data: analyses } = useAnalyses(user?.id);
  const saved = analyses?.find((a) => a.job_url === job.url);
  const run = useServerFn(analyzeFit);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");

  async function check() {
    setRunning(true); setErr("");
    try {
      await run({ data: { jobUrl: job.url } });
      await qc.invalidateQueries({ queryKey: ["analyses", user?.id] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The analysis failed.");
    } finally {
      setRunning(false);
    }
  }

  const hasResume = !!resume?.content.trim();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <BrandLockup />
      <div className="mt-6">
        <Link to="/board" className="text-sm text-muted-foreground hover:underline">← Back to job board</Link>
      </div>
      <article className="mt-4 rounded-lg border bg-card p-5">
        <p className="text-sm font-semibold text-muted-foreground">{job.firm}</p>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {[job.roleType, job.firmType, job.focus, job.location].filter(Boolean).map((t) => (
            <span key={t} className="rounded bg-secondary px-2 py-0.5 text-secondary-foreground">{t}</span>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Posted {fmt(job.datePosted)}{job.deadline && ` · Deadline ${fmt(job.deadline)}`}
        </p>
        <a href={job.url} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-block rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          View full posting & apply ↗
        </a>
      </article>

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">Resume Match</h2>
          {hasResume && (
            <button onClick={check} disabled={running}
              className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {running ? "Analyzing…" : saved ? "Regenerate" : "Check My Fit"}
            </button>
          )}
        </div>

        {!resumeLoading && !hasResume && (
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
        {!running && saved && <Results r={saved.result} at={saved.created_at} />}
      </section>
    </div>
  );
}

function Results({ r, at }: { r: FitResult; at: string }) {
  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center gap-4 rounded-lg border border-l-4 border-l-accent bg-card p-5">
        <span className="text-4xl font-bold text-primary">{r.fitScore}</span>
        <div>
          <p className="font-semibold">{r.fitLabel}</p>
          <p className="text-xs text-muted-foreground">Analyzed {new Date(at).toLocaleString()}</p>
        </div>
      </div>
      {r.requirements && (
        <Block title="Requirement-by-requirement check">
          <p className="mb-3 text-xs text-muted-foreground">Every requirement in the posting, checked against exact lines in your resume. Must-haves count 3× nice-to-haves; partial counts half. Claims without a matching line in your resume count as missing.</p>
          <ul className="divide-y">{r.requirements.map((q) => (
            <li key={q.requirement} className="py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${q.verdict === "met" ? "bg-primary text-primary-foreground" : q.verdict === "partial" ? "bg-highlight text-highlight-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {q.verdict === "met" ? "Met" : q.verdict === "partial" ? "Partial" : "Missing"}
                </span>
                <span className="font-medium">{q.requirement}</span>
                <span className="text-xs text-muted-foreground">{q.importance === "must" ? "Must-have" : "Nice-to-have"}</span>
              </div>
              {q.evidence && <p className="mt-1 text-muted-foreground">Your resume: “{q.evidence}”</p>}
              <p className="mt-1 text-muted-foreground">{q.reasoning}</p>
            </li>
          ))}</ul>
        </Block>
      )}
      <Block title="Strengths"><ul className="list-disc space-y-1 pl-5">{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul></Block>
      <Block title="Gaps">
        <ul className="space-y-2">{r.gaps.map((g) => (
          <li key={g.gap}><p className="font-medium">{g.gap}</p><p className="text-muted-foreground">→ {g.suggestion}</p></li>
        ))}</ul>
      </Block>
      <Block title="Resume tips"><ul className="list-disc space-y-1 pl-5">{r.resumeTips.map((s) => <li key={s}>{s}</li>)}</ul></Block>
      <h2 className="pt-2 text-2xl font-semibold">Interview Prep</h2>
      <Block title="Behavioral questions"><QA items={r.behavioralQuestions} /></Block>
      <Block title="Technical & VC questions"><QA items={r.technicalQuestions} /></Block>
      <p className="text-xs text-muted-foreground">AI-generated analysis. Use as a guide, not a final assessment.</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 text-sm">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function QA({ items }: { items: { question: string; tip: string }[] }) {
  return (
    <ol className="list-decimal space-y-3 pl-5">
      {items.map((q) => (
        <li key={q.question}><p className="font-medium">{q.question}</p><p className="text-muted-foreground">Tip: {q.tip}</p></li>
      ))}
    </ol>
  );
}
