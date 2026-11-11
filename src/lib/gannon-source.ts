import { load } from 'cheerio/slim';
import { investmentRole, isLinkedIn } from './source-scraper';

export type GannonJob = { id: string; firm: string; title: string; url: string; location: string; nyc: boolean; mentionsMba: boolean; roleType: string; datePosted: string };

/** A rolling news feed is not a complete careers list: absence never means closed. */
export function parseGannonFeed(xml: string): GannonJob[] {
  const $ = load(xml, { xmlMode: true });
  if (!$('rss channel').length || !$('channel > title').text().includes('VC Jobs')) throw new Error('Invalid John Gannon job feed; existing postings preserved');
  const jobs: GannonJob[] = [];
  $('item').each((_, item) => {
    const row = $(item);
    const fullTitle = row.children('title').text().trim();
    const firm = row.children('job_listing\\:company').text().trim();
    const location = row.children('job_listing\\:location').text().trim();
    const title = fullTitle.split(' @ ')[0]?.replace(/\bVC\s+/g, 'Investment ').trim() ?? '';
    const url = row.children('link').text().trim();
    const date = new Date(row.children('pubDate').text());
    if (!firm || !location || !title || !Number.isFinite(date.getTime())) throw new Error('Incomplete John Gannon listing; existing postings preserved');
    if (!investmentRole(title, 'Venture investment')) return;
    if (!url.startsWith('https://johngannonblog.com/job/') || isLinkedIn(url)) throw new Error('Unexpected job feed link');
    const description = load(row.children('content\\:encoded').text()).text();
    jobs.push({ id: url, firm, title, url, location, nyc: /new york|\bnyc\b/i.test(location), mentionsMba: /\bMBA\b/i.test(description), roleType: /summer/i.test(title) ? 'Summer internship' : /intern/i.test(title) ? 'In-semester internship' : 'Full-time', datePosted: date.toISOString().slice(0, 10) });
  });
  return jobs;
}

export async function readGannonFeed() {
  const response = await fetch('https://johngannonblog.com/?feed=job_feed', { signal: AbortSignal.timeout(2800) });
  if (!response.ok) throw new Error(`John Gannon feed returned HTTP ${response.status}`);
  const jobs = parseGannonFeed(await response.text());
  const verified = await Promise.all(jobs.map(async job => {
    const detail = await fetch(job.url, { signal: AbortSignal.timeout(2800), redirect: 'follow' });
    if (detail.status === 404) return null;
    if (!detail.ok || isLinkedIn(detail.url || job.url)) throw new Error(`Could not verify John Gannon listing for ${job.firm}; existing postings preserved`);
    const $ = load(await detail.text());
    if (!$('.single_job_listing').length) throw new Error(`Incomplete John Gannon listing for ${job.firm}`);
    if ($('.job-manager-info').text().match(/filled|expired|closed/i)) return null;
    return job;
  }));
  return verified.filter((job): job is GannonJob => job !== null);
}