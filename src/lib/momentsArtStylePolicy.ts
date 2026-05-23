/**
 * Universal Moments / menu-still art-style policy — every tile inherits these rules.
 * Edge mirror: `supabase/functions/_shared/momentsArtStylePolicy.ts` (keep in sync).
 */
import {
  buildAnimeTemptationStyleLead,
  buildArtStyleOnlyLockPrefix,
  isAnimeArtStyleLabel,
  isStylizedNonPhotorealArtLabel,
} from "@/lib/forgeAnimeStyleDna";

/** Baked into every Selfie + Sensual tile wrapper — future tiles inherit automatically. */
export const MOMENTS_TILE_ART_MEDIUM_BINDING = `**Art medium (binding):** Match the companion's **forge art style** and roster portrait rendering — anime, illustration, painterly, or photoreal as stored on the character. Menu words like "editorial," "cinematic," "boudoir," "glamour," or "photoshoot" describe **mood, pose, and composition only** — they never switch a stylized companion to photoreal photography or 3D CGI.`;

export const IMAGINE_QUALITY_POSITIVE_PHOTOREAL =
  "masterpiece, best quality, ultra detailed, sharp focus, beautiful cinematic lighting, highly detailed skin texture, 8k";

export const IMAGINE_QUALITY_POSITIVE_ANIME =
  "masterpiece, best quality, ultra-detailed 2D anime illustration, clean anime lineart, sharp linework, vibrant anime colors, soft cel shading, sharp focus";

export function resolveImagineQualityPositiveLine(artLabel: string): string {
  if (isAnimeArtStyleLabel(artLabel)) return IMAGINE_QUALITY_POSITIVE_ANIME;
  if (isStylizedNonPhotorealArtLabel(artLabel)) {
    return `masterpiece, best quality, ultra detailed ${artLabel}, sharp focus, premium stylized illustration finish, coherent medium-appropriate rendering`;
  }
  return IMAGINE_QUALITY_POSITIVE_PHOTOREAL;
}

export function stylizedAntiPhotorealNegativeTail(artLabel: string): string {
  if (!isAnimeArtStyleLabel(artLabel) && !isStylizedNonPhotorealArtLabel(artLabel)) return "";
  const base = isAnimeArtStyleLabel(artLabel)
    ? "photoreal, photorealistic, realistic photo, 3D render, CGI, Octane render, Unreal Engine, game engine screenshot, semi-realistic doll, uncanny skin texture"
    : "photoreal drift, stock photography, 3D CGI, Octane render, Unreal Engine, game-engine screenshot, wrong medium";
  return `\n\nNegative prompt (medium — avoid): ${base}`;
}

/** Prepended to final Imagine prompts for menu stills — survives truncation at prompt start. */
export function buildMomentsArtStylePromptPrefix(
  characterData: Record<string, unknown>,
  tier: "full" | "preview" = "full",
): string {
  return buildArtStyleOnlyLockPrefix(characterData, tier);
}

/** "Create a …" line — medium matches companion, not tile mood words. */
export function buildMomentsCreateImageLead(args: {
  artLabel: string;
  subjectDescription: string;
}): string {
  const art = args.artLabel.trim() || "the roster portrait medium";
  const subj = args.subjectDescription.trim() || "the companion";
  if (isAnimeArtStyleLabel(art)) {
    return `Create a highly detailed vertical 2:3 **2D anime illustration** of ${subj} in **${art}** — cel-shaded anime art, **not** a photograph or 3D render.`;
  }
  if (isStylizedNonPhotorealArtLabel(art)) {
    return `Create a highly detailed vertical 2:3 **${art} illustration** of ${subj} — same stylized medium as the roster portrait, **not** photoreal photography or 3D CGI.`;
  }
  return `Create a highly detailed, cinematic, vertical 2:3 photograph of ${subj} in **${art}**.`;
}

/** Client menu quality block — art-aware, no photoreal skin texture on stylized companions. */
export function buildChatStillMenuQualityBlock(artLabel: string): string {
  const quality = resolveImagineQualityPositiveLine(artLabel);
  return `**#3 RENDER QUALITY (${artLabel}):** ${quality}

**Avoid:** deformed anatomy, extra fingers, duplicated limbs, blurry, low quality, watermark, text, logo${isAnimeArtStyleLabel(artLabel) || isStylizedNonPhotorealArtLabel(artLabel) ? ", photoreal drift, 3D CGI, stock photography" : ""}`;
}

/** Full anime DNA at top of master brief when needed (client-side). */
export function buildMomentsClientAnimeHead(artLabel: string): string {
  return isAnimeArtStyleLabel(artLabel) ? buildAnimeTemptationStyleLead("full") : "";
}
