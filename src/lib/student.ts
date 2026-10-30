export const STUDENT_DOMAIN = 'gsb.columbia.edu';
export function isStudentEmail(email: string | undefined | null) { return /^[^\s@]+@gsb\.columbia\.edu$/i.test(email?.trim() ?? ''); }
export const APPLICATION_STATUSES = ['Interested','Applied','Interviewing','Offer','Closed'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export const FUND_STAGES = ['pre-seed','seed','Series A','growth','multi-stage'];
export function postedDays(date: string, today: string) { return Math.max(0,Math.floor((Date.parse(today)-Date.parse(date))/86400000)); }
