import { describe, it, expect } from "vitest";
import { fitLabelFor, normalizeFit } from "@/lib/fit";
describe("fit labels", () => {
  it("75+ is Strong fit", () => expect(fitLabelFor(75)).toBe("Strong fit"));
  it("50-74 is Moderate fit", () => expect(fitLabelFor(74)).toBe("Moderate fit"));
  it("under 50 is Stretch", () => expect(fitLabelFor(49)).toBe("Stretch"));
  it("clamps score to 0-100", () => {
    const r = normalizeFit({ fitScore: 130, fitLabel: "", strengths: [], gaps: [], resumeTips: [], behavioralQuestions: [], technicalQuestions: [] });
    expect(r.fitScore).toBe(100);
  });
});
