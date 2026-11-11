// The slim entry excludes Node-only HTTP/stream dependencies on published Workers.
import { load } from 'cheerio/slim';
import { z } from 'zod';
import { isAssociatePosition } from './job-eligibility';

export type Source = { id: string; firm_name: string; careers_url: string; ats_type: string; ats_board: string };
export type SourceJob = { id: string; title: string; url: string; location: string; nyc: boolean; mentionsMba: boolean; roleType: string };
export const roleKey = (firm: string, title: string) => `${firm}|${title}`.toLowerCase().replace(/[^a-z0-9|]+/g, '');
export const isLinkedIn = (url: string) => { try { return /(^|\.)linkedin\.com$/i.test(new URL(url).hostname); } catch { return true; } };

export function investmentRole(title: string, department = '') {
  if (/engineer|sales|account executive|software|developer|recruit|human resources|talent sourcing|legal|compliance|accounting|finance operations|financial planning|fund operations|IT support|data scientist|executive assistant|product manager|secondary investments|primary investments|talent network/i.test(title)) return false;
  if (!isAssociatePosition(title)) return false;
  // Generic seniority alone is insufficient on mixed firm/portfolio boards.
  return /invest|venture|growth|portfolio management|life sciences|asset selection|scout|platform/i.test(`${title} ${department}`);
}

const text = (html: string) => load(html).text().replace(/\s+/g, ' ').trim();
const job = (id: string, title: string, url: string, location: string, description: string): SourceJob => ({
  id, title, url, location, nyc: /new york|\bnyc\b|manhattan/i.test(location), mentionsMba: /\bMBA\b/i.test(description),
  roleType: /summer/i.test(title) ? 'Summer internship' : /intern/i.test(title) ? 'In-semester internship' : /scout/i.test(title) ? 'Fellowship' : 'Full-time',
});
const arr = z.array(z.record(z.string(), z.unknown()));
const str = (v: unknown) => typeof v === 'string' ? v : '';

export function parseAts(source: Source, payload: unknown): SourceJob[] {
  const root = z.record(z.string(), z.unknown()).safeParse(payload);
  const rows = arr.parse(source.ats_type === 'Lever' ? payload : root.success ? root.data['jobs'] : undefined);
  const output: SourceJob[] = [];
  for (const r of rows) {
    const title = str(r['title'] ?? r['text']);
    const departments = Array.isArray(r['departments']) ? r['departments'].map(d => str((d as { name?: unknown }).name)).join(' ') : str(r['department']);
    const categories = r['categories'] as { team?: string; location?: string } | undefined;
    if (!investmentRole(title, departments || categories?.team || '')) continue;
    const url = str(r['absolute_url'] ?? r['hostedUrl'] ?? r['jobUrl']);
    if (!url.startsWith('https://') || isLinkedIn(url)) continue;
    const loc = typeof r['location'] === 'object' && r['location'] ? str((r['location'] as { name?: unknown }).name) : str(r['location']) || categories?.location || '';
    const secondary = Array.isArray(r['secondaryLocations']) ? r['secondaryLocations'].map(l => str((l as { location?: unknown }).location)).filter(Boolean) : [];
    output.push(job(String(r['id'] ?? url), title, url, [loc, ...secondary].filter(Boolean).join(' / '), text(str(r['content'] ?? r['descriptionHtml'] ?? r['description']))));
  }
  return output;
}

