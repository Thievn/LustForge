import { isLoopVideoStorageUrl, portraitUrlsEquivalent, stablePortraitDisplayUrl } from "@/lib/companionMedia";

export type ProfileLoopJobStillMatch = {
  public_url: string | null;
  context: unknown;
};

/** True when a completed profile-loop job was generated from this gallery still. */
export function profileLoopJobMatchesStill(
  job: ProfileLoopJobStillMatch,
  stillUrl: string,
  generatedImageId?: string,
): boolean {
  const still = stablePortraitDisplayUrl(stillUrl) ?? stillUrl.trim();
  const pub = job.public_url?.trim() ?? "";
  if (!pub || !isLoopVideoStorageUrl(pub)) return false;

  const ctx =
    job.context && typeof job.context === "object" && !Array.isArray(job.context)
      ? (job.context as Record<string, unknown>)
      : {};

  const srcGallery =
    typeof ctx.sourceGalleryStillUrl === "string" && ctx.sourceGalleryStillUrl.trim()
      ? ctx.sourceGalleryStillUrl.trim()
      : "";
  const srcImage =
    typeof ctx.sourceImageUrl === "string" && ctx.sourceImageUrl.trim() ? ctx.sourceImageUrl.trim() : "";
  const srcGenId = typeof ctx.sourceGenId === "string" && ctx.sourceGenId.trim() ? ctx.sourceGenId.trim() : "";
  const genId = generatedImageId?.trim() ?? "";

  if (genId && srcGenId && srcGenId === genId) return true;
  if (srcGallery && portraitUrlsEquivalent(srcGallery, still)) return true;
  if (srcImage && portraitUrlsEquivalent(srcImage, still)) return true;
  return false;
}

export function resolveProfileLoopUrlForStill(
  jobs: ProfileLoopJobStillMatch[],
  stillUrl: string,
  generatedImageId?: string,
): string | null {
  for (const job of jobs) {
    if (!profileLoopJobMatchesStill(job, stillUrl, generatedImageId)) continue;
    const pub = job.public_url?.trim() ?? "";
    if (!pub) continue;
    return stablePortraitDisplayUrl(pub) ?? pub;
  }
  return null;
}
