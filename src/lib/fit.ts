import { z } from "zod";
import type { Job } from "@/data/jobs";

/** Pass 1: requirement-by-requirement matrix. */
export const matrixSchema = z.object({
  requirements: z.array(
    z.object({
      requirement: z.string(),
      source: z.string(), // short quote from the posting
      importance: z.enum(["must", "nice"]),
      verdict: z.enum(["met", "partial", "missing"]),
      evidence: z.string(), // exact quote from the resume, or "" if none
      reasoning: z.string(),
    }),
  ),
});
export type Requirement = z.infer<typeof matrixSchema>["requirements"][number];

/** Pass 2: narrative written from the verified matrix. */
const qa = z.object({ question: z.string(), tip: z.string() });
export const narrativeSchema = z.object({
  strengths: z.array(z.string()),
  gaps: z.array(z.object({ gap: z.string(), suggestion: z.string() })),
  resumeTips: z.array(z.string()),
  behavioralQuestions: z.array(qa),
  technicalQuestions: z.array(qa),
});

export type FitResult = z.infer<typeof narrativeSchema> & {
  fitScore: number;
  fitLabel: string;
  requirements?: Requirement[];
};

export function fitLabelFor(score: number): "Strong fit" | "Moderate fit" | "Stretch" {
  return score >= 75 ? "Strong fit" : score >= 50 ? "Moderate fit" : "Stretch";
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** A "met"/"partial" verdict only counts when its evidence really appears in the resume. */
export function verifyRequirements(reqs: Requirement[], resume: string): Requirement[] {
  const r = norm(resume);
  return reqs.map((q) => {
    const ev = norm(q.evidence);
    if (q.verdict !== "missing" && (ev.length < 8 || !r.includes(ev))) {
      return { ...q, verdict: "missing", evidence: "", reasoning: `${q.reasoning} (Downgraded: the cited evidence is not in the resume.)` };
    }
    return q;
  });
}

/** Score = weighted coverage. Must-haves weigh 3, nice-to-haves 1; met = 1, partial = 0.5. */
export function scoreRequirements(reqs: Requirement[]): number {
  if (!reqs.length) return 0;
  let got = 0, total = 0;
  for (const q of reqs) {
    const w = q.importance === "must" ? 3 : 1;
    total += w;
    got += w * (q.verdict === "met" ? 1 : q.verdict === "partial" ? 0.5 : 0);
  }
  return Math.round((got / total) * 100);
}

export function jobSlug(j: Pick<Job, "firm" | "title" | "url">) {
  const base = `${j.firm} ${j.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  let h = 0;
  for (const c of j.url) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${base}-${h.toString(36)}`;
}
