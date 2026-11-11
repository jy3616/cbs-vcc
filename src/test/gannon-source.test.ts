import { describe, expect, it } from 'vitest';
import { parseGannonFeed } from '@/lib/gannon-source';

const feed = (title = 'VC Associate @ PagsGroup in Boston, MA', link = 'https://johngannonblog.com/job/associate/') => `<rss xmlns:job_listing="https://johngannonblog.com" xmlns:content="content"><channel><title>VC Jobs &amp; Newsletter</title><item><title>${title}</title><link>${link}</link><pubDate>Tue, 10 Nov 2026 06:20:15 +0000</pubDate><job_listing:company>PagsGroup</job_listing:company><job_listing:location>Boston, MA</job_listing:location><content:encoded><![CDATA[<p>MBA preferred</p>]]></content:encoded></item></channel></rss>`;
describe('John Gannon daily feed', () => {
  it('uses the actual employer and original posting date', () => {
    expect(parseGannonFeed(feed())).toEqual([{ id: 'https://johngannonblog.com/job/associate/', firm: 'PagsGroup', title: 'Investment Associate', url: 'https://johngannonblog.com/job/associate/', location: 'Boston, MA', nyc: false, mentionsMba: true, roleType: 'Full-time', datePosted: '2026-11-10' }]);
  });
  it('excludes finance operations jobs', () => expect(parseGannonFeed(feed('Finance Operations Analyst @ PagsGroup'))).toEqual([]));
  it('never accepts LinkedIn feed links', () => expect(() => parseGannonFeed(feed(undefined, 'https://linkedin.com/jobs/1'))).toThrow('Unexpected'));
  it('fails safely on a blocked or malformed feed', () => expect(() => parseGannonFeed('<html>Blocked</html>')).toThrow('Invalid'));
  it('keeps an explicitly valid empty rolling feed without implying closures', () => expect(parseGannonFeed('<rss><channel><title>VC Jobs &amp; Newsletter</title></channel></rss>')).toEqual([]));
});