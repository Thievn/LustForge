import type { CompanionRarity } from "@/lib/companionRarity";
import { getStaticRarityForCatalog, normalizeCompanionRarity } from "@/lib/companionRarity";

/**
 * Portraits checked by hand as photographic people.
 * The rest of the catalog is illustration, anime, or creature art, and the live
 * database mixes those in, so the public reel does not accept unknown rows.
 */
const PHOTOGRAPHIC_LANDING_IDS = new Set([
  "lilith-vesper",
  "kira-lux",
  "zara-eclipse",
  "lena-frost",
  "tyler-kane",
  "kaelen-veyra",
  "jaxson-voss",
]);

/** Catalog ids whose art is a creature, mascot, or heavy illustration — kept off the public reel. */
const EXCLUDED_FROM_LANDING = new Set([
  "flicker-spark",
  "velvet-eclipse",
  "nova-quinn",
  "miko-circuit-kane",
  "glitch-exe",
  "mother-root",
  "kael-thunderhoof",
  "neon-noodle",
  "byte-bugzilla",
  "grim-goodboy-reaper",
  "whisper-void",
  "oracle-omen",
  "echo-chamber",
  "luna-howl",
  "dr-helix",
  "siren-songbird",
  "captain-salty-marrow",
  "baron-von-tickles",
  "professor-paradox",
  "coral-reef-kane",
  "poppy-boom-spark",
  "elder-whisper",
  "rook-wire-cassidy",
]);

export type LandingExample = {
  id: string;
  name: string;
  tagline: string;
  rarity: CompanionRarity;
  src: string;
};

type LocalMeta = {
  id: string;
  name: string;
  tagline: string;
  rarity?: CompanionRarity;
};

/** Calm public lines. Catalog taglines stay in the app data and are not shown on the landing page. */
/** Public first names for the seven landing samples. Catalog names stay in companion data. */
export const LANDING_DISPLAY_NAMES: Record<string, string> = {
  "kaelen-veyra": "Cole",
  "lena-frost": "Sloane",
  "kira-lux": "Mira",
  "zara-eclipse": "Noor",
  "lilith-vesper": "Ivy",
  "tyler-kane": "Evan",
  "jaxson-voss": "Ren",
};

export function isLandingSample(id: string | null | undefined): boolean {
  return Boolean(id && PHOTOGRAPHIC_LANDING_IDS.has(id));
}

export function landingDisplayName(id: string, fallback = "Companion"): string {
  return LANDING_DISPLAY_NAMES[id] ?? fallback;
}

const LOCAL_META: LocalMeta[] = [
  { id: "lilith-vesper", name: "Ivy", tagline: "After midnight, still wide awake." },
  { id: "kira-lux", name: "Mira", tagline: "Bright, quick, and hard to look away from." },
  { id: "zara-eclipse", name: "Noor", tagline: "She means what she says." },
  { id: "lena-frost", name: "Sloane", tagline: "Cool on the surface." },
  { id: "jaxson-voss", name: "Ren", tagline: "Neon nights and a steady grin." },
  { id: "tyler-kane", name: "Evan", tagline: "Structure, patience, and follow-through." },
  { id: "kaelen-veyra", name: "Cole", tagline: "Golden hour, and nowhere else to be.", rarity: "rare" },
];

const LOCAL_BY_ID = new Map(LOCAL_META.map((row) => [row.id, row]));

export type LandingRemoteRow = {
  id: string;
  name: string;
  src: string | null | undefined;
  rarity?: string | null;
  isNexusHybrid?: boolean | null;
};

const FALLBACK_TAGLINE = "A companion someone made.";

export function isExcludedFromLanding(id: string): boolean {
  return !PHOTOGRAPHIC_LANDING_IDS.has(id) || EXCLUDED_FROM_LANDING.has(id) || id.startsWith("cc-");
}

export function buildLandingExamples(
  localSrc: Record<string, string>,
  remote: LandingRemoteRow[] = [],
): LandingExample[] {
  const byId = new Map<string, LandingExample>();

  for (const meta of LOCAL_META) {
    if (!PHOTOGRAPHIC_LANDING_IDS.has(meta.id)) continue;
    const src = localSrc[meta.id]?.trim();
    if (!src) continue;
    byId.set(meta.id, {
      id: meta.id,
      name: meta.name,
      tagline: meta.tagline,
      rarity: meta.rarity ?? getStaticRarityForCatalog(meta.id),
      src,
    });
  }

  for (const row of remote) {
    if (!row?.id || !PHOTOGRAPHIC_LANDING_IDS.has(row.id) || row.isNexusHybrid) continue;
    const src = row.src?.trim();
    if (!src) continue;
    if (byId.has(row.id)) continue;
    const local = LOCAL_BY_ID.get(row.id);
    byId.set(row.id, {
      id: row.id,
      name: landingDisplayName(row.id, (local?.name || row.name || "Companion").trim()),
      tagline: local?.tagline || FALLBACK_TAGLINE,
      rarity: local?.rarity ?? normalizeCompanionRarity(row.rarity),
      src,
    });
  }

  return [...byId.values()];
}

export function shuffleLanding<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j]!;
    copy[j] = swap!;
  }
  return copy;
}

export function initialReelSlots<T>(deck: readonly T[], count: number): T[] {
  if (count <= 0 || deck.length === 0) return [];
  return deck.slice(0, Math.min(count, deck.length));
}

/**
 * Replace one visible slot with the next portrait that is not already on screen.
 * When the deck is smaller than the window, the next deck item is used anyway.
 */
export function advanceReelSlot<T extends { id: string }>(
  deck: readonly T[],
  slots: readonly T[],
  slotIndex: number,
  cursor: number,
): { slots: T[]; cursor: number } {
  if (deck.length === 0 || slots.length === 0) return { slots: [...slots], cursor };
  const index = ((slotIndex % slots.length) + slots.length) % slots.length;
  const visible = new Set(slots.map((slot) => slot.id));
  let i = ((cursor % deck.length) + deck.length) % deck.length;
  let chosen = deck[i]!;
  for (let guard = 0; guard < deck.length; guard += 1) {
    chosen = deck[i]!;
    if (!visible.has(chosen.id) || deck.length <= slots.length) break;
    i = (i + 1) % deck.length;
  }
  const next = slots.slice();
  next[index] = chosen;
  return { slots: next, cursor: (i + 1) % deck.length };
}
