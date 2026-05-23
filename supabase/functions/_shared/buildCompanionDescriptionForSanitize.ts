/**
 * Builds likeness-first companion description for sanitizeForGrokImagine().
 */

function sliceStr(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

function joinList(v: unknown, maxItems: number): string {
  if (!Array.isArray(v)) return "";
  return v
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .join(", ");
}

export function buildCompanionDescriptionForSanitize(
  row: Record<string, unknown>,
  extras?: { portraitLock?: string; motionNotes?: string },
): string {
  const name = sliceStr(row.name, 80) || "Character";
  const tagline = sliceStr(row.tagline, 200);
  const appearance = sliceStr(row.appearance, 900);
  const personality = sliceStr(row.personality, 400);
  const bodyType = sliceStr(row.body_type ?? row.bodyType, 120);
  const artStyle = sliceStr(
    row.art_style_label ?? row.artStyleLabel ?? row.art_style ?? row.artStyle,
    120,
  );
  const gender = sliceStr(row.gender ?? row.subjectGender, 40);
  const traits = joinList(row.traits ?? row.vibe_traits, 8);
  const portraitLock = (extras?.portraitLock ?? row.portrait_consistency_lock ?? row.portraitConsistencyLock ?? "")
    .toString()
    .trim()
    .slice(0, 1200);

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
    extras?.motionNotes?.trim() ? `User motion request (rewrite safely): ${extras.motionNotes.trim().slice(0, 800)}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}
