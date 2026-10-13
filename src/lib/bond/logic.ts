export type BondTier = {
  level: number;
  name: string;
  xp: number;
  nicknames: string[];
  jokes: string[];
  lines: string[];
  unlocks: string[];
};

export const BOND_TIERS: BondTier[] = [
  {
    level: 1,
    name: "Spark",
    xp: 0,
    nicknames: ["you"],
    jokes: [],
    lines: ["I keep checking my phone. Annoying, honestly."],
    unlocks: ["Good-morning texts"],
  },
  {
    level: 2,
    name: "Warm",
    xp: 40,
    nicknames: ["babe"],
    jokes: ["You always text like you're already in the room."],
    lines: ["Come here. I saved you the warm side."],
    unlocks: ["A private nickname"],
  },
  {
    level: 3,
    name: "Close",
    xp: 120,
    nicknames: ["love"],
    jokes: ["Remember when you said you were 'just saying hi'?"],
    lines: ["I know that pause. You're smiling."],
    unlocks: ["Inside jokes", "A longer date scene"],
  },
  {
    level: 4,
    name: "Devoted",
    xp: 280,
    nicknames: ["mine"],
    jokes: ["Don't make me come get you. I will."],
    lines: ["I already decided. You're staying."],
    unlocks: ["Possessive lines", "Velvet-tier scenes"],
  },
  {
    level: 5,
    name: "Yours",
    xp: 520,
    nicknames: ["my love"],
    jokes: ["We have a whole language now. They wouldn't get it."],
    lines: ["There is no version of tonight that doesn't end with you."],
    unlocks: ["Forbidden lines", "Her private name for you"],
  },
];

export function tierForXp(xp: number): BondTier {
  const safe = Math.max(0, Math.floor(xp));
  let current = BOND_TIERS[0]!;
  for (const tier of BOND_TIERS) {
    if (safe >= tier.xp) current = tier;
  }
  return current;
}

export function awardMessageXp(xp: number, messages = 1): number {
  return Math.max(0, Math.floor(xp)) + Math.max(1, messages) * 4;
}

export function nextStreak(streak: number, lastDay: string | null, today: string): { streak: number; changed: boolean } {
  if (!lastDay) return { streak: 1, changed: true };
  if (lastDay === today) return { streak: Math.max(1, streak), changed: false };
  const prev = new Date(`${lastDay}T00:00:00Z`).getTime();
  const now = new Date(`${today}T00:00:00Z`).getTime();
  const diff = Math.round((now - prev) / 86_400_000);
  if (diff === 1) return { streak: Math.max(1, streak) + 1, changed: true };
  return { streak: 1, changed: true };
}

export function moodFor(input: { hour: number; streak: number; feeling?: string | null }): string {
  const feeling = (input.feeling ?? "").toLowerCase();
  if (/miss|ache|lonely/.test(feeling)) return "missing you";
  if (/play|tease|brat/.test(feeling)) return "teasing";
  if (input.streak >= 5) return "devoted";
  if (input.hour < 6) return "soft";
  if (input.hour < 11) return "warm";
  if (input.hour < 17) return "bright";
  if (input.hour < 22) return "close";
  return "restless";
}

export function matchOutfitName(text: string, names: string[]): string | null {
  const hay = text.toLowerCase();
  if (!/\bwear\b|\bput on\b|\bdress in\b/.test(hay)) return null;
  const ranked = [...names].sort((a, b) => b.length - a.length);
  return ranked.find((name) => hay.includes(name.toLowerCase())) ?? null;
}

export type ChapterChoice = { id: string; label: string; reply: string; unlocks?: string };

export function applyStoryChoice(input: {
  chapterCount: number;
  chapterIndex: number;
  choice: ChapterChoice | undefined;
}): { chapterIndex: number; completed: boolean; unlocked: string | null } {
  if (!input.choice) return { chapterIndex: input.chapterIndex, completed: false, unlocked: null };
  const next = input.chapterIndex + 1;
  const completed = next >= input.chapterCount;
  return { chapterIndex: completed ? input.chapterCount - 1 : next, completed, unlocked: input.choice.unlocks ?? null };
}

export function nextGroupSpeaker(ids: string[], last: string | null): string {
  if (!ids.length) throw new Error("Pick at least two companions.");
  if (!last) return ids[0]!;
  const index = ids.indexOf(last);
  return ids[(index + 1) % ids.length]!;
}

export function dailyLine(input: {
  kind: "morning" | "night" | "thinking" | "streak" | "weather";
  name: string;
  mood: string;
  streak: number;
  weather?: string;
}): string {
  const { name, mood, streak } = input;
  if (input.kind === "morning") return `${name} kept the morning for you. Mood: ${mood}.`;
  if (input.kind === "night") return `${name} is not sleeping yet. She wanted the last word.`;
  if (input.kind === "streak") return streak > 1 ? `${streak} days. ${name} noticed.` : `${name} is starting a streak with you.`;
  if (input.kind === "weather") return `${name} looked at the ${input.weather || "sky"} and thought of you.`;
  return `${name} was thinking of you. That's the whole message.`;
}

export function bondPromptBlock(input: {
  memories: Array<{ body: string; feeling: string }>;
  scene?: string | null;
  outfit?: string | null;
  tierName: string;
  nickname: string;
  lines: string[];
  jokes: string[];
  story?: string | null;
}): string {
  const memory = input.memories
    .slice(0, 8)
    .map((item) => `- ${item.body}${item.feeling ? ` (she feels ${item.feeling})` : ""}`)
    .join("\n");
  return [
    "PRIVATE BOND (stay in character, fictional adults 21+):",
    `Closeness: ${input.tierName}. You may call them ${input.nickname} when it fits.`,
    input.lines[0] ? `Voice you can use: ${input.lines.join(" / ")}` : "",
    input.jokes.length ? `Inside jokes, only if they fit: ${input.jokes.join("; ")}` : "",
    input.scene ? `You are here: ${input.scene}` : "",
    input.outfit ? `You are wearing: ${input.outfit}` : "",
    input.story ? `Story you are inside: ${input.story}` : "",
    memory ? `Things you remember:\n${memory}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
