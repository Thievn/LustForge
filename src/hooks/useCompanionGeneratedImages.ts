import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CompanionGalleryRow = {
  id: string;
  image_url: string;
  prompt: string;
  created_at: string;
  saved_to_personal_gallery: boolean | null;
  is_video?: boolean | null;
  source_image_url?: string | null;
  gallery_listing?: string | null;
};

export function useCompanionGeneratedImages(companionId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["companion-generated-images", userId, companionId],
    enabled: Boolean(companionId && userId),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<CompanionGalleryRow[]> => {
      const full = await supabase
        .from("generated_images")
        .select("id, image_url, prompt, created_at, saved_to_personal_gallery, is_video, source_image_url, gallery_listing")
        .eq("user_id", userId!)
        .eq("companion_id", companionId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!full.error) return (full.data ?? []) as CompanionGalleryRow[];
      if (!/gallery_listing|source_image_url|column|schema cache/i.test(full.error.message)) throw full.error;
      const basic = await supabase
        .from("generated_images")
        .select("id, image_url, prompt, created_at, saved_to_personal_gallery, is_video")
        .eq("user_id", userId!)
        .eq("companion_id", companionId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (basic.error) throw basic.error;
      return (basic.data ?? []) as CompanionGalleryRow[];
    },
  });
}
