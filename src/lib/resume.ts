import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FitResult } from "./fit";

export const resumeQuery = (userId: string) =>
  queryOptions({
    queryKey: ["resume", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("resumes").select("content, updated_at").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const analysesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["analyses", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_analyses").select("job_url, fit_score, result, created_at");
      if (error) throw error;
      return (data ?? []).map((a) => ({ ...a, result: a.result as unknown as FitResult }));
    },
  });

export function useAnalyses(userId: string | undefined) {
  return useQuery({ ...analysesQuery(userId ?? ""), enabled: !!userId });
}
