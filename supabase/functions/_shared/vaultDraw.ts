/** Server draw for The Velvet Vault. Odds are over items the user does not own yet. */

export type VaultRarity = "silk" | "satin" | "velvet" | "forbidden" | "obsession";

export const RARITY_LABEL: Record<VaultRarity, string> = {
  silk: "Silk",
  satin: "Satin",
  velvet: "Velvet",
  forbidden: "Forbidden",
  obsession: "Obsession",
};

/** Base chance of each tier while that tier still has something left. */
export const TIER_ODDS: Record<VaultRarity, number> = {
  silk: 53,
  satin: 27,
  velvet: 13,
  forbidden: 5,
  obsession: 2,
};

/** A crack that lands on one of these clears the pity counter. */
export const PITY_RARITIES: VaultRarity[] = ["velvet", "forbidden", "obsession"];
export const PITY_EVERY = 15;

export const RARITY_ORDER: VaultRarity[] = ["silk", "satin", "velvet", "forbidden", "obsession"];

/** Tier percents over whatever is still unowned. An empty tier gives its share back. */
export function tierOdds<T extends { rarity: VaultRarity }>(items: T[]): Record<VaultRarity, number> {
  const present = new Set(items.map((item) => item.rarity));
  const active = RARITY_ORDER.filter((rarity) => present.has(rarity));
  const sum = active.reduce((total, rarity) => total + TIER_ODDS[rarity], 0);
  const odds: Record<VaultRarity, number> = { silk: 0, satin: 0, velvet: 0, forbidden: 0, obsession: 0 };
  if (sum <= 0) return odds;
  for (const rarity of active) odds[rarity] = (TIER_ODDS[rarity] / sum) * 100;
  return odds;
}

/**
 * Per-item odds. A tier keeps its share (renormalized if other tiers are gone)
 * and splits that share across the items still in it. `weight` only biases inside the tier.
 */
export function dropOdds<T extends { id: string; rarity: VaultRarity; weight?: number }>(
  items: T[],
): Array<T & { percent: number; weight: number }> {
  const tiers = tierOdds(items);
  const mass: Record<VaultRarity, number> = { silk: 0, satin: 0, velvet: 0, forbidden: 0, obsession: 0 };
  for (const item of items) mass[item.rarity] += Math.max(0, item.weight ?? 1);
  return items.map((item) => {
    const bias = Math.max(0, item.weight ?? 1);
    const tierMass = mass[item.rarity] || 1;
    const percent = tierMass > 0 ? (tiers[item.rarity] * bias) / tierMass : 0;
    return { ...item, weight: percent, percent };
  });
}

/** Draw without replacement. Each pull uses the odds left after the last pull. */
export function drawMany<T extends { id: string; rarity: VaultRarity; weight?: number }>(
  items: T[],
  rolls: number[],
): T[] {
  const picked: T[] = [];
  let pool = items.slice();
  for (const roll of rolls) {
    if (!pool.length) break;
    const odds = dropOdds(pool);
    const drawn = drawWeighted(odds, roll);
    picked.push(drawn);
    pool = pool.filter((item) => item.id !== drawn.id);
  }
  return picked;
}

export function drawWeighted<T extends { weight: number }>(items: T[], roll: number): T {
  if (!items.length) throw new Error("EMPTY_POOL");
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0) return items[items.length - 1]!;
  let cursor = Math.min(0.999999, Math.max(0, roll)) * total;
  for (const item of items) {
    cursor -= Math.max(0, item.weight);
    if (cursor < 0) return item;
  }
  return items[items.length - 1]!;
}

export function pityDue(cracksSinceVelvet: number): boolean {
  return Math.max(0, Math.floor(cracksSinceVelvet)) >= PITY_EVERY - 1;
}

export function nextPity(cracksSinceVelvet: number, rarity: VaultRarity): number {
  if (PITY_RARITIES.includes(rarity)) return 0;
  return Math.max(0, Math.floor(cracksSinceVelvet)) + 1;
}

/** On the 15th crack since a Velvet-or-better pull, the pool is only those tiers. */
export function poolForPity<T extends { rarity: VaultRarity }>(
  items: T[],
  cracksSinceVelvet: number,
): { pool: T[]; pity: boolean } {
  if (!pityDue(cracksSinceVelvet)) return { pool: items, pity: false };
  const better = items.filter((item) => PITY_RARITIES.includes(item.rarity));
  if (!better.length) return { pool: items, pity: false };
  return { pool: better, pity: true };
}

export function drawWithPity<T extends { id: string; rarity: VaultRarity; weight?: number }>(
  items: T[],
  rolls: number[],
  cracksSinceVelvet: number,
): { drawn: T[]; pity: number } {
  let pity = Math.max(0, Math.floor(cracksSinceVelvet));
  let remaining = items.slice();
  const drawn: T[] = [];
  for (const roll of rolls) {
    if (!remaining.length) break;
    const eligible = poolForPity(remaining, pity).pool;
    const picked = drawWeighted(dropOdds(eligible), roll);
    drawn.push(picked);
    pity = nextPity(pity, picked.rarity);
    remaining = remaining.filter((item) => item.id !== picked.id);
  }
  return { drawn, pity };
}

export function cryptoRoll(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! / 4294967296;
}

export function settleVaultCharge(input: {
  admin: boolean;
  cost: number;
  ok: boolean;
}): { kept: number; refunded: number } {
  if (input.admin || input.cost <= 0) return { kept: 0, refunded: 0 };
  if (input.ok) return { kept: input.cost, refunded: 0 };
  return { kept: 0, refunded: input.cost };
}
