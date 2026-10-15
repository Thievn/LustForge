import { describe, expect, it } from "vitest";
import { TREASURES } from "@/lib/vault/treasures";
import { nextVaultArtSrc, resolveVaultArt, vaultFrostClass, vaultImageUrl, vaultThumbUrl } from "@/lib/vault/art";

describe("vault card art", () => {
  it("derives the public card and thumb from the treasure id", () => {
    expect(TREASURES).toHaveLength(162);
    for (const item of TREASURES) {
      if (item.id.startsWith("vib-")) {
        expect(vaultImageUrl(item.id)).toBe(`/vault-art/${item.id}.webp`);
        expect(vaultThumbUrl(item.id)).toBe(`/vault-art/thumbs/${item.id}.webp`);
        continue;
      }
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

  it("derives art when image_url has not been stored yet", () => {
    expect(resolveVaultArt({ id: "ling-ruby", image_url: null, thumb_url: "" })).toEqual({
      imageUrl: vaultImageUrl("ling-ruby"),
      thumbUrl: vaultThumbUrl("ling-ruby"),
    });
    expect(nextVaultArtSrc(vaultThumbUrl("ling-ruby"))).toBe(vaultImageUrl("ling-ruby"));
    expect(nextVaultArtSrc(vaultImageUrl("ling-ruby"))).toBeNull();
  });

  it("keeps locked frost light enough to read the garment", () => {
    expect(vaultFrostClass("card")).toContain("blur-[2px]");
    expect(vaultFrostClass("card")).toContain("brightness-[1.02]");
    expect(vaultFrostClass("sheet")).toContain("blur-[1.5px]");
    expect(vaultFrostClass("sheet")).not.toContain("blur-[10px]");
  });
});
