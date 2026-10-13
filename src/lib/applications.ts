import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/data/jobs";

/** Only signed-in users can mark or unmark a posting as applied. */
export function canTrackApplications(user: Pick<User, "id"> | null | undefined): boolean {
  return !!user?.id;
}

export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const applicationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["applications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, job_url, firm, title, applied_at")
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export function useApplications(userId: string | undefined) {
  return useQuery({ ...applicationsQuery(userId ?? ""), enabled: !!userId });
}

export function useToggleApplied(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ job, applied }: { job: Pick<Job, "url" | "firm" | "title">; applied: boolean }) => {
      if (!canTrackApplications(userId ? { id: userId } : null)) throw new Error("Sign in to track applications");
      if (applied) {
        const { error } = await supabase.from("applications").delete().eq("job_url", job.url);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("applications")
          .insert({ job_url: job.url, firm: job.firm, title: job.title });
        if (error) throw error;
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["applications", userId] }),
  });
}
