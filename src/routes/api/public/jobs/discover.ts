import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { z } from 'zod';

// Daily new-job discovery, called by the scheduler.
export const Route = createFileRoute("/api/public/jobs/discover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const parsed = z.object({ sourceId: z.uuid() }).safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: 'A valid sourceId is required' }, { status: 400 });
        const { runSourceScrape } = await import('@/lib/source-scraper.server');
        return Response.json({ ok: true, result: await runSourceScrape(parsed.data.sourceId) });
      },
    },
  },
});
