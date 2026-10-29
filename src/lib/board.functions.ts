import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/** Anonymous public reads: no account/session dependency and no privileged client. */
export const getBoardData = createServerFn({ method: 'GET' }).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error('Job board connection is not configured');
  const db = createClient<Database>(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_')) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
  const [postings, run] = await Promise.all([
    db.from('postings').select('*').order('date_posted', { ascending: false }),
    db.from('scrape_runs').select('ended_at').in('status', ['success', 'partial']).gt('sources_succeeded', 0).not('ended_at', 'is', null).order('ended_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (postings.error) throw new Error(`Job board could not load: ${postings.error.message}`);
  if (run.error) throw new Error(`Verification history could not load: ${run.error.message}`);
  return { postings: postings.data, lastVerified: run.data?.ended_at ?? null };
});