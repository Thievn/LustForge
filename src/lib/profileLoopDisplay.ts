import type { DbCompanion } from "@/hooks/useCompanions";
import {
  isEligibleLoopPortraitVideoUrl,
  isLoopVideoStorageUrl,
  profileAnimatedPortraitUrl,
  stablePortraitDisplayUrl,
} from "@/lib/companionMedia";
import type { CompanionDisplayOverrideRow } from "@/lib/mergeCompanionDisplayOverride";

/** Same rules as profile hero + merge — extensionless https when loop is enabled. */
export function profileLoopPlaybackEligible(
  url: string | null | undefined,
  profileLoopVideoEnabled: boolean,
): boolean {
  return isEligibleLoopPortraitVideoUrl(url, profileLoopVideoEnabled);
}

export function resolveProfileLoopVideoSrc(
  animatedUrl: string | null | undefined,
): string | null {
  const raw = animatedUrl?.trim();
  if (!raw) return null;
  return stablePortraitDisplayUrl(raw) ?? raw;
}

export type ProfileLoopDisplayState = {
  animatedPortrait: string | undefined;
  loopVideoSrc: string | null;
  showLoopVideo: boolean;
  loopVideoActive: boolean;
};

/**
 * Single read path for profile/chat loop playback after merge.
 */
export function resolveProfileLoopDisplayState(
  db: DbCompanion | null | undefined,
  options?: { playbackFailed?: boolean },
): ProfileLoopDisplayState {
  const animatedPortrait = profileAnimatedPortraitUrl(db ?? undefined);
  const loopVideoSrc = resolveProfileLoopVideoSrc(animatedPortrait);
  const loopFlag = db?.profile_loop_video_enabled;
  const loopUrlLooksLikeVideo = Boolean(
    loopVideoSrc && isLoopVideoStorageUrl(loopVideoSrc),
  );
  // Legacy rows: loop URL saved but flag never set — play unless user explicitly disabled.
  const enabled = loopFlag === true || (loopFlag !== false && loopUrlLooksLikeVideo);
  const showLoopVideo = Boolean(
    enabled && loopVideoSrc && profileLoopPlaybackEligible(loopVideoSrc, true),
  );
  const loopVideoActive = Boolean(showLoopVideo && !options?.playbackFailed);
  return { animatedPortrait, loopVideoSrc, showLoopVideo, loopVideoActive };
}

/** Lightbox: prefer loop MP4 when active; else non-video animated; else undefined. */
export function profileLoopLightboxAnimated(
  db: DbCompanion | null | undefined,
): string | undefined {
  const { showLoopVideo, animatedPortrait } = resolveProfileLoopDisplayState(db);
  if (!animatedPortrait) return undefined;
  if (showLoopVideo) return animatedPortrait;
  if (!isLoopVideoStorageUrl(animatedPortrait)) return animatedPortrait;
  return undefined;
}

/** Heal/sync when DB says loop should play but merged state has no eligible src. */
export function shouldAttemptProfileLoopHeal(input: {
  userId: string | undefined;
  companionId: string | undefined;
  dbDisplay: DbCompanion | null | undefined;
  override: CompanionDisplayOverrideRow | null | undefined;
  baseDb: DbCompanion | null | undefined;
  loopVideoSrc: string | null;
  galleryHasLoopVideo?: boolean;
}): boolean {
  if (!input.userId || !input.companionId) return false;
  const hasEligible = Boolean(
    input.loopVideoSrc && profileLoopPlaybackEligible(input.loopVideoSrc, true),
  );
  if (hasEligible) return false;
  const intent = Boolean(
    input.dbDisplay?.profile_loop_video_enabled ||
      input.override?.profile_loop_video_enabled ||
      input.baseDb?.profile_loop_video_enabled ||
      input.galleryHasLoopVideo,
  );
  return intent;
}

export type GalleryLoopRow = {
  image_url: string;
  is_video?: boolean | null;
};

/** Loop MP4 exists in gallery but not yet on profile row — still play while sync catches up. */
export function enrichCompanionWithGalleryLoop(
  db: DbCompanion | null,
  gallery: GalleryLoopRow[],
): DbCompanion | null {
  if (!db?.id) return db;
  const existing = db.animated_image_url?.trim();
  if (existing && profileLoopPlaybackEligible(existing, true)) return db;
  for (const row of gallery) {
    if (!row.is_video) continue;
    const url = row.image_url?.trim();
    if (!url) continue;
    const looksLikeLoop =
      isLoopVideoStorageUrl(url) || /\.(mp4|webm|mov)(\?|$)/i.test(url);
    if (!looksLikeLoop) continue;
    return {
      ...db,
      animated_image_url: stablePortraitDisplayUrl(url) ?? url,
      profile_loop_video_enabled: true,
    };
  }
  return db;
}
