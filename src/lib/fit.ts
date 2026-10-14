import { z } from "zod";
import type { Job } from "@/data/jobs";

const qa = z.object({ question: z.string(), tip: z.string() });
export const fitSchema = z.object({
  fitScore: z.number(),
  fitLabel: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.object({ gap: z.string(), suggestion: z.string() })),
  resumeTips: z.array(z.string()),
  behavioralQuestions: z.array(qa),
  technicalQuestions: z.array(qa),
});
export type FitResult = z.infer<typeof fitSchema>;

export function fitLabelFor(score: number): "Strong fit" | "Moderate fit" | "Stretch" {
  return score >= 75 ? "Strong fit" : score >= 50 ? "Moderate fit" : "Stretch";
}

export function normalizeFit(r: FitResult): FitResult {
  const fitScore = Math.max(0, Math.min(100, Math.round(r.fitScore)));
  return {
    ...r,
    fitScore,
    fitLabel: fitLabelFor(fitScore),
    strengths: r.strengths.slice(0, 5),
    gaps: r.gaps.slice(0, 5),
    resumeTips: r.resumeTips.slice(0, 3),
    behavioralQuestions: r.behavioralQuestions.slice(0, 5),
    technicalQuestions: r.technicalQuestions.slice(0, 5),
  };
}

export function jobSlug(j: Pick<Job, "firm" | "title" | "url">) {
  const base = `${j.firm} ${j.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  let h = 0;
  for (const c of j.url) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${base}-${h.toString(36)}`;
}
