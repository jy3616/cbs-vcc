import { describe, it, expect } from "vitest";
import { acceptExtraction } from "@/lib/discover.server";

const base = { isVcInvestmentRole: true, isOpenPosting: true, firm: "Acme Ventures", title: "Associate", location: "NYC", firmType: "VC" as const, focus: "", sectors: [], roleType: "Full-time" as const, deadline: "", nyc: true, mentionsMba: false };

describe("daily discovery filter", () => {
  it("keeps an open VC role", () => expect(acceptExtraction(base, "2026-10-29")).toBe(true));
  it("drops non-VC roles", () => expect(acceptExtraction({ ...base, isVcInvestmentRole: false }, "2026-10-29")).toBe(false));
  it("drops postings whose deadline has passed", () => expect(acceptExtraction({ ...base, deadline: "2026-10-28" }, "2026-10-29")).toBe(false));
});
