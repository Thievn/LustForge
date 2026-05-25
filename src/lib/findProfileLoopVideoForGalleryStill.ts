import { supabase } from "@/integrations/supabase/client";
import { isLoopVideoStorageUrl, portraitUrlsEquivalent, stablePortraitDisplayUrl } from "@/lib/companionMedia";

type ProfileLoopJobRow = {
  public_url: string | null;
  status: string | null;
  context: unknown;
};

/**
 * Finds a completed profile-loop MP4 generated from this gallery still (user-private).
 * Matches job context: sourceGenId, sourceGalleryStillUrl, or sourceImageUrl.
 */
export async function findProfileLoopVideoForGalleryStill(args: {
  userId: string;
  companionId: string;
  stillUrl: string;
  generatedImageId?: string;
}): Promise<{ loopUrl: string | null; queryOk: boolean }> {
  const still = stablePortraitDisplayUrl(args.stillUrl) ?? args.stillUrl.trim();
  const genId = args.generatedImageId?.trim() ?? "";

  const { data, error } = await supabase
    .from("profile_loop_video_jobs")
    .select("public_url, status, context")
    .eq("user_id", args.userId)
    .eq("companion_id", args.companionId)
    .eq("status", "complete")
    .not("public_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return { loopUrl: null, queryOk: false };
  }

  for (const row of (data ?? []) as ProfileLoopJobRow[]) {
    const pub = row.public_url?.trim() ?? "";
    if (!pub || !isLoopVideoStorageUrl(pub)) continue;

    const ctx =
      row.context && typeof row.context === "object" && !Array.isArray(row.context)
        ? (row.context as Record<string, unknown>)
        : {};

    const srcGallery =
      typeof ctx.sourceGalleryStillUrl === "string" && ctx.sourceGalleryStillUrl.trim()
        ? ctx.sourceGalleryStillUrl.trim()
        : "";
    const srcImage =
      typeof ctx.sourceImageUrl === "string" && ctx.sourceImageUrl.trim() ? ctx.sourceImageUrl.trim() : "";
    const srcGenId = typeof ctx.sourceGenId === "string" && ctx.sourceGenId.trim() ? ctx.sourceGenId.trim() : "";

    const matchByGenId = Boolean(genId && srcGenId && srcGenId === genId);
    const matchByGallery = Boolean(srcGallery && portraitUrlsEquivalent(srcGallery, still));
    const matchBySourceImage = Boolean(srcImage && portraitUrlsEquivalent(srcImage, still));

    if (matchByGenId || matchByGallery || matchBySourceImage) {
      return { loopUrl: stablePortraitDisplayUrl(pub) ?? pub, queryOk: true };
    }
  }

  return { loopUrl: null, queryOk: true };
}
