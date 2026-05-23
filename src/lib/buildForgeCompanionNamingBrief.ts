import type { ForgePersonalityProfile } from "@/lib/forgePersonalityProfile";
import { forgePersonalitySeedsProse } from "@/lib/forgePersonalityProfile";
import type { ForgeThemeTabId } from "@/lib/forgeThemeTabs";
import { FORGE_THEME_TABS } from "@/lib/forgeThemeTabs";

const MAX_BRIEF = 1200;

function sliceField(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

export type ForgeCompanionNamingContext = {
  gender: string;
  forgePersonality: ForgePersonalityProfile;
  activeForgeTab?: ForgeThemeTabId | string;
  /** e.g. "Anime Temptation — soft pastel tease" */
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

/**
 * Compact prose brief for Grok forge companion naming (edge `naming_brief`).
 */
export function buildForgeCompanionNamingBrief(ctx: ForgeCompanionNamingContext): string {
  const gender = sliceField(ctx.gender, 48) || "non-binary";
  const tabId = typeof ctx.activeForgeTab === "string" ? ctx.activeForgeTab.trim() : "";
  const tabLabel =
    FORGE_THEME_TABS.find((t) => t.id === tabId)?.label ??
    (tabId ? tabId.replace(/_/g, " ") : "");
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
    forgePersonalitySeedsProse(ctx.forgePersonality),
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
  ].filter(Boolean);

  const raw = parts.join("\n");
  return raw.length <= MAX_BRIEF ? raw : `${raw.slice(0, MAX_BRIEF).trimEnd()}…`;
}
