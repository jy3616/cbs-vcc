import { describe, it, expect } from "vitest";
import { isNew } from "@/data/jobs";

describe("isNew", () => {
  it("counts a posting dated today as new before midnight ET", () => {
    // 2026-10-19 03:50 UTC = 2026-10-18 23:50 ET; datePosted is the 19th.
    const now = new Date("2026-10-19T03:50:00Z");
    expect(isNew({ datePosted: "2026-10-19" }, now)).toBe(true);
  });

  it("drops a posting dated more than 24h ago", () => {
    const now = new Date("2026-10-20T12:00:00Z");
    expect(isNew({ datePosted: "2026-10-18" }, now)).toBe(false);
  });

  it("rejects a posting dated more than a day in the future", () => {
    const now = new Date("2026-10-19T03:50:00Z");
    expect(isNew({ datePosted: "2026-10-21" }, now)).toBe(false);
  });
});
