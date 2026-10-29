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
        const parsed = z.object({ sourceId: z.uuid(), scheduled: z.boolean().optional() }).safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: 'A valid sourceId is required' }, { status: 400 });
        // Two UTC windows cover daylight-saving changes; only the 6am ET window runs.
        if (parsed.data.scheduled && new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hourCycle: 'h23' }).format(new Date()) !== '06') {
          return Response.json({ ok: true, skipped: 'Outside 6am New York window' });
        }
        const { runSourceScrape } = await import('@/lib/source-scraper.server');
        return Response.json({ ok: true, result: await runSourceScrape(parsed.data.sourceId) });
      },
    },
  },
});
