/**
 * Client mirror of Edge `momentsPromptSanitize.ts` — keep in sync for Imagine-bound brief text.
 */

export const FORGE_PERSONALITY_IMAGINE_SAFE: Record<string, string> = {
  "Pure & Innocent": "sweet and demure",
  "Submissive & Eager": "eager and devoted",
  Switch: "playful switch energy",
  "Sensual & Romantic": "sensual and romantic",
  "Shameless Slut": "bold shameless flirt",
  "Dominant & Controlling": "confident commanding",
  "Bratty Masochist": "bratty teasing",
  "Depraved & Extreme": "intense passionate edge",
};

function replaceWholePhrase(text: string, from: string, to: string): string {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), to);
}

export function sanitizeForgePersonalityAndKinkLabels(input: string): string {
  let s = input;
  for (const [from, to] of Object.entries(FORGE_PERSONALITY_IMAGINE_SAFE)) {
    s = replaceWholePhrase(s, from, to);
  }
  return s;
}

export function sanitizeGrokImagineLexicon(input: string): string {
  let s = input;
  s = s.replace(/\bartistic\s+nude\b/gi, "artistic sensual editorial");
  s = s.replace(/\bfull(?:y)?\s+nude\b/gi, "fully styled sensual editorial");
  s = s.replace(/\bpartial\s+nude\b/gi, "partially sheer editorial");
  s = s.replace(/\bsensual\s+nude\b/gi, "tasteful sensual editorial");
  s = s.replace(/\bimplied\s+nude\b/gi, "implied sheer coverage");
  s = s.replace(/\b(nudity|nudes)\b/gi, "editorial coverage");
  s = s.replace(/\bnude\b/gi, "editorial styling");
  s = s.replace(/\bnaked\b/gi, "wardrobe-forward clothed or sheer");
  s = s.replace(/\btopless\b/gi, "shoulder-baring editorial top");
  s = s.replace(/\bbottomless\b/gi, "high-waisted editorial styling");
  s = s.replace(/\bgenitals?\b/gi, "silhouette");
  s = s.replace(/\bnipples?\b/gi, "covered décolletage");
  s = s.replace(/\bporn(?:ography|ographic)?\b/gi, "editorial glamour");
  s = s.replace(/\bxxx\b/gi, "editorial");
  s = s.replace(/\bnsfw\b/gi, "editorial tease");
  s = s.replace(/\blewd\b/gi, "sensual editorial");
  s = s.replace(/\bslut(?:ty|s)?\b/gi, "bold flirt");
  s = s.replace(/\bdeprav(?:ed|ity)\b/gi, "intense passion");
  s = s.replace(/\bbdsm\b/gi, "editorial power dynamic");
  s = s.replace(/\bbondage\b/gi, "styled restraint aesthetic");
  s = s.replace(/\bfetish(?:es|istic)?\b/gi, "signature style");
  s = s.replace(/\bsubmissive\b/gi, "devoted");
  s = s.replace(/\bdominatrix\b/gi, "confident lead");
  s = s.replace(/\bdominant\b/gi, "commanding");
  s = s.replace(/\bwhore(?:s)?\b/gi, "glamour muse");
  s = s.replace(/\borgy\b/gi, "group glamour");
  s = s.replace(/\bexplicit(?:ly)?\s+(?:sexual|sex)\b/gi, "sensual editorial");
  s = s.replace(/\bexplicit\b/gi, "editorial");
  s = s.replace(/\bsexual(?:ly)?\b/gi, "sensual");
  s = s.replace(/\bsex acts?\b/gi, "intimate editorial mood");
  s = s.replace(/\bintercourse\b/gi, "romantic tension");
  s = s.replace(/\bpenetration\b/gi, "close editorial framing");
  s = s.replace(/\borgasm\w*\b/gi, "blissful expression");
  s = s.replace(/\bmasturbat\w*\b/gi, "self-possessed pose");
  s = s.replace(/\berection\b/gi, "confident posture");
  s = s.replace(/\bpenis(?:es)?\b/gi, "anatomy");
  s = s.replace(/\bvaginas?\b/gi, "silhouette");
  s = s.replace(/\bclit(?:oris)?\b/gi, "silhouette");
  s = s.replace(/\bpussy\b/gi, "silhouette");
  s = s.replace(/\bdicks?\b/gi, "silhouette");
  s = s.replace(/\bcock\b/gi, "silhouette");
  s = s.replace(/\bcum(?:shot|slut)?s?\b/gi, "glossy skin highlight");
  s = s.replace(/\bfuck(?:s|ed|ing)?\b/gi, "passionate");
  s = s.replace(/\brape\b/gi, "intense");
  s = s.replace(/\bhardcore\b/gi, "bold editorial");
  s = s.replace(/\bundress(?:ing)?\b/gi, "fabric adjustment");
  s = s.replace(/\bstrip(?:ping| tease)?\b/gi, "fabric tease");
  s = s.replace(/\bfuta\b/gi, "fantasy hybrid silhouette");
  s = s.replace(/\bno nudity\b/gi, "elegant wardrobe");
  s = s.replace(/\bno bare skin[^.;\n]*/gi, "");
  s = s.replace(/\bno explicit[^.;\n]*/gi, "");
  s = s.replace(/\bno visible genitals[^.;\n]*/gi, "");
  s = s.replace(/\bno pornographic[^.;\n]*/gi, "");
  s = s.replace(/\bno sexual acts[^.;\n]*/gi, "");
  s = sanitizeForgePersonalityAndKinkLabels(s);
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

export function sanitizeImagineProfileText(input: string, maxChars = 2000): string {
  const t = sanitizeGrokImagineLexicon(String(input ?? "").replace(/\s+/g, " ").trim());
  if (!t) return "";
  return t.length <= maxChars ? t : `${t.slice(0, maxChars).trimEnd()}…`;
}
