import { checkLink } from "./link-check";

/** Checks every non-expired posting's link. Only ever raises a "Needs review" flag — never expires a posting. */
export async function runLinkCheck() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("postings").select("id, url, needs_review").eq("expired", false);
  if (error) throw error;
  let flagged = 0;
  for (const p of data) {
    const v = await checkLink(p.url);
    const update: { last_checked_at: string; needs_review?: boolean; review_reason?: string } = { last_checked_at: new Date().toISOString() };
    if (v.flag) { update.needs_review = true; update.review_reason = v.reason; flagged++; }
    await supabaseAdmin.from("postings").update(update).eq("id", p.id);
  }
  return { checked: data.length, flagged };
}
