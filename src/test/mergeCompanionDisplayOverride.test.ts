import { describe, it, expect } from "vitest";
import { mergeCompanionDisplayWithUserOverride } from "@/lib/mergeCompanionDisplayOverride";
import type { DbCompanion } from "@/hooks/useCompanions";

const baseDb = {
  id: "cc-abc",
  name: "Test",
  user_id: "u1",
  is_public: true,
  approved: true,
  animated_image_url: null,
  profile_loop_video_enabled: false,
  static_image_url: "https://example.com/card.jpg",
  image_url: "https://example.com/card.jpg",
} as unknown as DbCompanion;

describe("mergeCompanionDisplayWithUserOverride", () => {
  it("prefers override loop when enabled with profile-loops URL", () => {
    const merged = mergeCompanionDisplayWithUserOverride(baseDb, {
      portrait_url: "https://example.com/my-still.jpg",
      animated_portrait_url: "https://example.com/storage/v1/object/public/companion-images/profile-loops/cc-abc/loop.mp4",
      profile_loop_video_enabled: true,
    });
    expect(merged?.profile_loop_video_enabled).toBe(true);
    expect(merged?.animated_image_url).toContain("profile-loops");
  });

  it("accepts extensionless https override URL when loop is enabled", () => {
    const merged = mergeCompanionDisplayWithUserOverride(baseDb, {
      portrait_url: "https://example.com/my-still.jpg",
      animated_portrait_url:
        "https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/profile-loops/cc-abc/1730000000",
      profile_loop_video_enabled: true,
    });
    expect(merged?.profile_loop_video_enabled).toBe(true);
    expect(merged?.animated_image_url).toContain("profile-loops");
  });

  it("does not show loop when user turned it off but clip remains on override", () => {
    const dbWithLoop = {
      ...baseDb,
      animated_image_url: "https://example.com/profile-loops/canonical.mp4",
      profile_loop_video_enabled: true,
    } as DbCompanion;
    const merged = mergeCompanionDisplayWithUserOverride(dbWithLoop, {
      portrait_url: null,
      animated_portrait_url: "https://example.com/profile-loops/canonical.mp4",
      profile_loop_video_enabled: false,
    });
    expect(merged?.profile_loop_video_enabled).toBe(false);
    expect(merged?.animated_image_url).toBeNull();
  });

  it("keeps forge row loop when override only changes still portrait", () => {
    const privateForge = {
      ...baseDb,
      is_public: false,
      approved: false,
      animated_image_url: "https://example.com/storage/v1/object/public/companion-images/profile-loops/cc-abc/loop.mp4",
      profile_loop_video_enabled: true,
    } as DbCompanion;
    const merged = mergeCompanionDisplayWithUserOverride(privateForge, {
      portrait_url: "https://example.com/my-still.jpg",
      animated_portrait_url: null,
      profile_loop_video_enabled: false,
    });
    expect(merged?.profile_loop_video_enabled).toBe(true);
    expect(merged?.animated_image_url).toContain("profile-loops");
  });
});
