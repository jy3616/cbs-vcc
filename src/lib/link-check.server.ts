import { checkLink } from "./link-check";
import { isLinkedIn } from './source-scraper';

/** Hourly check of every non-expired posting's link. A passing link re-stamps "Last verified"; a failing one only raises a "Needs review" flag — never expires a posting. */
export async function runLinkCheck() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("postings").select("id, url, needs_review").eq("expired", false);
  if (error) throw error;
  let flagged = 0;
  for (const p of data) {
    if (isLinkedIn(p.url)) continue;
    const v = await checkLink(p.url);
    const now = new Date().toISOString();
    const update: { last_checked_at: string; last_verified_at?: string; needs_review?: boolean; review_reason?: string; expired?: boolean } = { last_checked_at: now };
    if (v.flag) { update.needs_review = true; update.review_reason = v.reason; flagged++; }
    if (v.reason === 'Link returns 404 page not found') update.expired = true;
    else update.last_verified_at = now;
    await supabaseAdmin.from("postings").update(update).eq("id", p.id);
  }
  return { checked: data.length, flagged };
}
