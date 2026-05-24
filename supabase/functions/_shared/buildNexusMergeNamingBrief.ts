/** Naming brief for a dedicated Grok pass when Nexus merge tool output is too generic. */

function slice(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

function themeTab(parent: Record<string, unknown>): string {
  const dna = parent.forge_theme_dna;
  if (!dna || typeof dna !== "object") return "";
  const tab = (dna as Record<string, unknown>).activeForgeTab;
  return typeof tab === "string" ? tab.replace(/_/g, " ").trim() : "";
}

function parentLine(label: string, p: Record<string, unknown>): string[] {
  return [
    `${label} display name: ${slice(p.name, 64) || "unknown"}.`,
    themeTab(p) ? `${label} forge theme tab: ${themeTab(p)}.` : "",
    slice(p.tagline, 120) ? `${label} tagline: ${slice(p.tagline, 120)}` : "",
    slice(p.appearance, 160) ? `${label} appearance: ${slice(p.appearance, 160)}` : "",
    slice(p.personality, 120) ? `${label} personality: ${slice(p.personality, 120)}` : "",
  ].filter(Boolean);
}

export function buildNexusMergeNamingBrief(args: {
  parentA: Record<string, unknown>;
  parentB: Record<string, unknown>;
  fused?: Record<string, unknown>;
  rejectReason?: string;
}): string {
  const fused = args.fused ?? {};
  const parts = [
    "Nexus merge — invent ONE display name for a brand-new hybrid adult companion fused from two parents.",
    "",
    ...parentLine("Parent A", args.parentA),
    ...parentLine("Parent B", args.parentB),
    "",
    slice(fused.gender, 48) ? `Fused gender / presentation: ${slice(fused.gender, 48)}.` : "",
    slice(fused.tagline, 140) ? `Fused tagline mood: ${slice(fused.tagline, 140)}` : "",
    slice(fused.appearance, 180) ? `Fused appearance: ${slice(fused.appearance, 180)}` : "",
    "",
    "The name must sound native to THIS hybrid — not a default gothic generator.",
    "Use realistic given names for modern/contemporary lanes; feudal or mythic forms only when parents' themes demand it.",
    "Do NOT stitch two mood words (Shadowveil, Grimdawn, Failfrost, Gearlock, Nightbane, Dreadmarch, Mourningveil, etc.).",
    "Do NOT copy either parent's full name or distinctive tokens.",
    args.rejectReason
      ? `Previous attempt rejected because: ${args.rejectReason}. Invent something clearly different.`
      : "",
    "",
    "Output only the name (2–4 words max, or one rare non-compound label).",
  ].filter(Boolean);

  const raw = parts.join("\n");
  return raw.length <= 1400 ? raw : `${raw.slice(0, 1400).trimEnd()}…`;
}
