import { describe, it, expect } from "vitest";
import { portraitUrlsEquivalent } from "@/lib/companionMedia";

/** Mirrors client job-context matching in findProfileLoopVideoForGalleryStill. */
function jobMatchesStill(
  ctx: Record<string, unknown>,
  stillUrl: string,
  generatedImageId?: string,
): boolean {
  const genId = generatedImageId?.trim() ?? "";
  const srcGallery =
    typeof ctx.sourceGalleryStillUrl === "string" && ctx.sourceGalleryStillUrl.trim()
      ? ctx.sourceGalleryStillUrl.trim()
      : "";
  const srcImage =
    typeof ctx.sourceImageUrl === "string" && ctx.sourceImageUrl.trim() ? ctx.sourceImageUrl.trim() : "";
  const srcGenId = typeof ctx.sourceGenId === "string" && ctx.sourceGenId.trim() ? ctx.sourceGenId.trim() : "";

  if (genId && srcGenId && srcGenId === genId) return true;
  if (srcGallery && portraitUrlsEquivalent(srcGallery, stillUrl)) return true;
  if (srcImage && portraitUrlsEquivalent(srcImage, stillUrl)) return true;
  return false;
}

describe("profile loop job ↔ gallery still matching", () => {
  const still = "https://cdn.example/stills/a.jpg";

  it("matches by sourceGenId", () => {
    expect(jobMatchesStill({ sourceGenId: "gen-1" }, still, "gen-1")).toBe(true);
  });

  it("matches by sourceGalleryStillUrl", () => {
    expect(jobMatchesStill({ sourceGalleryStillUrl: still }, still)).toBe(true);
  });

  it("matches by sourceImageUrl when loop was from current portrait", () => {
    expect(jobMatchesStill({ sourceImageUrl: still }, still)).toBe(true);
  });

  it("does not match unrelated still", () => {
    expect(jobMatchesStill({ sourceGalleryStillUrl: "https://cdn.example/other.jpg" }, still)).toBe(false);
  });
});
