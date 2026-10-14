import { createFileRoute } from "@tanstack/react-router";

// Daily link check (called by the scheduler). Requires a bearer token as a stray-traffic filter.
// Safe to replay: it only re-checks real links and raises "Needs review" flags; it never expires or deletes postings.
export const Route = createFileRoute("/api/public/hooks/check-links")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const { runLinkCheck } = await import("@/lib/link-check.server");
        const result = await runLinkCheck();
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
