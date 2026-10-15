import type { VaultRarity } from "../../../supabase/functions/_shared/vaultDraw";

/** Public card art. Full cards are 512×683; thumbs are 256×341 under /thumbs/. */
export const VAULT_ART_BASE = "https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/vault-art";

export function vaultImageUrl(id: string): string {
  if (id.startsWith("vib-")) return `/vault-art/${id}.webp`;
  return `${VAULT_ART_BASE}/${id}.webp`;
}

export function vaultThumbUrl(id: string): string {
  if (id.startsWith("vib-")) return `/vault-art/thumbs/${id}.webp`;
  return `${VAULT_ART_BASE}/thumbs/${id}.webp`;
}

export function resolveVaultArt(item: {
  id: string;
  imageUrl?: string | null;
  thumbUrl?: string | null;
  image_url?: string | null;
  thumb_url?: string | null;
}): { imageUrl: string; thumbUrl: string } {
  const imageUrl = clean(item.imageUrl) || clean(item.image_url) || vaultImageUrl(item.id);
  const thumbUrl = clean(item.thumbUrl) || clean(item.thumb_url) || vaultThumbUrl(item.id);
  return { imageUrl, thumbUrl };
}

function clean(value: string | null | undefined): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/** A missing thumb can still use the full card. Null when `src` is already the full card. */
export function nextVaultArtSrc(src: string): string | null {
  const marker = "/thumbs/";
  const at = src.indexOf(marker);
  if (at < 0) return null;
  return `${src.slice(0, at)}/${src.slice(at + marker.length)}`;
}

export type RarityTone = {
  label: string;
  border: string;
  tint: string;
  /** Low-opacity color for the locked-card wash. Bottom edge only. */
  wash: string;
  glow: string;
  light: string;
};

/** Silk soft pink, Satin violet, Velvet deep crimson, Forbidden gold. Obsession is iridescent in CSS. */
export const RARITY_TONE: Record<VaultRarity, RarityTone> = {
  silk: {
    label: "Silk",
    border: "#f0c2d6",
    tint: "rgba(240, 194, 214, 0.2)",
    wash: "rgba(240, 194, 214, 0.32)",
    glow: "rgba(240, 194, 214, 0.34)",
    light: "rgba(240, 194, 214, 0.38)",
  },
  satin: {
    label: "Satin",
    border: "#a78bfa",
    tint: "rgba(139, 92, 246, 0.2)",
    wash: "rgba(139, 92, 246, 0.3)",
    glow: "rgba(167, 139, 250, 0.42)",
    light: "rgba(167, 139, 250, 0.46)",
  },
  velvet: {
    label: "Velvet",
    border: "#C2255C",
    tint: "rgba(194, 37, 92, 0.22)",
    wash: "rgba(255, 214, 224, 0.28)",
    glow: "rgba(194, 37, 92, 0.45)",
    light: "rgba(255, 214, 224, 0.5)",
  },
  forbidden: {
    label: "Forbidden",
    border: "#e0c072",
    tint: "rgba(224, 192, 114, 0.18)",
    wash: "rgba(224, 192, 114, 0.28)",
    glow: "rgba(224, 192, 114, 0.46)",
    light: "rgba(224, 192, 114, 0.52)",
  },
  obsession: {
    label: "Obsession",
    border: "#e7d4f2",
    tint: "rgba(196, 170, 230, 0.2)",
    wash: "rgba(196, 170, 230, 0.3)",
    glow: "rgba(214, 186, 232, 0.5)",
    light: "rgba(220, 196, 236, 0.56)",
  },
};

/** Light frost: the treasure stays readable, the lock says it is not yours yet. */
export function vaultFrostClass(frost: "card" | "sheet" = "card"): string {
  return frost === "sheet"
    ? "scale-[1.02] blur-[1.5px] brightness-[1.04] saturate-[0.92]"
    : "scale-[1.03] blur-[2px] brightness-[1.02] saturate-[0.9]";
}

export function rarityBreathes(rarity: VaultRarity, owned: boolean): boolean {
  return owned && rarity !== "silk" && rarity !== "obsession";
}

export function rarityShimmers(rarity: VaultRarity, owned: boolean): boolean {
  return owned && rarity === "obsession";
}
