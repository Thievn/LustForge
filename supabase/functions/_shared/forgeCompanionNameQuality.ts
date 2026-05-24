/** Edge mirror of src/lib/forgeCompanionNameQuality.ts */

export function normalizeNameKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

const BANNED_EXACT = new Set([
  "luna",
  "raven",
  "scarlett",
  "violet",
  "nova",
  "lilith",
  "mistress raven",
  "dark luna",
  "velvet raven",
  "shadow luna",
  "midnight rose",
]);

const GOTH_STEMS = [
  "shadow", "grim", "grimm", "veil", "frost", "dawn", "lock", "gear", "fail", "night", "dread",
  "bane", "void", "dark", "ash", "cinder", "ebon", "moor", "thorn", "wraith", "hollow", "gloom",
  "bleak", "fell", "iron", "storm", "blood", "raven", "shade", "shroud", "mist", "rime", "winter",
  "bloom", "march", "harrow", "crown", "fang", "rift", "shard", "cross", "noir", "crypt", "grave",
  "bone", "hex", "witch", "mere", "fen", "holt", "vale", "blight", "dusk", "mourning", "obsid",
  "pale", "ashen", "riven", "umbri", "vile", "widow", "thronew", "morwen", "nightb", "shadowm",
  "grimh", "dreadm", "voidb", "gloomw", "cinderf", "ebonm", "ironb", "lostg", "nightmar", "darkh",
  "hollowm", "jagged", "korvin", "blightf", "failf", "gearlock", "shadowveil", "grimdawn",
  "failfrost", "nightbane", "dreadmarch", "shadowmere", "mourningveil", "gloomwraith", "thornmere",
  "nightfall", "starfall", "moonfall", "doom", "dooms", "malef", "malach",
];

const GOTH_SUFFIXES = [
  "veil", "dawn", "frost", "lock", "bane", "mere", "moor", "hollow", "wraith", "march", "vale",
  "fen", "holt", "thorn", "shade", "cross", "noir", "fall", "bloom", "harrow", "shard", "rift",
  "gloom", "dread", "shadow", "grim", "court", "crown", "mire", "bane", "lock",
];

function countStemHits(token: string): number {
  let hits = 0;
  for (const stem of GOTH_STEMS) {
    if (token.includes(stem)) hits++;
  }
  return hits;
}

export function isStockFantasyCompoundName(name: string): boolean {
  const raw = name.trim();
  if (!raw) return true;
  const n = normalizeNameKey(raw).replace(/[^a-z0-9\s]/g, "");
  if (!n) return true;
  if (BANNED_EXACT.has(n)) return true;

  const parts = n.split(/\s+/).filter(Boolean);

  if (parts.length === 2) {
    const hits = parts.map(countStemHits);
    if (hits[0]! >= 1 && hits[1]! >= 1) return true;
    if (hits.some((h) => h >= 2)) return true;
    if (countStemHits(parts.join("")) >= 2) return true;
  }

  if (parts.length === 1) {
    const t = parts[0]!;
    if (t.length >= 6 && countStemHits(t) >= 2) return true;
    for (const pref of GOTH_STEMS) {
      if (t.startsWith(pref) && t.length > pref.length + 2) {
        const rest = t.slice(pref.length);
        if (GOTH_SUFFIXES.some((s) => rest === s || rest.startsWith(s))) return true;
        if (countStemHits(rest) >= 1) return true;
      }
    }
    for (const suf of GOTH_SUFFIXES) {
      if (t.endsWith(suf) && t.length > suf.length + 3) {
        const rest = t.slice(0, -suf.length);
        if (countStemHits(rest) >= 1) return true;
      }
    }
    if (/[a-z][A-Z]/.test(raw)) {
      const pieces = raw.split(/(?=[A-Z])/).map((p) => p.toLowerCase());
      if (pieces.length >= 2 && pieces.filter((p) => countStemHits(p) >= 1).length >= 2) return true;
    }
  }

  if (parts.length >= 2) {
    const stemmy = parts.filter((p) => countStemHits(p) >= 1).length;
    if (stemmy >= 2 && stemmy >= Math.ceil(parts.length * 0.6)) return true;
  }

  return false;
}

export function isBannedClicheName(name: string): boolean {
  const n = normalizeNameKey(name);
  if (!n) return true;
  if (BANNED_EXACT.has(n)) return true;
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.some((p) => BANNED_EXACT.has(p))) return true;
  return false;
}

export function isAcceptableForgeDisplayName(name: string): boolean {
  const t = name.trim();
  if (t.length < 2 || t.length > 120) return false;
  if (isBannedClicheName(t)) return false;
  if (isStockFantasyCompoundName(t)) return false;
  return true;
}
