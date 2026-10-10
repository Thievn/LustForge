import type { CompanionRarity } from "@/lib/companionRarity";
import { getStaticRarityForCatalog, normalizeCompanionRarity } from "@/lib/companionRarity";

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
const LOCAL_META: LocalMeta[] = [
  { id: "lilith-vesper", name: "Lilith Vesper", tagline: "After midnight, still wide awake." },
  { id: "jax-harlan", name: "Jax Harlan", tagline: "Rough hands, warm heart." },
  { id: "kira-lux", name: "Kira Lux", tagline: "Bright, quick, and hard to look away from." },
  { id: "marcus-vale", name: "Marcus Vale", tagline: "A poet who remembers the small things." },
  { id: "sable-rook", name: "Sable Rook", tagline: "A long game, played softly." },
  { id: "finn-blaze", name: "Finn Blaze", tagline: "Easy laugh, open door." },
  { id: "zara-eclipse", name: "Zara Eclipse", tagline: "She means what she says." },
  { id: "raven-nox", name: "Raven Nox", tagline: "Chaos, affection, and a sharp joke." },
  { id: "diego-cortez", name: "Diego Cortez", tagline: "Salt air and a story for the road." },
  { id: "lena-frost", name: "Lena Frost", tagline: "Cool on the surface." },
  { id: "bianca-rose", name: "Bianca Rose", tagline: "Sweet, clumsy, and completely sincere." },
  { id: "jaxson-voss", name: "Jaxson Voss", tagline: "Neon nights and a steady grin." },
  { id: "elara-moon", name: "Elara Moon", tagline: "Moonlight and a quiet kind of magic." },
  { id: "tyler-kane", name: "Tyler Kane", tagline: "Structure, patience, and follow-through." },
  { id: "sage-evergreen", name: "Sage Evergreen", tagline: "Soft voice, surprising depth." },
  { id: "kaelen-veyra", name: "Kaelen Veyra", tagline: "Golden hour, and nowhere else to be.", rarity: "rare" },
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
  return EXCLUDED_FROM_LANDING.has(id) || id.startsWith("cc-");
}

export function buildLandingExamples(
  localSrc: Record<string, string>,
  remote: LandingRemoteRow[] = [],
): LandingExample[] {
  const byId = new Map<string, LandingExample>();

  for (const meta of LOCAL_META) {
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
    if (!row?.id || isExcludedFromLanding(row.id) || row.isNexusHybrid) continue;
    const src = row.src?.trim();
    if (!src) continue;
    if (byId.has(row.id)) continue;
    const local = LOCAL_BY_ID.get(row.id);
    byId.set(row.id, {
      id: row.id,
      name: (local?.name || row.name || "Companion").trim(),
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
