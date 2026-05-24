/**
 * Edge-safe naming brief builder (mirrors src/lib/buildForgeCompanionNamingBrief.ts).
 */

type ForgePersonalityProfile = {
  timePeriod: string;
  personalityType: string;
  speechStyle: string;
  sexualEnergy: string;
  relationshipVibe: string;
};

const MAX_BRIEF = 1200;

function sliceField(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

function personalitySeedsProse(p: ForgePersonalityProfile): string {
  return [
    `Time period: ${p.timePeriod}`,
    `Personality type: ${p.personalityType}`,
    `Speech style: ${p.speechStyle}`,
    `Sexual energy: ${p.sexualEnergy}`,
    `Relationship vibe: ${p.relationshipVibe}`,
  ].join("\n");
}

export type ForgeCompanionNamingContext = {
  gender: string;
  forgePersonality: ForgePersonalityProfile;
  activeForgeTab?: string;
  forgeThemeLine?: string;
  artStyle?: string;
  sceneAtmosphere?: string;
  bodyType?: string;
  ethnicity?: string;
  traits?: readonly string[];
  namePrefix?: string;
  tagline?: string;
  narrativeAppearance?: string;
};

export function buildForgeCompanionNamingBrief(ctx: ForgeCompanionNamingContext): string {
  const gender = sliceField(ctx.gender, 48) || "non-binary";
  const tabId = typeof ctx.activeForgeTab === "string" ? ctx.activeForgeTab.trim() : "";
  const tabLabel = tabId ? tabId.replace(/_/g, " ") : "";
  const themeLine = sliceField(ctx.forgeThemeLine, 220);
  const art = sliceField(ctx.artStyle, 80);
  const scene = sliceField(ctx.sceneAtmosphere, 80);
  const body = sliceField(ctx.bodyType, 80);
  const eth = sliceField(ctx.ethnicity, 64);
  const prefix = sliceField(ctx.namePrefix, 40);
  const tagline = sliceField(ctx.tagline, 160);
  const appearance = sliceField(ctx.narrativeAppearance, 220);
  const traits = (ctx.traits ?? [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 6)
    .join(", ");

  const parts = [
    `Gender / presentation: ${gender}.`,
    "",
    "Personality matrix (5D forge):",
    personalitySeedsProse(ctx.forgePersonality),
    "",
    tabLabel ? `Active forge theme tab: ${tabLabel}.` : "",
    themeLine ? `Theme lane summary: ${themeLine}` : "",
    art ? `Art style: ${art}.` : "",
    scene ? `Scene atmosphere: ${scene}.` : "",
    body ? `Body type / silhouette: ${body}.` : "",
    eth ? `Ethnicity / cultural lane: ${eth}.` : "",
    traits ? `Accent traits: ${traits}.` : "",
    prefix ? `Optional name prefix hint (may inspire, do not copy verbatim): ${prefix}` : "",
    tagline ? `Tagline mood: ${tagline}` : "",
    appearance ? `Appearance flavor: ${appearance}` : "",
    "",
    "Invent ONE display name that sounds native to this exact mix — not a generic dark-fantasy default.",
    "Never output procedural compounds (Shadowveil, Grimdawn, Nightbane, Dreadmarch, Failfrost, Gearlock).",
    "Prefer realistic given names when the theme is modern/contemporary; theme-native handles or proper nouns otherwise.",
  ].filter(Boolean);

  const raw = parts.join("\n");
  return raw.length <= MAX_BRIEF ? raw : `${raw.slice(0, MAX_BRIEF).trimEnd()}…`;
}
