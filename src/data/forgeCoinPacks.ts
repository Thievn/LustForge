/**
 * Public Forge Coin packs shown on the landing page.
 * Must match PACKS in supabase/functions/nowpayments-fc/index.ts — that list is
 * what BuyCredits loads from the nowpayments-fc "packs" mode.
 */
export type ForgeCoinPack = {
  id: string;
  usd: number;
  fc: number;
  name: string;
  label: string;
  badge: string;
  description: string;
};

export const FORGE_COIN_PACKS: readonly ForgeCoinPack[] = [
  {
    id: "starter_750",
    usd: 5,
    fc: 600,
    name: "Awakening",
    label: "Awakening — 600 FC",
    badge: "",
    description: "Begin your journey into temptation.",
  },
  {
    id: "popular_1650",
    usd: 10,
    fc: 1320,
    name: "Desire",
    label: "Desire — 1,320 FC",
    badge: "Popular",
    description: "The most popular path. More pleasure awaits.",
  },
  {
    id: "best_4500",
    usd: 25,
    fc: 3450,
    name: "Obsession",
    label: "Obsession — 3,450 FC",
    badge: "Best Value",
    description: "Best value. Feed your deepest cravings.",
  },
  {
    id: "heavy_9500",
    usd: 50,
    fc: 7200,
    name: "Eternal",
    label: "Eternal — 7,200 FC",
    badge: "",
    description: "Unlimited indulgence. For those who never want to stop.",
  },
];

/** Default selection on BuyCredits. */
export const FORGE_COIN_FEATURED_PACK_ID = "popular_1650";
