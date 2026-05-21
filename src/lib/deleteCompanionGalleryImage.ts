import { supabase } from "@/integrations/supabase/client";
import { CANONICAL_PORTRAIT_GALLERY_ID_PREFIX } from "@/lib/companionGalleryWithCanonical";

export async function deleteCompanionGalleryImage(args: {
  userId: string;
  companionId: string;
  imageId: string;
}): Promise<void> {
  const { userId, companionId, imageId } = args;
  const id = imageId.trim();
  if (!id || id.startsWith(CANONICAL_PORTRAIT_GALLERY_ID_PREFIX)) {
    throw new Error("This gallery item cannot be deleted.");
  }
  const { error } = await supabase
    .from("generated_images")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("companion_id", companionId);
  if (error) throw error;
}
