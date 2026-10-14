import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fitLabelFor, matrixSchema, narrativeSchema, scoreRequirements, verifyRequirements, type FitResult } from "./fit";

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (CBS VCC Job Board)" } });
    if (!res.ok) return "";
    return htmlToText(await res.text()).slice(0, 14000);
  } catch {
    return "";
  }
}

export const analyzeFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobUrl: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: job } = await context.supabase.from("postings").select("firm, title, location, firm_type, focus, role_type, url").eq("url", data.jobUrl).maybeSingle();
    if (!job) throw new Error("This posting is no longer on the board.");
    const { data: resume } = await context.supabase.from("resumes").select("content").eq("user_id", context.userId).maybeSingle();
    if (!resume?.content.trim()) throw new Error("Add your resume on the My Resume page first.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const description = await fetchDescription(job.url);
    const posting = [
      `Firm: ${job.firm}`, `Title: ${job.title}`, `Location: ${job.location || "not stated"}`,
      `Firm type: ${job.firm_type}`, `Focus: ${job.focus || "not stated"}`, `Role type: ${job.role_type}`,
      description ? `Full posting page text:\n${description}` : "Full description could not be retrieved; rely only on the fields above and do not invent requirements.",
    ].join("\n");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output, NoObjectGeneratedError } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const resumeText = resume.content.slice(0, 12000);
    const opts = {
      openai: {
        forceReasoning: true, reasoningEffort: "high", reasoningSummary: "auto",
        store: false, include: ["reasoning.encrypted_content"],
      },
    } as const;
    const fail = (e: unknown): never => {
      if (NoObjectGeneratedError.isInstance(e)) throw new Error("The AI returned an unreadable answer. Try again.");
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 429) throw new Error("Too many requests right now. Try again in a minute.");
      if (status === 402) throw new Error("AI credits are used up for this workspace.");
      console.error(e);
      throw new Error("The analysis failed. Try again.");
    };

    // Pass 1 — cold, requirement-by-requirement audit.
    const pass1 = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions:
        "You are a skeptical VC hiring partner screening a candidate. Work in two steps.\n" +
        "Step 1: read ONLY the job posting and list every concrete requirement or preference it states (6-12 items: experience, skills, sector knowledge, stage, location, degree, eligibility, availability). " +
        "For each, quote the posting in `source` and mark `importance` 'must' (required/must/minimum) or 'nice' (preferred/plus/bonus). Use only what the posting says; ignore page boilerplate.\n" +
        "Step 2: for each requirement, search the resume. `evidence` must be an EXACT verbatim quote copied from the resume (a phrase of at least a few words) — never paraphrase. " +
        "Verdict 'met' only if the quote clearly proves it; 'partial' if it is adjacent or unquantified; 'missing' with empty evidence otherwise. " +
        "Be strict: interest is not experience, a title is not proof of a skill, and absence of evidence is 'missing'. `reasoning` = one sentence.",
      messages: [{ role: "user", content: `JOB POSTING\n${posting}\n\nRESUME\n${resumeText}` }],
      output: Output.object({ schema: matrixSchema }),
      maxRetries: 0,
      providerOptions: opts,
    });
    let requirements;
    try {
      requirements = verifyRequirements(((await pass1.output) as import("zod").infer<typeof matrixSchema>).requirements.slice(0, 14), resumeText);
    } catch (e) { fail(e); }
    const fitScore = scoreRequirements(requirements!);

    // Pass 2 — write the feedback from the verified matrix only.
    const matrixText = requirements!
      .map((q, i) => `${i + 1}. [${q.importance}] ${q.requirement} — ${q.verdict.toUpperCase()}${q.evidence ? ` (resume: "${q.evidence}")` : ""}. ${q.reasoning}`)
      .join("\n");
    const pass2 = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions:
        "You are a VC career coach for Columbia Business School MBA students. You receive a VERIFIED requirement audit; treat it as ground truth and do not upgrade any verdict. " +
        "Strengths (3-5): only from MET/PARTIAL rows, citing the resume evidence. Gaps (3-5): from MISSING/PARTIAL rows, must-haves first, each with a one-line concrete suggestion. " +
        "Resume tips (2-3): specific edits for this role. Then 5 behavioral and 5 technical/VC questions (market sizing, evaluating a startup, investment thesis, portfolio companies, why this firm) " +
        "tailored to this firm and candidate, each with a short tip naming a specific experience from the resume. Never invent facts about the firm or the student.",
      messages: [{ role: "user", content: `JOB POSTING\n${posting}\n\nRESUME\n${resumeText}\n\nVERIFIED AUDIT (score ${fitScore}/100)\n${matrixText}` }],
      output: Output.object({ schema: narrativeSchema }),
      maxRetries: 0,
      providerOptions: opts,
    });
    let parsed: FitResult | undefined;
    try {
      const n = (await pass2.output) as import("zod").infer<typeof narrativeSchema>;
      parsed = {
        fitScore, fitLabel: fitLabelFor(fitScore), requirements: requirements!,
        strengths: n.strengths.slice(0, 5), gaps: n.gaps.slice(0, 5), resumeTips: n.resumeTips.slice(0, 3),
        behavioralQuestions: n.behavioralQuestions.slice(0, 5), technicalQuestions: n.technicalQuestions.slice(0, 5),
      };
    } catch (e) { fail(e); }

    const { error } = await context.supabase.from("job_analyses").upsert(
      { user_id: context.userId, job_url: job.url, fit_score: parsed!.fitScore, result: parsed! as never, created_at: new Date().toISOString() },
      { onConflict: "user_id,job_url" },
    );
    if (error) throw new Error(error.message);
    return parsed!;
  });
