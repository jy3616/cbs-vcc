import type { FitResult } from "@/lib/fit";

export function MatchResults({ r, at }: { r: FitResult; at: string }) {
  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center gap-4 rounded-lg border border-l-4 border-l-accent bg-card p-5">
        <span className={`text-4xl font-bold ${r.fitScore >= 75 ? "text-success" : r.fitScore >= 50 ? "text-warning-foreground" : "text-destructive"}`}>{r.fitScore}</span>
        <div>
          <p className="font-semibold">{r.fitLabel}</p>
          <p className="text-xs text-muted-foreground">Analyzed {new Date(at).toLocaleString()}</p>
        </div>
      </div>
      {r.categoryScores && <Block title="Category scores"><dl className="grid gap-4 sm:grid-cols-2">{r.categoryScores.map(c => <div key={c.category}><div className="flex justify-between gap-3"><dt>{c.category}</dt><dd className="shrink-0 font-semibold">{c.score === null ? "Not specified" : `${c.score}/100`}</dd></div>{c.score !== null && <progress aria-label={c.category} value={c.score} max={100} className="mt-2 h-2 w-full accent-primary" />}</div>)}</dl></Block>}
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
      <Block title="Suggested resume bullets"><ul className="list-disc space-y-1 pl-5">{r.resumeTips.map((s) => <li key={s}>{s}</li>)}</ul></Block>
      {!!r.missingKeywords?.length && <Block title="Missing keywords"><div className="flex flex-wrap gap-2">{r.missingKeywords.map(word => <span key={word} className="rounded bg-secondary px-2 py-1 text-secondary-foreground">{word}</span>)}</div></Block>}
      <h2 className="pt-2 text-2xl font-semibold">Interview Prep</h2>
      <Block title="Behavioral questions"><QA items={r.behavioralQuestions} /></Block>
      <Block title="Technical & VC questions"><QA items={r.technicalQuestions} /></Block>
      <p className="text-xs text-muted-foreground">AI-generated analysis. Use as a guide, not a final assessment.</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-5 text-sm">
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
