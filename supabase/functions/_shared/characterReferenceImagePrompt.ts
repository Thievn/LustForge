/** Deno copy — keep in sync with `src/lib/characterReferenceImagePrompt.ts`. */

import {
  buildMomentsArtStylePromptPrefix,
  resolveImagineQualityPositiveLine,
  stylizedAntiPhotorealNegativeTail,
} from "./momentsArtStylePolicy.ts";

export const IMAGINE_QUALITY_POSITIVE_LINE =
  "masterpiece, best quality, ultra detailed, sharp focus, beautiful cinematic lighting, highly detailed skin texture, 8k";

export const IMAGINE_QUALITY_NEGATIVE_LINE =
  "deformed, extra limbs, extra fingers, fused fingers, mutated hands, poorly drawn hands, bad anatomy, bad proportions, extra arms, extra legs, mutated limbs, blurry, low quality, deformed face, bad face, duplicate limbs, missing limbs, watermark, text, logo";

export const CHARACTER_REFERENCE_INTRO_LINES = [
  "CHARACTER REFERENCE (read first — identity lock):",
  "Use this exact character's face, hair style, eye color, body type, tattoos, piercings, species marks, and overall appearance exactly as reference (the paragraph below).",
  "Maintain 100% consistency with the main profile / roster portrait when a likeness URL is supplied — same person, same art style family. Do not swap models, do not invent a new face, do not change ethnicity or species away from this lock.",
  "Only change pose, outfit, wardrobe state, background, environment, props, lighting, and scene as directed by PRIMARY SCENE / menu — never replace the character.",
].join("\n");

export function enrichImaginePromptUniversal(o: {
  corePrompt: string;
  characterReference?: string | null;
  forceRefPrepend?: boolean;
  artStyleLabel?: string | null;
  menuGalleryStill?: boolean;
  characterData?: Record<string, unknown> | null;
  tier?: "full" | "preview";
}): string {
  const artLabel = (o.artStyleLabel ?? "").trim() || "Photorealistic";
  const tier = o.tier ?? "full";
  const artPrefix =
    o.menuGalleryStill && o.characterData
      ? buildMomentsArtStylePromptPrefix(o.characterData, tier)
      : "";
  const refFull = o.characterReference?.replace(/\s+/g, " ").trim() ?? "";
  const ref = o.forceRefPrepend && refFull.length > 1500
    ? `${refFull.slice(0, 1500).trimEnd()}…`
    : refFull;
  const body = o.corePrompt.replace(/\s+\n/g, "\n").trim();
  const skipDuplicateRefLock =
    !o.forceRefPrepend &&
    ref.length > 0 &&
    (/\bCHARACTER REFERENCE \(READ FIRST/i.test(body) ||
      /\bMaintain 100% consistency with the main profile/i.test(body) ||
      /\bMAIN PORTRAIT CONSISTENCY\b/i.test(body));
  const hasQualityStem =
    /\b8k\b/i.test(body) && /\bmasterpiece\b/i.test(body) && /\bultra\s+detailed\b/i.test(body);
  const qualityLine = resolveImagineQualityPositiveLine(artLabel);
  const head = hasQualityStem ? "" : `${qualityLine}.\n\n`;
  const lock =
    ref && !skipDuplicateRefLock
      ? `${CHARACTER_REFERENCE_INTRO_LINES}

${ref}

Keep the exact same face, hair, eyes, body type, skin tone, distinctive marks, and **${artLabel}** rendering style as that portrait and reference text.

Now generate this new scene:

`
      : "";
  const hasNeg =
    /\bnegative\s+prompt\b/i.test(body) ||
    (/\bmissing\s+limbs\b/i.test(body) && /\bwatermark\b/i.test(body));
  const artifactNeg = hasNeg ? "" : `\n\nNegative prompt (avoid): ${IMAGINE_QUALITY_NEGATIVE_LINE}`;
  const mediumNeg = stylizedAntiPhotorealNegativeTail(artLabel);
  const prefix = artPrefix ? `${artPrefix}\n\n` : "";
  return `${prefix}${head}${lock}${body}${artifactNeg}${mediumNeg}`.trim();
}
