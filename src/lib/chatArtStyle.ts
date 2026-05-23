import type { CompanionRarity } from "@/lib/companionRarity";
import { inferStylizedArtFromTags } from "@/lib/forgeBodyTypes";
import { normalizeForgeArtStyle } from "@/lib/forgePortraitPrompt";
import { parseForgeThemeSnapshotFromPersonalityForge } from "@/lib/forgeThemeSnapshot";
import { isAnimeTemptationForgeTabId } from "@/lib/forgeAnimeStyleDna";

/** DB fields used to lock chat Imagine to the same visual lane as the card / forge. */
export type ChatArtStyleDbInput = {
  tags?: string[] | null;
  image_prompt?: string | null;
  appearance?: string | null;
  personality_forge?: Record<string, unknown> | null;
  character_reference?: string | null;
  appearance_reference?: string | null;
};

const APPEARANCE_STYLE_HINTS: { re: RegExp; label: string }[] = [
  { re: /\banime\b|\banime[-\s]?style\b|\bcel[-\s]?shade|\b2d\s+anime/i, label: "Anime Style" },
  { re: /\bmanga\b|\bghibli\b|\bchibi\b|\bscreentone/i, label: "Anime Style" },
  { re: /\b3d\b|\bcg render\b|\bunreal\b|\bblender\b/i, label: "3D / CG render" },
  { re: /\bcomic\b|\bcartoon\b|\bgraphic novel\b/i, label: "Comic / graphic illustration" },
  { re: /\bwatercolor\b|\boil paint/i, label: "Painterly illustration" },
  { re: /\bpixel art\b/i, label: "Pixel art" },
];

const PHOTOREAL_ART_RE =
  /\b(photoreal|hyper-real|cinematic\s+photography|studio\s+portrait|boudoir\s+photography|dark\s+moody\s+realism|high\s+fashion\s+editorial|film\s+noir)\b/i;

/** True when the forge art label or tab implies 2D anime — not photoreal / 3D. */
export function isAnimeArtStyleLabel(art: string | null | undefined): boolean {
  if (!art?.trim()) return false;
  return /\b(anime|manga|cel[-\s]?shad|ghibli|hentai|yaoi|yuri|chibi|2d\s+anime|screentone|cyber-goth\s+anime)\b/i.test(art);
}

/** True when output must stay illustrated / painterly — avoid photoreal drift. */
export function isStylizedNonPhotorealArtLabel(art: string | null | undefined): boolean {
  if (!art?.trim()) return false;
  if (isAnimeArtStyleLabel(art)) return true;
  if (PHOTOREAL_ART_RE.test(art)) return false;
  return /\b(illustrat|watercolor|oil\s+paint|pixel\s+art|comic|cartoon|fantasy\s+art|digital\s+painting|baroque|gothic\s+victorian|surreal|pinup|vaporwave|synthwave|glitch|neon\s+cyberpunk|dark\s+fantasy\s+art|grunge)\b/i.test(
    art,
  );
}

function inferFromImagePromptOrAppearance(
  imagePrompt: string | null | undefined,
  appearance: string | null | undefined,
): string | undefined {
  const blob = `${imagePrompt ?? ""} ${appearance ?? ""}`.toLowerCase();
  if (!blob.trim()) return undefined;
  for (const { re, label } of APPEARANCE_STYLE_HINTS) {
    if (re.test(blob)) return label;
  }
  return undefined;
}

/**
 * Single label for chat image prompts and `characterData.artStyleLabel`.
 * Priority: tags → forge theme snapshot → anime tab → image_prompt / appearance / reference text.
 */
export function resolveChatArtStyleLabel(db: ChatArtStyleDbInput | null | undefined): string {
  const tags = db?.tags ?? [];
  const fromTags = inferStylizedArtFromTags(Array.isArray(tags) ? tags : []);
  if (fromTags) return fromTags;

  const snap = db?.personality_forge
    ? parseForgeThemeSnapshotFromPersonalityForge(db.personality_forge)
    : null;
  const snapArt = snap?.artStyle?.trim();
  if (snapArt) return normalizeForgeArtStyle(snapArt);

  if (snap?.activeForgeTab && isAnimeTemptationForgeTabId(snap.activeForgeTab)) {
    return "Anime Style";
  }

  const refBlob = `${db?.character_reference ?? ""} ${db?.appearance_reference ?? ""}`.trim();
  const fromText = inferFromImagePromptOrAppearance(
    db?.image_prompt ?? null,
    `${db?.appearance ?? ""} ${refBlob}`,
  );
  if (fromText) return fromText;

  return "Photorealistic";
}

/** Kept for API symmetry / future rarity-aware tuning. */
export function resolveChatArtStyleLabelWithRarity(
  db: ChatArtStyleDbInput | null | undefined,
  _rarity?: CompanionRarity | string | null,
): string {
  return resolveChatArtStyleLabel(db);
}
