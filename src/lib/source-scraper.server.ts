import { readSource } from './source-scraper';
import { todayET } from './status';

/** One independent invocation per source keeps the scheduler's short callbacks bounded. */
export async function runSourceScrape(sourceId: string) {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: source, error } = await db.from('sources').select('*').eq('id', sourceId).eq('active', true).single();
  if (error) throw error;
  const { data: runId, error: claimError } = await db.rpc('claim_source_scrape', { p_source: sourceId, p_date: todayET() });
  if (claimError) throw claimError;
  if (!runId) return { skipped: 'Source already checked today or inactive' };
  let jobs: Awaited<ReturnType<typeof readSource>> = [];
  let failure = '';
  try { jobs = await readSource(source); } catch (err) { failure = err instanceof Error ? err.message : String(err); }
  const { data: result, error: finishError } = await db.rpc('finish_source_scrape', { p_run: runId, p_source: sourceId, p_jobs: jobs, p_error: failure });
  if (finishError) throw finishError;
  return result;
}