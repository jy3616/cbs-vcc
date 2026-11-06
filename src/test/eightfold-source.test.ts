import { describe, expect, it } from 'vitest';
import { parseAppliedVentures } from '@/lib/eightfold-source';
describe('Applied Ventures daily feed', () => {
  it('accepts investment associates and excludes legal and engineering jobs', () => {
    const positions = ['Senior Investment Associate', 'Software Engineer', 'Senior Legal Associate'].map((name, id) => ({ id, name, positionUrl: `/careers/job/${id}`, locations: ['Santa Clara, CA'] }));
    expect(parseAppliedVentures({ data: { count: 3, positions } }).map(j => j.title)).toEqual(['Senior Investment Associate']);
  });
  it('preserves existing jobs if the response is not complete', () => expect(() => parseAppliedVentures({ data: { count: 11, positions: [] } })).toThrow('Incomplete'));
  it('rejects failed search responses', () => expect(() => parseAppliedVentures({ error: 'blocked' })).toThrow());
});