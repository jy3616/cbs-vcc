import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/BrandLockup";
import { BoardNav } from "@/components/BoardNav";
import { MatchResults } from "@/components/MatchResults";
import { analyzePersonalFit } from "@/lib/fit.functions";
import type { FitResult } from "@/lib/fit";
import { useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/_authenticated/match")({
  head: () => ({ meta: [
    { title: "Match a job description · CBS Venture Capital Club Job Board" },
    { name: "description", content: "Compare your resume with a personal venture capital job description and review evidence-based scores and resume suggestions." },
    { property: "og:title", content: "Personal resume match · CBS Venture Capital Club Job Board" },
    { property: "og:description", content: "Evidence-based resume matching for your own job description." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PersonalMatch,
});

function PersonalMatch() {
  const { text, ready } = useResume();
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<{ data: FitResult; at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = useServerFn(analyzePersonalFit);
  async function match() {
    setBusy(true); setError(""); setResult(null);
    try { const data = await run({ data: { description, resumeText: text } }); setResult({ data, at: new Date().toISOString() }); }
    catch (e) { setError(e instanceof Error ? e.message : "The match could not complete. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-4xl px-4 py-10">
    <header className="flex flex-wrap items-center gap-4"><BrandLockup /><BoardNav /></header>
    <h1 className="mt-8 text-3xl font-bold text-primary">Match a job description</h1>
    <label htmlFor="job-description" className="mt-5 block text-sm font-medium">Job description</label>
    <textarea id="job-description" rows={12} maxLength={25000} value={description} disabled={busy} onChange={e => { setDescription(e.target.value); setResult(null); }} className="mt-2 w-full rounded-md border border-input bg-card p-3 text-sm" />
    {ready && !text.trim() ? <Button asChild className="mt-3"><Link to="/my-resume">Add resume</Link></Button> : <Button className="mt-3" disabled={!ready || busy || description.trim().length < 100} onClick={() => void match()}>{busy ? "Matching…" : "Match"}</Button>}
    <p className="mt-2 text-xs text-muted-foreground">Your resume and job description are sent to an AI service for this check and are not stored afterward.</p>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {result && <MatchResults r={result.data} at={result.at} />}
  </div>;
}