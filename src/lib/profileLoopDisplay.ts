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
  const enabled = Boolean(db?.profile_loop_video_enabled);
  const animatedPortrait = profileAnimatedPortraitUrl(db ?? undefined);
  const loopVideoSrc = resolveProfileLoopVideoSrc(animatedPortrait);
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
}): boolean {
  if (!input.userId || !input.companionId) return false;
  const hasEligible = Boolean(
    input.loopVideoSrc && profileLoopPlaybackEligible(input.loopVideoSrc, true),
  );
  if (hasEligible) return false;
  const intent = Boolean(
    input.dbDisplay?.profile_loop_video_enabled ||
      input.override?.profile_loop_video_enabled ||
      input.baseDb?.profile_loop_video_enabled,
  );
  return intent;
}
