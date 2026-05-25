import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminCompanionGalleryRow = {
  id: string;
  user_id: string | null;
  image_url: string;
  prompt: string;
  created_at: string;
  is_video: boolean | null;
};

/** All generated_images for a companion (admin read — any owner). */
export function useAdminCompanionGallery(companionId: string | undefined) {
  return useQuery({
    queryKey: ["admin-companion-gallery", companionId],
    enabled: Boolean(companionId),
    queryFn: async (): Promise<AdminCompanionGalleryRow[]> => {
      const { data, error } = await supabase
        .from("generated_images")
        .select("id, user_id, image_url, prompt, created_at, is_video")
        .eq("companion_id", companionId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AdminCompanionGalleryRow[];
    },
  });
}
