import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Daily new-job discovery, called by the scheduler.
export const Route = createFileRoute("/api/public/jobs/discover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { runDiscovery } = await import("@/lib/discover.server");
        return Response.json({ ok: true, ...(await runDiscovery()) });
      },
    },
  },
});
