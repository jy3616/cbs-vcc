import { describe, expect, it } from "vitest";
import { canTrackApplications } from "@/lib/applications";

describe("application tracking", () => {
  it("is blocked for signed-out visitors", () => {
    expect(canTrackApplications(null)).toBe(false);
  });
  it("is allowed for signed-in users", () => {
    expect(canTrackApplications({ id: "u1" })).toBe(true);
  });
});
