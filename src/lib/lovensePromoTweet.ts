export type LovenseCampaignTemplate = "sync_focus" | "fomo" | "product_spotlight";
export type LovensePostFormat = "product_only" | "companion_combo";

export const LOVENSE_CAMPAIGN_TEMPLATES: { id: LovenseCampaignTemplate; label: string; defaultTone: string }[] = [
  { id: "sync_focus", label: "Sync-focused", defaultTone: "Elegant" },
  { id: "fomo", label: "FOMO / launch prep", defaultTone: "Aggressive Hype" },
  { id: "product_spotlight", label: "Product spotlight", defaultTone: "Professional" },
];

export const LOVENSE_POST_FORMATS: { id: LovensePostFormat; label: string }[] = [
  { id: "product_only", label: "Product only" },
  { id: "companion_combo", label: "Companion + Toy combo" },
];

export type LovenseTweetVariation = { text: string; hashtags: string[] };

export function fullLovenseTweetText(v: LovenseTweetVariation): string {
  const tags = v.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  return tags ? `${v.text} ${tags}` : v.text;
}

export function appendLovenseShopLinkToTweet(baseTweet: string, shopUrl: string, ctaLine?: string): string {
  const t = baseTweet.trimEnd();
  const line = (ctaLine || "Shop syncable toys on LustForge").trim();
  const url = shopUrl.trim();
  if (!url) return t;
  return `${t}\n\n${line}\n➜ ${url}`;
}

export function defaultShopUrl(origin: string): string {
  const base = origin.replace(/\/$/, "") || "https://lustforge.app";
  return `${base}/toys`;
}
