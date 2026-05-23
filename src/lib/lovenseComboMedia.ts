import type { AffiliateShopProduct } from "@/hooks/useAffiliateShop";
import type { DbCompanion } from "@/hooks/useCompanions";
import {
  galleryStaticPortraitUrl,
  isVideoPortraitUrl,
  profileAnimatedPortraitUrl,
  resolvePublicLoopPortraitVideoUrlForX,
} from "@/lib/companionMedia";
import { absolutizeMediaUrl } from "@/lib/xMarketingFramedVideoBake";

export type LovenseComboMediaResult = {
  /** [companion media, product banner] — ready for Zernio mediaUrls */
  mediaUrls: string[];
  companionUrl: string | null;
  productUrl: string | null;
  companionIsVideo: boolean;
  warnings: string[];
};

export function isPublicHttpMediaUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) return false;
  return /^https?:\/\//i.test(url.trim());
}

/** Companion loop MP4/WebM first, then animated URL, then still portrait. */
export function resolveCompanionMediaUrlForX(companion: DbCompanion): {
  url: string | null;
  isVideo: boolean;
  warning?: string;
} {
  const loop = resolvePublicLoopPortraitVideoUrlForX(companion);
  if (loop) return { url: loop.split("?")[0]!, isVideo: true };

  const animated = profileAnimatedPortraitUrl(companion);
  if (animated) {
    const abs = absolutizeMediaUrl(animated).split("?")[0]!;
    if (isPublicHttpMediaUrl(abs)) {
      return {
        url: abs,
        isVideo: isVideoPortraitUrl(abs),
        warning: isVideoPortraitUrl(abs)
          ? undefined
          : "Using animated/still portrait — no loop video on this companion.",
      };
    }
  }

  const still = galleryStaticPortraitUrl(companion, companion.id);
  if (still) {
    const abs = absolutizeMediaUrl(still).split("?")[0]!;
    if (isPublicHttpMediaUrl(abs)) {
      return {
        url: abs,
        isVideo: false,
        warning: "No loop video — companion will post as a still image on X.",
      };
    }
  }

  return { url: null, isVideo: false, warning: "Could not resolve a public portrait URL for this companion." };
}

export function resolveProductBannerUrl(product: Pick<AffiliateShopProduct, "image_url">): string | null {
  const raw = product.image_url?.trim();
  if (!raw) return null;
  const abs = absolutizeMediaUrl(raw).split("?")[0]!;
  return isPublicHttpMediaUrl(abs) ? abs : null;
}

/** Dual attach: animated companion + raw Lovense banner (no baked PNG). */
export function resolveLovenseComboMediaUrls(
  companion: DbCompanion,
  product: Pick<AffiliateShopProduct, "image_url">,
): LovenseComboMediaResult {
  const warnings: string[] = [];
  const { url: companionUrl, isVideo, warning: companionWarning } = resolveCompanionMediaUrlForX(companion);
  if (companionWarning) warnings.push(companionWarning);
  if (!companionUrl) warnings.push("Select a companion with a loop video or portrait.");

  const productUrl = resolveProductBannerUrl(product);
  if (!productUrl) warnings.push("Product needs a banner image in Affiliate Shop.");

  const mediaUrls: string[] = [];
  if (companionUrl) mediaUrls.push(companionUrl);
  if (productUrl) mediaUrls.push(productUrl);

  return {
    mediaUrls,
    companionUrl,
    productUrl,
    companionIsVideo: isVideo,
    warnings,
  };
}
