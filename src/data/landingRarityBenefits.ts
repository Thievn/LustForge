import type { CompanionRarity } from "@/lib/companionRarity";

/** Landing tier block only — one summary + compact perk strip (Forge, Nexus, catalog). */
export const LANDING_TIER_SUMMARY =
  "Every card in the vault carries a seal—Common through Abyssal. You earn that seal when a Forge creation is finalized, when the Nexus hatches a hybrid from two parents, or when you acquire a catalog card already stamped. Higher seals mean more Lovense patterns wired into chat, more vibe traits etched on the card, and hotter TCG stat spreads—the kind of pull you feel in-session, not just on the rim.";

export type LandingTierPerkRow = {
  rarity: CompanionRarity;
  patterns: string;
  traits: string;
  stats: string;
};

/** Matches vibration_pattern_system + vibe trait counts + tcg_stats tier bands. */
export const LANDING_TIER_PERKS: LandingTierPerkRow[] = [
  { rarity: "common", patterns: "1", traits: "1", stats: "38–62" },
  { rarity: "rare", patterns: "2", traits: "2", stats: "44–74" },
  { rarity: "epic", patterns: "3", traits: "3", stats: "50–82" },
  { rarity: "legendary", patterns: "4", traits: "4", stats: "56–88" },
  { rarity: "mythic", patterns: "5", traits: "5", stats: "60–92" },
  { rarity: "abyssal", patterns: "5 + sig", traits: "6", stats: "66–98" },
];
