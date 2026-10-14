/** Pure link-check rules (shared by the daily job and tests). */

const GENERIC = /^(|careers?|jobs?|join(-us)?|work-with-us|open-positions|positions|opportunities|careers\/jobs|jobs\/search|careers\/search|search)$/;

/** Statuses that usually mean the site blocked our robot, not that the posting is gone. */
export const BLOCKED_STATUSES = new Set([401, 403, 429, 999]);

export function isGenericCareersPage(original: string, final: string): boolean {
  try {
    const a = new URL(original), b = new URL(final);
    if (a.href === b.href) return false;
    const path = b.pathname.toLowerCase().replace(/^\/+|\/+$/g, "");
    if (GENERIC.test(path)) return true;
    if (/linkedin\.com$/.test(b.hostname) && /^jobs(\/search)?$/.test(path)) return true;
    return /[?&](error|expired)=/i.test(b.search) || /expired/.test(path);
  } catch {
    return false;
  }
}

export type LinkVerdict = { flag: boolean; reason: string };

export function judgeLink(original: string, status: number, finalUrl: string): LinkVerdict {
  if (status === 0) return { flag: true, reason: "Link could not be reached" };
  if (BLOCKED_STATUSES.has(status)) return { flag: false, reason: `Site blocked the automatic check (${status})` };
  if (status >= 400) return { flag: true, reason: status === 404 ? "Link returns 404 page not found" : `Link returns error ${status}` };
  if (isGenericCareersPage(original, finalUrl)) return { flag: true, reason: "Redirects to a general careers page" };
  return { flag: false, reason: "" };
}

export async function checkLink(url: string): Promise<LinkVerdict> {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (CBS VCC Job Board link check)" } });
    return judgeLink(url, res.status, res.url || url);
  } catch {
    return judgeLink(url, 0, url);
  }
}
