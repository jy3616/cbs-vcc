import { describe, expect, it } from 'vitest';
import { isAssociatePosition } from '@/lib/job-eligibility';

describe('Associate and Senior Associate posting levels', () => {
  it.each(['Associate', 'Senior Associate', 'Investment Associate', 'Senior Investment Associate', 'Associate, Venture Capital'])('includes %s', title => {
    expect(isAssociatePosition(title)).toBe(true);
  });
  it.each(['Investment Analyst', 'Principal', 'Vice President', 'Associate Director', 'Associate / Analyst', 'Investment Summer Associate', 'Associate Intern', 'Associate Partner'])('excludes %s', title => {
    expect(isAssociatePosition(title)).toBe(false);
  });
});