import { z } from "zod";
import { checkLink } from "./link-check";

/** Daily discovery: web search for new VC roles, read each page, keep only real investment roles with working links. */
const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";
const QUERIES = [
  "venture capital associate job",
  "venture capital analyst job",
  "venture capital MBA associate New York",
  "growth equity associate job",
  "corporate venture capital investment associate job",
  "venture capital summer associate MBA internship",
  "site:substack.com venture capital jobs",
];
const MAX_CANDIDATES = 10; // bound on pages read per run

export const extractSchema = z.object({
  isVcInvestmentRole: z.boolean(),
  isOpenPosting: z.boolean(),
  firm: z.string(),
  title: z.string(),
  location: z.string(),
  firmType: z.enum(["VC", "Growth equity", "CVC", "Studio", "Accelerator"]),
  focus: z.string(),
  sectors: z.array(z.string()).max(4),
  roleType: z.enum(["Full-time", "Summer internship", "In-semester internship", "Fellowship"]),
  deadline: z.string(), // YYYY-MM-DD or ""
  nyc: z.boolean(),
  mentionsMba: z.boolean(),
});

/** Only accept AI-extracted postings that are real, open, investment roles with a firm and title. */
export function acceptExtraction(e: z.infer<typeof extractSchema>, today: string): boolean {
  if (!e.isVcInvestmentRole || !e.isOpenPosting || !e.firm.trim() || !e.title.trim()) return false;
  if (e.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(e.deadline) || e.deadline < today)) return false;
  return true;
}

function fc(path: string, body: unknown) {
  const lov = process.env["LOVABLE_API_KEY"], key = process.env["FIRECRAWL_API_KEY"];
  if (!lov || !key) throw new Error("Web search is not configured");
  return fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": key },
    body: JSON.stringify(body),
  });
}

/** Same firm + same title = same role, even when found on a different job site. */
export const roleKey = (firm: string, title: string) => `${firm}|${title}`.toLowerCase().replace(/[^a-z0-9|]+/g, "");

class Halt extends Error {}

export async function runDiscovery() {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  // Single-flight lock + paused guard.
  const { data: lock } = await db.from("job_runs").update({ locked_until: new Date(now.getTime() + 15 * 60000).toISOString() })
    .eq("name", "discover-jobs").or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`).select().maybeSingle();
  if (!lock) return { skipped: "already running" };
  if (lock.paused_reason) {
    await db.from("job_runs").update({ locked_until: null }).eq("name", "discover-jobs");
    return { skipped: `paused: ${lock.paused_reason}` };
  }

  const added: string[] = [];
  let pause = "";
  try {
    const { data: existing } = await db.from("postings").select("url, firm, title");
    const known = new Set((existing ?? []).map((r) => r.url));
    const seenRoles = new Set((existing ?? []).map((r) => roleKey(r.firm, r.title)));

    const candidates: { url: string; title: string }[] = [];
    for (const query of QUERIES) {
      const res = await fc("/search", { query, limit: 8, tbs: "qdr:w" });
      if (res.status === 402 || (res.status === 403 && /credit limit/i.test(await res.clone().text()))) throw new Halt(`web search unavailable (${res.status})`);
      if (!res.ok) continue;
      const json = (await res.json()) as { data?: { web?: { url: string; title?: string }[] } | { url: string; title?: string }[] };
      const items = Array.isArray(json.data) ? json.data : json.data?.web ?? [];
      for (const it of items) {
        if (it.url && !known.has(it.url) && !candidates.some((c) => c.url === it.url)) candidates.push({ url: it.url, title: it.title ?? "" });
      }
    }

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { generateText, Output } = await import("ai");
    const apiKey = process.env["LOVABLE_API_KEY"]!;
    const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });

    for (const c of candidates.slice(0, MAX_CANDIDATES)) {
      const page = await fc("/scrape", { url: c.url, formats: ["markdown"], onlyMainContent: true });
      if (page.status === 402) throw new Halt("web reading credits used up (402)");
      if (page.status === 403 && /credit limit/i.test(await page.clone().text())) throw new Halt("web reading credit limit reached");
      if (!page.ok) continue;
      const pj = (await page.json()) as { data?: { markdown?: string; metadata?: { statusCode?: number } } };
      const md = pj.data?.markdown ?? "";
      if ((pj.data?.metadata?.statusCode ?? 200) >= 400 || md.length < 300) continue;

      let e: z.infer<typeof extractSchema>;
      try {
        const r = await generateText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions:
            `Today is ${today}. Decide whether this page is ONE specific, currently open job posting for an investment role (analyst, associate, principal, fellow, investment intern) at a venture capital, growth equity, corporate VC, venture studio or accelerator firm. ` +
            "Private equity buyout, secondaries, fund-of-funds, credit, banking, law, IR, operations, IT and portfolio-company jobs are NOT VC investment roles. Job-list pages, articles and newsletters are not single postings (isOpenPosting false). " +
            "Copy firm, title, location and deadline only from the page; never guess. Deadline as YYYY-MM-DD or empty if not stated. focus = stated stage/sector focus or empty.",
          messages: [{ role: "user", content: `URL: ${c.url}\n\n${md.slice(0, 12000)}` }],
          output: Output.object({ schema: extractSchema }),
          maxRetries: 0,
        });
        e = r.output as z.infer<typeof extractSchema>;
      } catch (err) {
        const s = (err as { statusCode?: number }).statusCode;
        if (s === 402 || s === 403) throw new Halt(`AI unavailable (${s})`);
        if (s === 429) break;
        continue;
      }
      if (!acceptExtraction(e, today) || seenRoles.has(roleKey(e.firm, e.title))) continue;
      const link = await checkLink(c.url);
      if (link.flag) continue;

      const { error } = await db.from("postings").insert({
        firm: e.firm, title: e.title, location: e.location, firm_type: e.firmType, focus: e.focus, sectors: e.sectors,
        role_type: e.roleType, date_posted: today, deadline: e.deadline || null, rolling: !e.deadline, url: c.url,
        nyc: e.nyc, mentions_mba: e.mentionsMba, expired: false, last_verified_at: new Date().toISOString(),
        needs_review: false, review_reason: "", last_checked_at: new Date().toISOString(),
      });
      if (!error) { added.push(`${e.firm} — ${e.title}`); known.add(c.url); seenRoles.add(roleKey(e.firm, e.title)); }
    }
  } catch (err) {
    if (err instanceof Halt) pause = err.message; else throw err;
  } finally {
    const result = { added, pause };
    await db.from("job_runs").update({ locked_until: null, last_run_at: new Date().toISOString(), last_result: result, ...(pause ? { paused_reason: pause } : {}) }).eq("name", "discover-jobs");
  }
  return { added, pause };
}
