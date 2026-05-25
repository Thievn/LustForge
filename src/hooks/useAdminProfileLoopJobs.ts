import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileLoopJobStillMatch } from "@/lib/matchProfileLoopJobToStill";

/** Completed profile-loop jobs for a companion (admin — any owner). */
export function useAdminProfileLoopJobs(companionId: string | undefined) {
  return useQuery({
    queryKey: ["admin-profile-loop-jobs", companionId],
    enabled: Boolean(companionId),
    queryFn: async (): Promise<ProfileLoopJobStillMatch[]> => {
      const { data, error } = await supabase
        .from("profile_loop_video_jobs")
        .select("public_url, context")
        .eq("companion_id", companionId!)
        .eq("status", "complete")
        .not("public_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as ProfileLoopJobStillMatch[];
    },
  });
}
