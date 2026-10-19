// Postings now live in the database (see src/lib/postings.ts). This file keeps the shared types.
export type RoleType = "Full-time" | "Summer internship" | "In-semester internship" | "Fellowship";
export type FirmType = "VC" | "Growth equity" | "CVC" | "Studio" | "Accelerator";

export interface Job {
  id: string;
  firm: string;
  title: string;
  location: string;
  firmType: string;
  focus: string; // blank if not stated
  sectors: string[];
  roleType: string;
  datePosted: string; // YYYY-MM-DD (posted or first seen)
  deadline: string; // YYYY-MM-DD, blank if none
  rolling: boolean;
  url: string;
  nyc: boolean;
  mentionsMba: boolean;
  expired: boolean;
  lastVerified: string; // ISO timestamp
  needsReview: boolean;
  reviewReason: string;
  lastChecked: string; // ISO timestamp, blank if never
}

export function isNew(job: Pick<Job, "datePosted">, now: Date) {
  const posted = new Date(job.datePosted + "T00:00:00-04:00").getTime();
  // A posting dated "today" (midnight ET) must count as new all day, so allow
  // the date to be up to 24h ahead of now before calling it future-dated.
  return now.getTime() - posted <= 24 * 3600 * 1000 * 1.5 && posted - now.getTime() <= 24 * 3600 * 1000;
}
