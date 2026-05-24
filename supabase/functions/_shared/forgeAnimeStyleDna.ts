/**
 * Anime Temptation — dominant 2D style lock (Edge). Keep in sync with `src/lib/forgeAnimeStyleDna.ts`.
 */

export const FORGE_ANIME_STYLE_DNA_FULL =
  "masterpiece, best quality, ultra-detailed 2D anime style, beautiful anime girl, clean anime lineart, sharp linework, vibrant anime colors, large expressive anime eyes with detailed highlights, glossy lips, soft anime shading, cel-shading, anime screentones, anime aesthetic, perfect anime proportions, dramatic anime hair with strong highlights and lowlights, beautiful detailed anime face";

export const FORGE_ANIME_STYLE_DNA_PREVIEW =
  "masterpiece, best quality, ultra-detailed 2D anime illustration, clean anime lineart, sharp linework, vibrant anime colors, large expressive anime eyes with detailed highlights, glossy lips, soft anime shading, cel-shading, anime screentones, anime aesthetic, perfect stylized anime proportions, dramatic anime hair with strong highlights and lowlights, beautiful detailed anime face, tasteful SFW pin-up framing, fully clothed or modest coverage";

export const FORGE_ANIME_ANTI_REALISM_LINE =
  "Avoid photoreal skin, 3D CGI, Octane render, Unreal Engine, game-engine screenshot, or semi-realistic doll shading — flat or soft-cel 2D anime illustration only.";

const LEGACY_TAB_TO_CANONICAL: Record<string, string> = {
  anime: "anime_temptation",
};

export function canonicalizeForgeTabIdForStyle(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  if (!t) return "";
  return LEGACY_TAB_TO_CANONICAL[t] ?? t;
}

export function isAnimeTemptationForgeTabId(raw: unknown): boolean {
  return canonicalizeForgeTabIdForStyle(raw) === "anime_temptation";
}

export function buildAnimeTemptationStyleLead(tier: "full" | "preview"): string {
  const core = tier === "preview" ? FORGE_ANIME_STYLE_DNA_PREVIEW : FORGE_ANIME_STYLE_DNA_FULL;
  return `${core} ${FORGE_ANIME_ANTI_REALISM_LINE}`.trim();
}

export function isAnimeArtStyleLabel(art: string | null | undefined): boolean {
  if (!art?.trim()) return false;
  return /\b(anime|manga|cel[-\s]?shad|ghibli|hentai|yaoi|yuri|chibi|2d\s+anime|screentone|cyber-goth\s+anime)\b/i.test(art);
}

const PHOTOREAL_ART_RE =
  /\b(photoreal|hyper-real|cinematic\s+photography|studio\s+portrait|boudoir\s+photography|dark\s+moody\s+realism|high\s+fashion\s+editorial|film\s+noir)\b/i;

export function isStylizedNonPhotorealArtLabel(art: string | null | undefined): boolean {
  if (!art?.trim()) return false;
  if (isAnimeArtStyleLabel(art)) return true;
  if (PHOTOREAL_ART_RE.test(art)) return false;
  return /\b(illustrat|watercolor|oil\s+paint|pixel\s+art|comic|cartoon|fantasy\s+art|digital\s+painting|baroque|gothic\s+victorian|surreal|pinup|vaporwave|synthwave|glitch|neon\s+cyberpunk|dark\s+fantasy\s+art|grunge)\b/i.test(
    art,
  );
}

/** Imagine / augmentation: stored artStyle wins over forge tab when both are set. */
export function effectiveForgeArtStyleLabelForCharacterData(
  artStyle: string,
  characterData: Record<string, unknown>,
): string {
  const s = String(artStyle ?? "").trim();
  if (s) {
    if (isAnimeArtStyleLabel(s)) return "Anime Style";
    return s;
  }
  const tab =
    characterData.selectedForgeTab ?? characterData.selected_forge_tab ?? characterData.activeForgeTab ?? "";
  if (isAnimeTemptationForgeTabId(tab)) return "Anime Style";
  return "Photorealistic";
}

export const FORGE_ANIME_STYLE_LOCK_REGEX = /ultra-detailed\s+2D\s+anime\s+style/i;

/** Art-style lock for chat menu stills when full theme DNA is suppressed (scene must not inherit packshot). */
export function buildArtStyleOnlyLockPrefix(
  characterData: Record<string, unknown>,
  tier: "full" | "preview" = "full",
): string {
  const art = effectiveForgeArtStyleLabelForCharacterData(
    String(characterData.artStyleLabel ?? characterData.art_style_label ?? ""),
    characterData,
  );
  const animeLane = isAnimeArtStyleLabel(art);
  if (animeLane) {
    return `[ART STYLE — 2D ANIME LOCK — HIGHEST PRIORITY]\n${buildAnimeTemptationStyleLead(tier)}`;
  }
  if (isStylizedNonPhotorealArtLabel(art)) {
    return `ART_STYLE_LOCK (binding — stylized illustration): Render every element in **${art}** — same medium, line weight, shading, and color read as the roster portrait. **Forbidden:** photoreal skin, 3D CGI, Octane/Unreal render, or stock photography unless the portrait itself is photographic.`;
  }
  if (!art) return "";
  return `ART_STYLE_LOCK (binding — match roster portrait): Render every element in **${art}** — same medium, line weight, shading model, color grading, and material read as the profile portrait. **Forbidden:** drifting to generic stock photography or a mismatched illustration style.`;
}
