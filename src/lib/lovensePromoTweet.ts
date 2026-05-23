export type LovenseCampaignTemplate = "sync_focus" | "fomo" | "product_spotlight";
export type LovensePostFormat = "product_only" | "companion_tease" | "companion_combo";

export const LOVENSE_CAMPAIGN_TEMPLATES: { id: LovenseCampaignTemplate; label: string; defaultTone: string }[] = [
  { id: "sync_focus", label: "Sync-focused", defaultTone: "Elegant" },
  { id: "fomo", label: "FOMO / launch prep", defaultTone: "Aggressive Hype" },
  { id: "product_spotlight", label: "Product spotlight", defaultTone: "Professional" },
];

export const LOVENSE_POST_FORMATS: { id: LovensePostFormat; label: string; hint: string }[] = [
  {
    id: "product_only",
    label: "Product only",
    hint: "Toy banner or branded card — no companion media.",
  },
  {
    id: "companion_tease",
    label: "Companion tease",
    hint: "Companion video/image only; Grok mentions the selected toy in copy.",
  },
  {
    id: "companion_combo",
    label: "Companion + Toy",
    hint: "Pick companion + product, then choose an X-safe media strategy below.",
  },
];

import type { LovenseXMediaStrategy } from "@/lib/lovenseComboMedia";

export const LOVENSE_COMBO_MEDIA_STRATEGIES: {
  id: LovenseXMediaStrategy;
  label: string;
  hint: string;
}[] = [
  {
    id: "companion_video",
    label: "Companion loop video (best for animation)",
    hint: "1 video on X. Product name stays in tweet text + /toys link.",
  },
  {
    id: "dual_stills",
    label: "Two images (portrait + banner)",
    hint: "Up to 2 images on X. Mixed aspect ratios may show letterboxing on X.",
  },
  {
    id: "product_banner",
    label: "Product banner only",
    hint: "1 image. Companion pairing is in the copy only.",
  },
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
