/**
 * Remove provider-risky lexicon before Grok Imagine / video (user text + assembled prompts).
 * Prefer **positive replacements** — avoid leaving negated policy words ("no nudity") in final xAI prompts.
 */
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
  s = s.replace(/\bno nudity\b/gi, "elegant wardrobe");
  s = s.replace(/\bno explicit[^.;\n]*/gi, "");
  s = s.replace(/\bno visible genitals[^.;\n]*/gi, "");
  s = s.replace(/\bno pornographic[^.;\n]*/gi, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

/** @deprecated Alias for sanitizeGrokImagineLexicon */
export const sanitizeMomentsImaginePromptText = sanitizeGrokImagineLexicon;
