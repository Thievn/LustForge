/**
 * Builds likeness-first companion description for sanitizeForGrokImagine().
 */
import {
  sanitizeForgePersonalityAndKinkLabels,
  sanitizeGrokImagineLexicon,
  sanitizeImagineProfileText,
} from "./momentsPromptSanitize.ts";

const SCENE_CONTAMINATION =
  /\b(beach|ocean|poolside|swimsuit|bikini|standing on sand|tropical shore|catalog|packshot|roster card|marketing still|studio backdrop|icon pose|same outfit as the card)\b/i;

const ATMOSPHERE_OR_VFX =
  /\b(smoke|smoky|swirling smoke|cigarette smoke|fog|mist|haze|volumetric|lens flare|lens-flare|god[-\s]?rays|particles?|dust moats|backlit dust|neon streaks|strobes?|club lights|chiaroscuro haze|wreathed in|shrouded in|curls? of smoke)\b/i;

const LIKENESS_ANCHOR =
  /\b(face|facial|eyes?|brows?|lashes|nose|mouth|lips|teeth|cheek|jaw|chin|freckle|mole|dimple|hair|skin|complexion|species|hybrid|anthro|tail|horns?|wings?|ears?|fangs?|claws?|fur|furry|scales?|markings?|tattoos?|physique|torso|limbs?|muscles?|curves?|bust|hips|thighs|hands?|fingers?|nails?|legs?|feet|stature|silhouette)\b/i;

const SPECIES_MATERIAL_BODY =
  /\b(made of|composed of|body (?:is |of )|formed from|incarnate as|elemental)\b.{0,48}\b(smoke|fire|ice|shadow|lightning|ash|mist|steam|neon|glass)\b/i;

function stripNonLikenessSentences(text: string, maxChars: number): string {
  const raw = text.replace(/\s+/g, " ").trim();
  if (!raw) return "";
  const parts = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !SCENE_CONTAMINATION.test(s))
    .filter((s) => {
      if (!ATMOSPHERE_OR_VFX.test(s)) return true;
      if (SPECIES_MATERIAL_BODY.test(s)) return true;
      if (LIKENESS_ANCHOR.test(s)) return true;
      return false;
    });
  const joined = parts.join(" ").trim();
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, maxChars).trimEnd()}…`;
}

function sliceStr(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (!t) return "";
  const clipped = t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
  return sanitizeGrokImagineLexicon(clipped);
}

function joinList(v: unknown, maxItems: number): string {
  if (!Array.isArray(v)) return "";
  return sanitizeGrokImagineLexicon(
    sanitizeForgePersonalityAndKinkLabels(
      v
        .map((x) => String(x).trim())
        .filter(Boolean)
        .slice(0, maxItems)
        .join(", "),
    ),
  );
}

function sanitizePersonalityForImagine(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const t = sanitizeForgePersonalityAndKinkLabels(v.trim());
  if (!t) return "";
  const clipped = t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
  return sanitizeGrokImagineLexicon(clipped);
}

function neutralizeAnatomyDetail(v: unknown): string {
  const raw = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (!raw || raw === "none") return "";
  if (raw === "futa") return "fantasy hybrid silhouette (consistent tease, editorial coverage)";
  if (raw === "pre_op") return "identity-consistent presentation";
  if (raw === "post_op") return "identity-consistent presentation";
  return sanitizeGrokImagineLexicon(raw).slice(0, 120);
}

export function buildCompanionDescriptionForSanitize(
  row: Record<string, unknown>,
  extras?: { portraitLock?: string; motionNotes?: string },
): string {
  const name = sliceStr(row.name, 80) || "Character";
  const tagline = sliceStr(row.tagline, 200);
  const appearance = sliceStr(row.appearance, 900);
  const personality = sanitizePersonalityForImagine(row.personality, 400);
  const bodyType = sliceStr(row.body_type ?? row.bodyType, 120);
  const artStyle = sliceStr(
    row.art_style_label ?? row.artStyleLabel ?? row.art_style ?? row.artStyle,
    120,
  );
  const gender = sliceStr(row.gender ?? row.subjectGender, 40);
  const traits = joinList(row.traits ?? row.vibe_traits, 8);
  const portraitLock = sanitizeGrokImagineLexicon(
    (extras?.portraitLock ?? row.portrait_consistency_lock ?? row.portraitConsistencyLock ?? "")
      .toString()
      .trim()
      .slice(0, 1200),
  );

  const parts = [
    `Identity: ${name}.`,
    gender ? `Presentation: ${gender}.` : "",
    bodyType ? `Body type / silhouette: ${bodyType}.` : "",
    artStyle ? `Art style / rendering: ${artStyle}.` : "",
    appearance ? `Appearance (face, hair, skin, marks — lock exactly): ${appearance}` : "",
    personality ? `Personality energy (motion/expression only): ${personality}` : "",
    traits ? `Vibe tags: ${traits}.` : "",
    tagline ? `Tagline mood: ${tagline}` : "",
    portraitLock ? `Portrait continuity lock: ${portraitLock}` : "",
    extras?.motionNotes?.trim()
      ? `User motion request (rewrite safely): ${sanitizeGrokImagineLexicon(extras.motionNotes.trim().slice(0, 800))}`
      : "",
  ].filter(Boolean);

  return parts.join("\n");
}

/**
 * Likeness-only bundle for Imagine / I2V — strips scene contamination, spicy labels, and chat-only fields.
 */
export function buildImagineSafeCompanionContext(row: Record<string, unknown>): string {
  const name = sliceStr(row.name, 80) || "Character";
  const gender = sliceStr(row.gender ?? row.subjectGender, 40);
  const bodyType = sliceStr(row.body_type ?? row.bodyType, 120);
  const artStyle = sliceStr(
    row.art_style_label ?? row.artStyleLabel ?? row.art_style ?? row.artStyle,
    120,
  );
  const appearanceRaw =
    typeof row.character_reference === "string" && row.character_reference.trim()
      ? row.character_reference
      : typeof row.appearance_reference === "string" && row.appearance_reference.trim()
        ? row.appearance_reference
        : typeof row.appearance === "string"
          ? row.appearance
          : "";
  const appearance = sanitizeImagineProfileText(
    stripNonLikenessSentences(appearanceRaw, 700),
    700,
  );
  const personality = sanitizePersonalityForImagine(row.personality, 220);
  const tagline = sliceStr(row.tagline, 140);
  const kinks = joinList(row.kinks, 6);
  const anatomy = neutralizeAnatomyDetail(row.identity_anatomy_detail);

  const parts = [
    `Identity: ${name}.`,
    gender ? `Presentation: ${gender}.` : "",
    bodyType ? `Body type: ${bodyType}.` : "",
    artStyle ? `Art style: ${artStyle}.` : "",
    anatomy ? `Anatomy notes: ${anatomy}.` : "",
    appearance ? `Likeness (face, hair, skin, species — lock exactly): ${appearance}` : "",
    personality ? `Expression energy: ${personality}` : "",
    kinks ? `Mood hints (editorial only): ${kinks}` : "",
    tagline ? `Tagline mood: ${tagline}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}

/** Sanitize a character_reference / appearance_reference blob for Imagine prepend. */
export function sanitizeCharacterReferenceForImagine(ref: string | null | undefined): string {
  const raw = String(ref ?? "").replace(/\s+/g, " ").trim();
  if (raw.length < 12) return "";
  return sanitizeImagineProfileText(stripNonLikenessSentences(raw, 1500), 1500);
}
