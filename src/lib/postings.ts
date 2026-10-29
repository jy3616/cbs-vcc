import { queryOptions, useQuery } from "@tanstack/react-query";
import { getBoardData } from './board.functions';
import type { Database } from "@/integrations/supabase/types";
import type { Job } from "@/data/jobs";

type Row = Database["public"]["Tables"]["postings"]["Row"];

export function rowToJob(r: Row): Job {
  return {
    id: r.id, firm: r.firm, title: r.title, location: r.location, firmType: r.firm_type, focus: r.focus,
    sectors: r.sectors, roleType: r.role_type, datePosted: r.date_posted, deadline: r.deadline ?? "",
    rolling: r.rolling, url: r.url, nyc: r.nyc, mentionsMba: r.mentions_mba, expired: r.expired,
    lastVerified: r.last_verified_at, needsReview: r.needs_review, reviewReason: r.review_reason,
    lastChecked: r.last_checked_at ?? "",
  };
}

export const postingsQuery = queryOptions({
  queryKey: ["postings"],
  queryFn: async () => {
    const data = await getBoardData();
    return data.postings.map(rowToJob);
  },
});

export const verificationQuery = queryOptions({
  queryKey: ['verification-run'],
  queryFn: async () => (await getBoardData()).lastVerified,
  staleTime: 60000,
});

export function usePostings() {
  return useQuery(postingsQuery);
}

export const fmtDay = (d: string) =>
  d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
