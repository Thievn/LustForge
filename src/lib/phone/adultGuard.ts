/** Block sexual or romantic content that targets anyone under 21. Characters are fictional adults 21+. */

const UNDERAGE_PATTERNS: RegExp[] = [
  /\b(underage|under[\s-]?age|minor|minors|child|children|preteen|pre-teen|lolita|loli|shota|shotacon|jailbait|pedo|paedo)\b/i,
  /\b(teen|teens|teenage|teenager|schoolgirl|schoolboy|high[\s-]?school)\b/i,
  /\b(1[0-7]|[0-9]|20)\s*(yo|y\.?\s*o\.?|years?\s*old)\b/i,
  /\b(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*(years?\s*old|yo)\b/i,
  /\b(1[0-7]|[0-9]|20)\s*[- ]?\s*year[- ]old\b/i,
];

export function minorReason(text: string | null | undefined): string | null {
  const value = (text ?? "").trim();
  if (!value) return null;
  for (const pattern of UNDERAGE_PATTERNS) {
    if (pattern.test(value)) {
      return "LustForge only allows fictional consenting adults who are 21 or older.";
    }
  }
  return null;
}

export function ageIsAdult(age: number | null | undefined): boolean {
  return typeof age === "number" && Number.isFinite(age) && age >= 21 && age <= 99;
}

export const ADULT_ANCHOR =
  "fictional consenting adult, age 21 or older, mature face, not a minor, not a teenager";
