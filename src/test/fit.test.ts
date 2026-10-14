import { describe, it, expect } from "vitest";
import { fitLabelFor, scoreRequirements, verifyRequirements, type Requirement } from "@/lib/fit";
const req = (o: Partial<Requirement>): Requirement => ({ requirement: "x", source: "", importance: "must", verdict: "met", evidence: "", reasoning: "", ...o });
describe("fit scoring", () => {
  it("75+ is Strong fit", () => expect(fitLabelFor(75)).toBe("Strong fit"));
  it("50-74 is Moderate fit", () => expect(fitLabelFor(74)).toBe("Moderate fit"));
  it("under 50 is Stretch", () => expect(fitLabelFor(49)).toBe("Stretch"));
  it("must-haves weigh 3x nice-to-haves", () =>
    expect(scoreRequirements([req({ verdict: "met" }), req({ importance: "nice", verdict: "missing" })])).toBe(75));
  it("partial counts half", () => expect(scoreRequirements([req({ verdict: "partial" })])).toBe(50));
  it("evidence not in resume is downgraded to missing", () =>
    expect(verifyRequirements([req({ evidence: "led a Series B deal" })], "analyst at a bank").at(0)?.verdict).toBe("missing"));
  it("real resume quotes keep their verdict", () =>
    expect(verifyRequirements([req({ evidence: "analyst at a bank" })], "Analyst at a bank, 2 years").at(0)?.verdict).toBe("met"));
});
