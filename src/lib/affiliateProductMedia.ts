export type AffiliateImageFit = "contain" | "cover";
export type AffiliateImageAspect = "auto" | "portrait" | "landscape" | "square";
export type AffiliateMediaType = "image" | "html";

export const ASPECT_PRESET_RATIO: Record<Exclude<AffiliateImageAspect, "auto">, number> = {
  portrait: 3 / 4,
  landscape: 4 / 3,
  square: 1,
};

export const DEFAULT_PORTRAIT_RATIO = 3 / 4;
export const AUTO_ASPECT_MIN = 0.35;
export const AUTO_ASPECT_MAX = 0.85;

export function clampAutoAspectRatio(naturalWidth: number, naturalHeight: number): number {
  if (naturalWidth <= 0 || naturalHeight <= 0) return DEFAULT_PORTRAIT_RATIO;
  const ratio = naturalWidth / naturalHeight;
  return Math.min(AUTO_ASPECT_MAX, Math.max(AUTO_ASPECT_MIN, ratio));
}

export function resolveAspectRatio(
  preset: AffiliateImageAspect,
  detectedRatio: number | null,
): number {
  if (preset !== "auto") return ASPECT_PRESET_RATIO[preset];
  return detectedRatio ?? DEFAULT_PORTRAIT_RATIO;
}

export function normalizeImageFit(value: string | null | undefined): AffiliateImageFit {
  return value === "cover" ? "cover" : "contain";
}

export function normalizeImageAspect(value: string | null | undefined): AffiliateImageAspect {
  if (value === "portrait" || value === "landscape" || value === "square") return value;
  return "auto";
}

export function normalizeMediaType(value: string | null | undefined): AffiliateMediaType {
  return value === "html" ? "html" : "image";
}
