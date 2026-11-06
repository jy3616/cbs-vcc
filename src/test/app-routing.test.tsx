import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("keeps the job board outside the student sign-in gate", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/").map(match => match.routeId)).toEqual([rootRouteId, "/"]);
  });

  it("allows public job details without the student gate", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/jobs/example").map(match => match.routeId)).toEqual([rootRouteId, "/jobs/$slug"]);
  });

  it("keeps accounts, resumes and admin tools behind student sign-in", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const path of ["/account", "/my-resume", "/admin", "/bookmarks", "/my-applications"]) {
      expect(router.matchRoutes(path).map(match => match.routeId)).toContain("/_authenticated");
    }
  });

  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches real pages for /bookmarks and /my-resume", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    for (const path of ["/bookmarks", "/my-resume"]) {
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    }
  });
});
