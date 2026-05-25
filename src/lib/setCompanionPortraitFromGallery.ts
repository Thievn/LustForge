import { supabase } from "@/integrations/supabase/client";
import { isLoopVideoStorageUrl, portraitUrlsEquivalent, stablePortraitDisplayUrl } from "@/lib/companionMedia";
import { findProfileLoopVideoForGalleryStill } from "@/lib/findProfileLoopVideoForGalleryStill";
import type { SetPortraitFromGalleryOptions } from "@/lib/setPortraitFromGalleryTypes";

export type SetCompanionPortraitResult = {
  portraitUrl: string;
  loopUrl: string | null;
  loopEnabled: boolean;
};

/**
 * Sets the companion still portrait for **this signed-in user only** (profile + chat hero).
 * Writes `user_companion_portrait_overrides` keyed by `(user_id, companion_id)` — other accounts,
 * Discover tiles, and the Hall of cards canonical row are unchanged.
 *
 * When a profile loop was generated from this gallery still, that MP4 is attached automatically.
 * Switching to a different still clears a mismatched loop (no card loop over a chat still).
 */
export async function setCompanionPortraitFromGalleryUrl(args: {
  userId: string;
  companionId: string;
  imageUrl: string;
  options?: SetPortraitFromGalleryOptions;
  /**
   * Card canonical loop — used only when `options.isCardArt` and no job matches this still.
   */
  fallbackLoopVideoUrl?: string | null;
  fallbackLoopVideoEnabled?: boolean;
}): Promise<SetCompanionPortraitResult> {
  const { userId, companionId, imageUrl, options, fallbackLoopVideoUrl, fallbackLoopVideoEnabled } = args;
  const stable = stablePortraitDisplayUrl(imageUrl) ?? imageUrl.trim();
  const isCardArt = Boolean(options?.isCardArt);

  const { data: existing } = await supabase
    .from("user_companion_portrait_overrides")
    .select("portrait_url, animated_portrait_url, profile_loop_video_enabled")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .maybeSingle();

  const existingPortrait =
    typeof existing?.portrait_url === "string" ? stablePortraitDisplayUrl(existing.portrait_url) ?? existing.portrait_url : "";
  const existingAnim = typeof existing?.animated_portrait_url === "string" ? existing.animated_portrait_url.trim() : "";
  const sameStillReselected = Boolean(existingPortrait && portraitUrlsEquivalent(existingPortrait, stable));

  let animatedToStore: string | null = null;
  let loopEnabledToStore = false;

  if (
    sameStillReselected &&
    existingAnim &&
    isLoopVideoStorageUrl(existingAnim) &&
    Boolean(existing?.profile_loop_video_enabled)
  ) {
    animatedToStore = existingAnim;
    loopEnabledToStore = true;
  } else {
    const { loopUrl } = await findProfileLoopVideoForGalleryStill({
      userId,
      companionId,
      stillUrl: stable,
      generatedImageId: options?.generatedImageId,
    });

    if (loopUrl) {
      animatedToStore = loopUrl;
      loopEnabledToStore = true;
    } else if (isCardArt) {
      const fallback = typeof fallbackLoopVideoUrl === "string" ? fallbackLoopVideoUrl.trim() : "";
      if (fallback && isLoopVideoStorageUrl(fallback)) {
        animatedToStore = fallback;
        loopEnabledToStore = Boolean(fallbackLoopVideoEnabled ?? true);
      }
    }
  }

  const { error } = await supabase.from("user_companion_portrait_overrides").upsert(
    {
      user_id: userId,
      companion_id: companionId,
      portrait_url: stable,
      animated_portrait_url: animatedToStore,
      profile_loop_video_enabled: loopEnabledToStore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,companion_id" },
  );
  if (error) throw error;

  return {
    portraitUrl: stable,
    loopUrl: loopEnabledToStore ? animatedToStore : null,
    loopEnabled: loopEnabledToStore,
  };
}
