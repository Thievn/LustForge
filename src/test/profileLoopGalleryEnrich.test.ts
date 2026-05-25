import { describe, it, expect } from "vitest";
import { enrichCompanionWithGalleryLoop } from "@/lib/profileLoopDisplay";
import type { DbCompanion } from "@/hooks/useCompanions";

const base = {
  id: "cc-1",
  profile_loop_video_enabled: false,
  animated_image_url: null,
} as unknown as DbCompanion;

describe("enrichCompanionWithGalleryLoop", () => {
  it("uses latest gallery video when profile row has no animated URL", () => {
    const enriched = enrichCompanionWithGalleryLoop(base, [
      {
        image_url:
          "https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/profile-loops/cc-1/99.mp4",
        is_video: true,
      },
    ]);
    expect(enriched?.profile_loop_video_enabled).toBe(true);
    expect(enriched?.animated_image_url).toContain("profile-loops");
  });

  it("does not attach gallery loop when profile still differs from card art", () => {
    const withCustomStill = {
      ...base,
      static_image_url: "https://example.com/chat-still.jpg",
      image_url: "https://example.com/chat-still.jpg",
    } as unknown as DbCompanion;
    const enriched = enrichCompanionWithGalleryLoop(
      withCustomStill,
      [
        {
          image_url:
            "https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/profile-loops/cc-1/99.mp4",
          is_video: true,
        },
      ],
      { canonicalStillUrl: "https://example.com/card.jpg" },
    );
    expect(enriched?.profile_loop_video_enabled).toBe(false);
    expect(enriched?.animated_image_url).toBeNull();
  });
});
