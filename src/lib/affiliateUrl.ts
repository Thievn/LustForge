/** Normalize affiliate URLs for Shop Now links. Returns null when invalid or placeholder. */
export function normalizeAffiliateUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed || trimmed === "#") return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;

  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed) || trimmed.startsWith("www.")) {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }

  return null;
}

export function isValidAffiliateUrlInput(raw: string | null | undefined): boolean {
  return normalizeAffiliateUrl(raw) !== null;
}

/** Stored value for DB — normalized URL or placeholder when missing. */
export function affiliateUrlForStorage(raw: string | null | undefined): string {
  return normalizeAffiliateUrl(raw) ?? "#";
}
