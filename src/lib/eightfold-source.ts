import { z } from 'zod';
import { investmentRole, type SourceJob } from './source-scraper';

// An exact ventures query covers this CVC team's public listings, not the parent's engineering jobs.
export function parseAppliedVentures(payload: unknown): SourceJob[] {
  const data = z.object({ data: z.object({ count: z.number().int().nonnegative(), positions: z.array(z.object({
    id: z.number(), name: z.string(), positionUrl: z.string(), department: z.string().optional(), locations: z.array(z.string()),
  })) }) }).parse(payload).data;
  if (data.count > data.positions.length) throw new Error('Incomplete Applied Ventures results; existing postings preserved');
  return data.positions.filter(row => investmentRole(row.name, row.department)).map(row => ({
    id: String(row.id), title: row.name, url: new URL(row.positionUrl, 'https://careers.appliedmaterials.com').href,
    location: row.locations.join(' / '), nyc: /new york|\bnyc\b/i.test(row.locations.join(' ')), mentionsMba: false,
    roleType: /summer/i.test(row.name) ? 'Summer internship' : /intern/i.test(row.name) ? 'In-semester internship' : 'Full-time',
  }));
}