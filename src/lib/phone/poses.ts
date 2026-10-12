/** Hidden keyword → pose id. Never render these ids in the UI. */

export type PoseRule = {
  id: string;
  keywords: string[];
};

export const POSE_RULES: PoseRule[] = [
  { id: "couch_lying_03", keywords: ["couch", "sofa", "lying on", "laying on"] },
  { id: "mirror_selfie_01", keywords: ["mirror", "selfie"] },
  { id: "kneeling_02", keywords: ["on your knees", "on my knees", "kneeling"] },
  { id: "bed_reclining_04", keywords: ["in bed", "on the bed", "pillow"] },
  { id: "standing_portrait_01", keywords: ["standing", "full body", "head to toe"] },
];

export function matchPoseId(text: string): string | null {
  const hay = text.toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const rule of POSE_RULES) {
    const score = rule.keywords.reduce((sum, word) => (hay.includes(word) ? sum + word.length : sum), 0);
    if (score > 0 && (!best || score > best.score)) best = { id: rule.id, score };
  }
  return best?.id ?? null;
}
