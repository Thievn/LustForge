import { describe, it, expect } from "vitest";
import {
  profileLoopPlaybackEligible,
  resolveProfileLoopDisplayState,
  shouldAttemptProfileLoopHeal,
} from "@/lib/profileLoopDisplay";
import type { DbCompanion } from "@/hooks/useCompanions";

describe("profileLoopDisplay", () => {
  it("treats extensionless https as eligible when loop enabled", () => {
    const url =
      "https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/profile-loops/cc-1/1730";
    expect(profileLoopPlaybackEligible(url, true)).toBe(true);
  });

  it("resolves active loop when enabled and URL eligible", () => {
    const db = {
      profile_loop_video_enabled: true,
      animated_image_url:
        "https://example.com/storage/v1/object/public/companion-images/profile-loops/cc-1/loop.mp4",
      static_image_url: "https://example.com/still.jpg",
      image_url: "https://example.com/still.jpg",
    } as unknown as DbCompanion;
    const state = resolveProfileLoopDisplayState(db);
    expect(state.loopVideoActive).toBe(true);
    expect(state.showLoopVideo).toBe(true);
  });

  it("should heal when intent on base row but display has no src", () => {
    expect(
      shouldAttemptProfileLoopHeal({
        userId: "u1",
        companionId: "cc-1",
        dbDisplay: { profile_loop_video_enabled: false } as DbCompanion,
        override: null,
        baseDb: { profile_loop_video_enabled: true } as DbCompanion,
        loopVideoSrc: null,
      }),
    ).toBe(true);
  });
});
