import { describe, it, expect, vi, afterEach } from 'vitest';
import { investmentRole, parseAts, parseHtml, readSource, roleKey, sourceEndpoint } from '@/lib/source-scraper';
const source = { id: 'source', firm_name: 'Firm', careers_url: 'https://firm.test/careers', ats_type: 'Greenhouse', ats_board: 'firm' };
describe('investment-only source checks', () => {
  it.each(['Analyst', 'Associate', 'Senior Associate', 'Principal', 'Vice President', 'MBA Intern', 'Summer Associate', 'Investment Team', 'Platform', 'Scout'])('keeps %s on an investment team', title => expect(investmentRole(title, 'Investment')).toBe(true));
  it.each(['Software Engineer', 'Sales Associate', 'Account Executive', 'Legal Associate', 'Fund Operations Analyst'])('excludes %s', title => expect(investmentRole(title, 'Investment')).toBe(false));
  it('does not accept a portfolio-company generic associate', () => expect(investmentRole('Associate', 'Customer Service')).toBe(false));
  it('normalizes firm and title for duplicates', () => expect(roleKey('Firm VC', 'Senior Associate')).toBe(roleKey('firm vc', 'Senior-Associate ')));
  it.each(['https://linkedin.com/jobs/1', 'https://www.linkedin.com/jobs/1'])('never fetches LinkedIn %s', async url => {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    await expect(readSource({ ...source, ats_type: 'HTML', careers_url: url })).rejects.toThrow('LinkedIn');
    expect(fetcher).not.toHaveBeenCalled();
  });
  afterEach(() => vi.restoreAllMocks());
  it('uses the public Greenhouse endpoint', () => expect(sourceEndpoint(source)).toBe('https://boards-api.greenhouse.io/v1/boards/firm/jobs?content=true'));
  it('uses the public Lever endpoint', () => expect(sourceEndpoint({ ...source, ats_type: 'Lever' })).toBe('https://api.lever.co/v0/postings/firm?mode=json'));
  it('uses the public Ashby endpoint', () => expect(sourceEndpoint({ ...source, ats_type: 'Ashby' })).toBe('https://api.ashbyhq.com/posting-api/job-board/firm'));
  it('does not treat malformed ATS responses as absent roles', () => expect(() => parseAts(source, { error: 'blocked' })).toThrow());
  it('keeps a verified analyst and excludes sales', () => expect(parseAts(source, { jobs: [
    { id: 1, title: 'Analyst', departments: [{ name: 'Investment' }], absolute_url: 'https://firm.test/1', location: { name: 'New York' } },
    { id: 2, title: 'Sales Associate', absolute_url: 'https://firm.test/2' },
  ] }).map(j => j.title)).toEqual(['Analyst']));
  it('does not treat an unparsed HTML shell as absent roles', () => expect(() => parseHtml(source, '<html><body>Loading</body></html>')).toThrow());
  it('recognizes an explicit empty careers page', () => expect(parseHtml(source, '<p>No open positions</p>')).toEqual([]));
});