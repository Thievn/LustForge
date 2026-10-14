import { describe, expect, it } from "vitest";
import { TREASURES } from "@/lib/vault/treasures";
import { resolveVaultArt, vaultFrostClass, vaultImageUrl, vaultThumbUrl } from "@/lib/vault/art";

describe("vault card art", () => {
  it("derives the public card and thumb from the treasure id", () => {
    expect(TREASURES).toHaveLength(150);
    for (const item of TREASURES) {
      expect(vaultImageUrl(item.id)).toBe(
        `https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/vault-art/${item.id}.webp`,
      );
      expect(vaultThumbUrl(item.id)).toBe(
        `https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/vault-art/thumbs/${item.id}.webp`,
      );
    }
  });

  it("prefers a stored url and falls back to the id", () => {
    expect(resolveVaultArt({ id: "ling-ruby", image_url: "https://example.com/ruby.webp", thumb_url: "https://example.com/ruby-thumb.webp" })).toEqual({
      imageUrl: "https://example.com/ruby.webp",
      thumbUrl: "https://example.com/ruby-thumb.webp",
    });
    expect(resolveVaultArt({ id: "ling-ruby" })).toEqual({
      imageUrl: vaultImageUrl("ling-ruby"),
      thumbUrl: vaultThumbUrl("ling-ruby"),
    });
  });

  it("keeps locked frost light enough to read the garment", () => {
    expect(vaultFrostClass("card")).toContain("blur-[3.5px]");
    expect(vaultFrostClass("card")).toContain("brightness-[0.55]");
    expect(vaultFrostClass("sheet")).toContain("blur-[2px]");
    expect(vaultFrostClass("sheet")).not.toContain("blur-[10px]");
  });
});
