import { isAnimeArtStyleLabel } from "./forgeAnimeStyleDna.ts";
import { readForgeThemeDna } from "./nexusForgeThemeMerge.ts";

const STYLE_HINT_RE =
  /\b(anime|manga|cel|photoreal|hyper[-\s]?real|cinematic|illustration|chibi|pixel|watercolor|oil\s+painting|cyberpunk|gothic|baroque|fantasy|digital\s+painting|comic|cartoon|synthwave|vaporwave|neon\s+noir|film\s+noir|editorial|ghibli|hentai|yaoi|yuri|pinup|boudoir|low[-\s]?poly|vapor)\b/i;

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}

/**
 * Ensures Nexus children inherit visual-style tags from parents; anime tag only when merged artStyle is anime.
 */
export function mergeNexusChildVisualStyleTags(input: {
  childTags: string[];
  parentATags: unknown;
  parentBTags: unknown;
  mergedPersonalityForge: Record<string, unknown> | null | undefined;
  maxTags: number;
}): string[] {
  const { childTags, parentATags, parentBTags, mergedPersonalityForge, maxTags } = input;
  const out: string[] = [];
  const seen = new Set<string>();

  const add = (t: string) => {
    const k = t.trim().toLowerCase();
    if (!k || seen.has(k) || out.length >= maxTags) return;
    seen.add(k);
    out.push(t.trim());
  };

  for (const t of childTags) add(t);

  for (const p of [...asStringArray(parentATags), ...asStringArray(parentBTags)]) {
    if (STYLE_HINT_RE.test(p)) add(p);
  }

  const dna = readForgeThemeDna(mergedPersonalityForge ?? null);
  const artStyle = dna && typeof dna.artStyle === "string" ? dna.artStyle.trim() : "";
  if (artStyle && isAnimeArtStyleLabel(artStyle)) {
    const hasAnimeWord = out.some((t) => /\banime\b/i.test(t) || /\bmanga\b/i.test(t) || /cel-shad/i.test(t));
    if (!hasAnimeWord) add("Anime Style");
  }

  if (artStyle && !isAnimeArtStyleLabel(artStyle)) {
    return out
      .filter((t) => !/\banime\b/i.test(t) && !/\bmanga\b/i.test(t) && !/cel-shad/i.test(t))
      .slice(0, maxTags);
  }

  return out.slice(0, maxTags);
}
