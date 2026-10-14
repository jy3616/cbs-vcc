import { describe, it, expect } from "vitest";
import { needsAttention, postingStatus, sortByStatus, statusText } from "@/lib/status";
import { judgeLink } from "@/lib/link-check";

const p = (o: Partial<{ deadline: string; rolling: boolean; expired: boolean }>) => ({ deadline: "", rolling: false, expired: false, ...o });
const T = "2026-10-14";

describe("posting status", () => {
  it("rolling is Open", () => expect(postingStatus(p({ rolling: true }), T).kind).toBe("open"));
  it("deadline more than 7 days away is Open", () => expect(postingStatus(p({ deadline: "2026-10-22" }), T).kind).toBe("open"));
  it("deadline 7 days away is Closing soon", () => expect(postingStatus(p({ deadline: "2026-10-21" }), T)).toEqual({ kind: "closing", daysLeft: 7 }));
  it("shows days left", () => expect(statusText(postingStatus(p({ deadline: "2026-10-17" }), T))).toBe("Closes in 3 days"));
  it("past deadline is Deadline passed", () => expect(postingStatus(p({ deadline: "2026-10-13" }), T).kind).toBe("passed"));
  it("confirmed removed is Expired, even with a future deadline", () =>
    expect(statusText(postingStatus(p({ expired: true, deadline: "2026-12-01" }), T))).toBe("Expired – no longer accepting applications"));
  it("sorts soonest deadline, then rolling, then passed, then expired", () => {
    const list = [
      { id: "x", ...p({ expired: true }) }, { id: "r", ...p({ rolling: true }) }, { id: "past", ...p({ deadline: "2026-10-01" }) },
      { id: "late", ...p({ deadline: "2026-12-01" }) }, { id: "soon", ...p({ deadline: "2026-10-16" }) },
    ];
    expect(sortByStatus(list, T).map((x) => x.id)).toEqual(["soon", "late", "r", "past", "x"]);
  });
  it("flags postings not verified in over 7 days", () => {
    const now = new Date("2026-10-14T12:00:00Z");
    expect(needsAttention({ ...p({ rolling: true }), needsReview: false, lastVerified: "2026-10-06T12:00:00Z" }, now)).toContain("Not verified in over 7 days");
    expect(needsAttention({ ...p({ rolling: true }), needsReview: false, lastVerified: "2026-10-08T12:00:00Z" }, now)).toEqual([]);
  });
});

describe("link check", () => {
  it("404 is flagged", () => expect(judgeLink("https://a.com/jobs/1", 404, "https://a.com/jobs/1").flag).toBe(true));
  it("redirect to a general careers page is flagged", () => expect(judgeLink("https://a.com/jobs/123-associate", 200, "https://a.com/careers").flag).toBe(true));
  it("working posting is not flagged", () => expect(judgeLink("https://a.com/jobs/1", 200, "https://a.com/jobs/1").flag).toBe(false));
  it("bot blocks are not flagged", () => expect(judgeLink("https://linkedin.com/jobs/view/1", 999, "https://linkedin.com/jobs/view/1").flag).toBe(false));
});