export function parseHtml(source: Source, html: string): SourceJob[] {
  const $ = load(html);
  if (/captcha|access denied|verify you are human/i.test($('title').text())) throw new Error('Careers page blocked the check');
  const pagination = $.text().match(/Search Results Page\s+\d+\s+of\s+(\d+)/i);
  if (pagination && Number(pagination[1]) > 1) throw new Error('Incomplete paginated job list; existing postings preserved');
  const output: SourceJob[] = [];
  let structured = false;
  $('script[type="application/ld+json"]').each((_, node) => {
    try {
      const parsed = JSON.parse($(node).text());
      const list = Array.isArray(parsed) ? parsed : parsed['@graph'] ?? [parsed];
      for (const r of list) if (r['@type'] === 'JobPosting') {
        structured = true;
        const title = str(r['title']);
        if (!investmentRole(title, str(r.occupationalCategory))) continue;
        const url = new URL(str(r.url) || source.careers_url, source.careers_url).href;
        if (!url.startsWith('https://') || isLinkedIn(url)) continue;
        const locations = Array.isArray(r.jobLocation) ? r.jobLocation : [r.jobLocation];
        const location = locations.map((place: { address?: { addressLocality?: unknown } } | undefined) => str(place?.address?.addressLocality)).filter(Boolean).join(' / ');
        output.push(job(url, title, url, location, text(str(r['description']))));
      }
    } catch { /* A malformed unrelated JSON-LD block is not a jobs list. */ }
  });
  $('a[href]').each((_, node) => {
    const anchor = $(node);
    const title = (anchor.find('h2, h3').first().text() || anchor.text()).replace(/\s+/g, ' ').trim();
    const item = anchor.closest('.iCIMS_JobCardItem, .list-group-item, [data-slot="card-content"]');
    const description = item.find('.description').text();
    // Breezy titles omit the investment department on this dedicated firm board.
    const department = source.firm_name === 'Yamaha Motor Ventures' ? 'Venture investment' : description;
    if (title.length > 160 || !investmentRole(title, department)) return;
    const href = $(node).attr('href');
    if (!href) return;
    try {
      const url = new URL(href, source.careers_url).href;
      if (isLinkedIn(url) || !url.startsWith('https://') || url === source.careers_url || /#|mailto:/i.test(href)) return;
      const location = anchor.find('.location').text().trim() || item.find('.header.left > span:not(.field-label)').text().trim() || item.find('.list-group-item-text > li').first().text().trim() || item.find('p').last().text().trim();
      output.push(job(url, title, url, location, description));
    } catch { /* Ignore invalid links. */ }
  });
  if (!output.length && !structured && !/no (current |open |available )?(positions|openings|vacancies|jobs)|not (currently )?hiring/i.test($.text())) {
    throw new Error('No complete job list detected; manual review needed (existing postings preserved)');
  }
  return output;
}

export function sourceEndpoint(source: Source) {
  if (source.firm_name === 'Applied Ventures' && new URL(source.careers_url).hostname === 'careers.appliedmaterials.com') {
    return 'https://app.eightfold.ai/api/pcsx/search?domain=appliedmaterials.com&query=ventures&location=&start=0';
  }
  const board = encodeURIComponent(source.ats_board);
  if (source.ats_type !== 'HTML' && !board) throw new Error('ATS board identifier needs review');
  switch (source.ats_type) {
    case 'Greenhouse': return `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
    case 'Lever': return `https://api.lever.co/v0/postings/${board}?mode=json`;
    case 'Ashby': return `https://api.ashbyhq.com/posting-api/job-board/${board}`;
    default: return source.careers_url;
  }
}

export async function readSource(source: Source): Promise<SourceJob[]> {
  const endpoint = sourceEndpoint(source);
  if (isLinkedIn(endpoint)) throw new Error('LinkedIn is excluded');
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(2800), redirect: 'follow' });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  if (isLinkedIn(response.url || endpoint)) throw new Error('Source redirects to LinkedIn; excluded');
  const jobs = endpoint.startsWith('https://app.eightfold.ai/api/pcsx/search?')
    ? (await import('./eightfold-source')).parseAppliedVentures(await response.json())
    : source.ats_type === 'HTML' ? parseHtml(source, await response.text()) : parseAts(source, await response.json());
  return Array.from(new Map(jobs.map(j => [roleKey(source.firm_name, j.title), j])).values());
}