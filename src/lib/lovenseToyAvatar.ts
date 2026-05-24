/** Deterministic “product tile” when Lovense does not send image_url — DiceBear SVG. */
export function lovenseToyAvatarUrl(seed: string, toyType?: string): string {
  const typeSeed = toyType?.trim().toLowerCase();
  const s = typeSeed && typeSeed !== "unknown" ? typeSeed : seed.trim() || "toy";
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(s)}&backgroundColor=0a0a12,1a0a1a,2d0a2d`;
}
