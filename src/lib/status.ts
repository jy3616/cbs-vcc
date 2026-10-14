export type PostingStatus =
  | { kind: "open" }
  | { kind: "closing"; daysLeft: number }
  | { kind: "passed" }
  | { kind: "expired" };

type StatusInput = { deadline: string; rolling: boolean; expired: boolean };

/** Today's date (YYYY-MM-DD) in New York, where the club is. */
export function todayET(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

const dayNum = (ymd: string) => Math.round(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) / 86400000);

export function postingStatus(p: StatusInput, today: string): PostingStatus {
  if (p.expired) return { kind: "expired" };
  if (p.rolling || !p.deadline) return { kind: "open" };
  const daysLeft = dayNum(p.deadline) - dayNum(today);
  if (daysLeft < 0) return { kind: "passed" };
  if (daysLeft <= 7) return { kind: "closing", daysLeft };
  return { kind: "open" };
}

export function isInactive(s: PostingStatus) {
  return s.kind === "passed" || s.kind === "expired";
}

export function statusText(s: PostingStatus): string {
  switch (s.kind) {
    case "open": return "Open";
    case "closing": return s.daysLeft === 0 ? "Closes today" : `Closes in ${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"}`;
    case "passed": return "Deadline passed";
    case "expired": return "Expired – no longer accepting applications";
  }
}

/** Default order: dated open/closing postings by soonest deadline, then rolling, then deadline passed, then expired. */
export function sortByStatus<T extends StatusInput>(list: T[], today: string): T[] {
  const rank = (p: T) => {
    const s = postingStatus(p, today);
    if (s.kind === "expired") return 3;
    if (s.kind === "passed") return 2;
    return p.rolling || !p.deadline ? 1 : 0;
  };
  return [...list].sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? a.deadline.localeCompare(b.deadline) : 0));
}

/** Admin attention: flagged by the link check, closing within 7 days, or not verified in over 7 days. */
export function needsAttention(p: StatusInput & { needsReview: boolean; lastVerified: string }, now: Date): string[] {
  if (p.expired) return [];
  const why: string[] = [];
  if (p.needsReview) why.push("Needs review");
  const s = postingStatus(p, todayET(now));
  if (s.kind === "closing") why.push(statusText(s));
  if (now.getTime() - new Date(p.lastVerified).getTime() > 7 * 86400000) why.push("Not verified in over 7 days");
  return why;
}
