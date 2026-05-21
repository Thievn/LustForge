import { describe, it, expect } from "vitest";
import { companionGalleryRowIsClip } from "@/components/companion/CompanionGalleryGrid";

describe("companionGalleryRowIsClip", () => {
  it("treats is_video false as still even if URL looks like storage still", () => {
    expect(
      companionGalleryRowIsClip({
        id: "1",
        image_url: "https://example.com/companion-portraits/123.jpg",
        prompt: "",
        created_at: "",
        is_video: false,
      }),
    ).toBe(false);
  });

  it("treats is_video true as clip", () => {
    expect(
      companionGalleryRowIsClip({
        id: "2",
        image_url: "https://example.com/profile-loops/cc-1/x.mp4",
        prompt: "",
        created_at: "",
        is_video: true,
      }),
    ).toBe(true);
  });
});
