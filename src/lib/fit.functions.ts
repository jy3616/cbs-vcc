import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { JOBS } from "@/data/jobs";
import { fitSchema, normalizeFit } from "./fit";

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
    const job = JOBS.find((j) => j.url === data.jobUrl);
    if (!job) throw new Error("This posting is no longer on the board.");
    const { data: resume } = await context.supabase.from("resumes").select("content").eq("user_id", context.userId).maybeSingle();
    if (!resume?.content.trim()) throw new Error("Add your resume on the My Resume page first.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const description = await fetchDescription(job.url);
    const posting = [
      `Firm: ${job.firm}`, `Title: ${job.title}`, `Location: ${job.location || "not stated"}`,
      `Firm type: ${job.firmType}`, `Focus: ${job.focus || "not stated"}`, `Role type: ${job.roleType}`,
      description ? `Full posting page text:\n${description}` : "Full description could not be retrieved; rely only on the fields above and do not invent requirements.",
    ].join("\n");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output, NoObjectGeneratedError } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions:
        "You are a venture capital career coach for Columbia Business School MBA students. Compare the resume to the job posting honestly. " +
        "fitScore 0-100; fitLabel must be 'Strong fit' (75+), 'Moderate fit' (50-74) or 'Stretch' (<50). " +
        "Give 3-5 strengths, 3-5 gaps each with a one-line suggestion, 2-3 resume tips specific to this role, " +
        "5 behavioral questions and 5 technical/VC-specific questions (market sizing, evaluating a startup, investment thesis, portfolio companies, why this firm), " +
        "each with a short tip referencing specific experiences from the resume. Never invent facts about the firm or the student.",
      messages: [{ role: "user", content: `JOB POSTING\n${posting}\n\nRESUME\n${resume.content.slice(0, 12000)}` }],
      output: Output.object({ schema: fitSchema }),
      maxRetries: 0,
      providerOptions: {
        openai: {
          forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto",
          store: false, include: ["reasoning.encrypted_content"],
        },
      },
    });

    let parsed;
    try {
      parsed = normalizeFit(await result.output);
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) throw new Error("The AI returned an unreadable answer. Try again.");
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 429) throw new Error("Too many requests right now. Try again in a minute.");
      if (status === 402) throw new Error("AI credits are used up for this workspace.");
      console.error(e);
      throw new Error("The analysis failed. Try again.");
    }

    const { error } = await context.supabase.from("job_analyses").upsert(
      { user_id: context.userId, job_url: job.url, fit_score: parsed.fitScore, result: parsed, created_at: new Date().toISOString() },
      { onConflict: "user_id,job_url" },
    );
    if (error) throw new Error(error.message);
    return parsed;
  });
