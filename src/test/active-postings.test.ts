import { describe, expect, it } from 'vitest';
import { isInactive, postingStatus } from '@/lib/status';

describe('public list always excludes closed postings', () => {
  it('excludes confirmed expired jobs even with rolling deadlines', () => {
    expect(isInactive(postingStatus({ expired: true, rolling: true, deadline: '' }, '2026-11-11'))).toBe(true);
  });
  it('excludes passed deadlines but keeps jobs closing today', () => {
    const postings = [
      { expired: false, rolling: false, deadline: '2026-11-10' },
      { expired: false, rolling: false, deadline: '2026-11-11' },
    ];
    expect(postings.filter(p => !isInactive(postingStatus(p, '2026-11-11')))).toEqual([postings[1]]);
  });
});