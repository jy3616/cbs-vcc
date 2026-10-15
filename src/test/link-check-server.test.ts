import { describe, it, expect, vi, beforeEach } from "vitest";

type CapturedUpdate = { id: string; last_verified_at?: string; needs_review?: boolean; review_reason?: string };
const updates: CapturedUpdate[] = [];

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: [
              { id: "ok", url: "https://a.com/ok", needs_review: false },
              { id: "bad", url: "https://a.com/bad", needs_review: false },
            ],
            error: null,
          }),
      }),
      update: (u: Omit<CapturedUpdate, "id">) => ({
        eq: (_col: string, id: string) => {
          updates.push({ id, ...u });
          return Promise.resolve({ error: null });
        },
      }),
    }),
  },
}));

vi.mock("@/lib/link-check", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/link-check")>();
  return {
    ...actual,
    checkLink: vi.fn(async (url: string) =>
      url.includes("bad") ? { flag: true, reason: "Link returns 404 page not found" } : { flag: false, reason: "" },
    ),
  };
});

import { runLinkCheck } from "@/lib/link-check.server";

describe("hourly link check", () => {
  beforeEach(() => updates.splice(0));

  it("re-stamps Last verified only on links that pass, and only flags failures", async () => {
    const result = await runLinkCheck();
    expect(result).toEqual({ checked: 2, flagged: 1 });

    const ok = updates.find((u) => u.id === "ok")!;
    const bad = updates.find((u) => u.id === "bad")!;
    expect(ok.last_verified_at).toBeTruthy();
    expect(ok.needs_review).toBeUndefined();
    expect(bad.last_verified_at).toBeUndefined();
    expect(bad.needs_review).toBe(true);
    expect(bad.review_reason).toBe("Link returns 404 page not found");
  });
});
