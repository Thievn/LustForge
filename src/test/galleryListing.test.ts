import { describe, expect, it } from "vitest";
import { presentGalleryRows } from "@/lib/studio/galleryListing";

const src = {
  id: "src",
  image_url: "storage://lf-chat-media/user/studio/src.jpg",
  created_at: "2026-10-01T00:00:00.000Z",
};

describe("presentGalleryRows", () => {
  it("folds the newest clothing edit onto its source and hides older compares", () => {
    const older = {
      id: "older",
      image_url: "storage://lf-chat-media/user/studio/older.jpg",
      source_image_url: src.image_url,
      gallery_listing: "compare",
      created_at: "2026-10-02T00:00:00.000Z",
    };
    const newer = {
      id: "newer",
      image_url: "storage://lf-chat-media/user/studio/newer.jpg",
      source_image_url: "https://abc.supabase.co/storage/v1/object/sign/lf-chat-media/user/studio/src.jpg?token=old",
      gallery_listing: "compare",
      created_at: "2026-10-03T00:00:00.000Z",
    };
    const pose = {
      id: "pose",
      image_url: "storage://lf-chat-media/user/studio/pose.jpg",
      source_image_url: src.image_url,
      gallery_listing: "picture",
      created_at: "2026-10-04T00:00:00.000Z",
    };
    const orphan = {
      id: "orphan",
      image_url: "storage://lf-chat-media/user/studio/orphan.jpg",
      source_image_url: "storage://lf-chat-media/user/studio/missing.jpg",
      gallery_listing: null,
      created_at: "2026-10-05T00:00:00.000Z",
    };
    const rows = presentGalleryRows([orphan, pose, newer, older, src]);
    expect(rows.map((row) => row.id)).toEqual(["orphan", "pose", "newer"]);
    expect(rows[0]?.beforeUrl).toBe(orphan.source_image_url);
    expect(rows[1]?.beforeUrl).toBeNull();
    expect(rows[2]?.beforeUrl).toBe(src.image_url);
    expect(rows[2]?.afterUrl).toBe(newer.image_url);
  });
});
