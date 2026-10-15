import { supabase } from "@/integrations/supabase/client";

export const VOICE_TEASER_MAX = 170;

export type VoiceSource = {
  name: string;
  tagline?: string | null;
  bio?: string | null;
  backstory?: string | null;
  personality?: string | null;
  appearance?: string | null;
  role?: string | null;
};

export type VoiceCopy = {
  teaser: string;
  story: string;
};

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

function firstName(name: string): string {
  const bit = name.trim().split(/\s+/)[0] ?? name.trim();
  return bit || "I";
}

/** Swap a leading name or pronoun for "I" without adding new facts. */
function toFirstPerson(sentence: string, name: string): string {
  const full = name.trim();
  const first = firstName(full);
  let s = sentence.trim();
  const patterns = [full, first].filter((p) => p.length > 1);
  for (const p of patterns) {
    const re = new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(is|was|has|feels|keeps|lives|wears)\\b`, "i");
    if (re.test(s)) {
      s = s.replace(re, (_m, verb: string) => {
        const v = verb.toLowerCase();
        if (v === "is") return "I'm";
        if (v === "was") return "I was";
        if (v === "has") return "I've";
        return `I ${v}`;
      });
      return s;
    }
  }
  if (/^(she|he)\s+is\b/i.test(s)) return s.replace(/^(she|he)\s+is\b/i, "I'm");
  if (/^(she|he)\s+was\b/i.test(s)) return s.replace(/^(she|he)\s+was\b/i, "I was");
  if (/^(she|he)\b/i.test(s)) return s.replace(/^(she|he)\b/i, "I");
  if (/^they\s+are\b/i.test(s)) return s.replace(/^they\s+are\b/i, "I'm");
  if (/^they\b/i.test(s)) return s.replace(/^they\b/i, "I");
  return s;
}

function clampTeaser(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= VOICE_TEASER_MAX) return clean;
  const cut = clean.slice(0, VOICE_TEASER_MAX - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 80 ? cut.slice(0, space) : cut).replace(/[,;:\s]+$/, "")}…`;
}

/**
 * Grounded fallback when generated columns are empty.
 * Uses only sentences already on the companion. Does not invent biography.
 */
export function deriveVoiceCopy(source: VoiceSource, stored?: { teaser?: string | null; story?: string | null }): VoiceCopy {
  const storedTeaser = stored?.teaser?.trim() ?? "";
  const storedStory = stored?.story?.trim() ?? "";
  if (storedTeaser && storedStory) {
    return { teaser: clampTeaser(storedTeaser), story: storedStory };
  }

  const name = source.name.trim() || "I";
  const bioBits = sentences(source.bio ?? "");
  const storyBits = sentences(source.backstory ?? "");
  const tag = (source.tagline ?? "").trim().replace(/[.?!]$/, "");

  let teaser = storedTeaser;
  if (!teaser) {
    const opening = bioBits[0] ? toFirstPerson(bioBits[0], name) : "";
    if (/^(i|i'm|i’m)\b/i.test(opening)) {
      teaser = opening;
    } else if (tag) {
      teaser = `I'm ${firstName(name)}. ${tag}.`;
      if (opening && !opening.toLowerCase().includes(tag.toLowerCase())) {
        teaser = `${teaser} ${toFirstPerson(opening, name)}`;
      }
    } else if (opening) {
      teaser = `I'm ${firstName(name)}. ${toFirstPerson(opening, name)}`;
    } else {
      teaser = `I'm ${firstName(name)}. Come closer — I've been waiting for you.`;
    }
  }

  let story = storedStory;
  if (!story) {
    const pool = (storyBits.length ? storyBits : bioBits).slice(0, 4).map((s) => toFirstPerson(s, name));
    if (pool.length >= 3) story = pool.join(" ");
    else if (pool.length) {
      const extra = bioBits
        .map((s) => toFirstPerson(s, name))
        .filter((s) => !pool.includes(s))
        .slice(0, 4 - pool.length);
      story = [...pool, ...extra].join(" ");
    }
    if (!story) {
      const personality = sentences(source.personality ?? "")[0];
      story = [
        `I'm ${firstName(name)}.`,
        tag ? `${tag}.` : "",
        personality ? toFirstPerson(personality, name) : "Stay with me a while.",
      ]
        .filter(Boolean)
        .join(" ");
    }
  }

  return { teaser: clampTeaser(teaser), story: story.trim() };
}

export async function generateVoiceCopy(source: VoiceSource): Promise<VoiceCopy | null> {
  const { data, error } = await supabase.functions.invoke("grok-chat", {
    body: {
      intent: "voice_copy",
      voiceSource: {
        name: source.name,
        tagline: source.tagline ?? "",
        bio: source.bio ?? "",
        backstory: source.backstory ?? "",
        personality: source.personality ?? "",
        appearance: source.appearance ?? "",
        role: source.role ?? "",
      },
    },
  });
  if (error || !data || typeof data !== "object") return null;
  const teaser = typeof (data as { voice_teaser?: unknown }).voice_teaser === "string"
    ? (data as { voice_teaser: string }).voice_teaser.trim()
    : "";
  const story = typeof (data as { voice_story?: unknown }).voice_story === "string"
    ? (data as { voice_story: string }).voice_story.trim()
    : "";
  if (!teaser || !story) return null;
  return { teaser: clampTeaser(teaser), story };
}

export async function persistVoiceCopy(
  table: "companions" | "custom_characters",
  id: string,
  copy: VoiceCopy,
): Promise<{ ok: boolean; missingColumn?: boolean }> {
  const { error } = await supabase
    .from(table)
    .update({ voice_teaser: copy.teaser, voice_story: copy.story })
    .eq("id", id);
  if (!error) return { ok: true };
  const msg = error.message ?? "";
  if (/voice_teaser|voice_story|PGRST204/i.test(msg)) return { ok: false, missingColumn: true };
  return { ok: false };
}

/** Prefer Grok in her voice; fall back to a grounded rewrite of fields she already has. */
export async function ensureVoiceCopy(
  table: "companions" | "custom_characters",
  id: string,
  source: VoiceSource,
): Promise<VoiceCopy> {
  const generated = await generateVoiceCopy(source).catch(() => null);
  const copy = generated ?? deriveVoiceCopy(source);
  await persistVoiceCopy(table, id, copy);
  return copy;
}
