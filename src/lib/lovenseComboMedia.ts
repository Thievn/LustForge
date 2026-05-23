import type { AffiliateShopProduct } from "@/hooks/useAffiliateShop";
import type { DbCompanion } from "@/hooks/useCompanions";
import {
  galleryStaticPortraitUrl,
  isVideoPortraitUrl,
  profileAnimatedPortraitUrl,
  resolvePublicLoopPortraitVideoUrlForX,
} from "@/lib/companionMedia";
import { absolutizeMediaUrl } from "@/lib/xMarketingFramedVideoBake";

/** How Lovense promo posts attach media — must respect X: 1 video OR up to 4 images, never mixed. */
export type LovenseXMediaStrategy =
  | "companion_video"
  | "companion_still"
  | "dual_stills"
  | "product_banner";

export type LovensePromoMediaResult = {
  mediaUrls: string[];
  companionUrl: string | null;
  productUrl: string | null;
  hasVideo: boolean;
  hasImage: boolean;
  warnings: string[];
  xPlatformNote: string | null;
};

export function isPublicHttpMediaUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) return false;
  return /^https?:\/\//i.test(url.trim());
}

export function mediaUrlsMixVideoAndImages(urls: string[]): boolean {
  let hasVideo = false;
  let hasImage = false;
  for (const url of urls) {
    if (isVideoPortraitUrl(url)) hasVideo = true;
    else hasImage = true;
  }
  return hasVideo && hasImage;
}

/** Companion loop MP4 first, then animated URL, then still portrait. */
export function resolveCompanionMediaUrlForX(
  companion: DbCompanion,
  preferVideo: boolean,
): {
  url: string | null;
  isVideo: boolean;
  warning?: string;
} {
  if (preferVideo) {
    const loop = resolvePublicLoopPortraitVideoUrlForX(companion);
    if (loop) return { url: loop.split("?")[0]!, isVideo: true };
  }

  const animated = profileAnimatedPortraitUrl(companion);
  if (animated) {
    const abs = absolutizeMediaUrl(animated).split("?")[0]!;
    if (isPublicHttpMediaUrl(abs)) {
      const isVideo = isVideoPortraitUrl(abs);
      if (isVideo) return { url: abs, isVideo: true };
      if (!preferVideo) return { url: abs, isVideo: false };
    }
  }

  const still = galleryStaticPortraitUrl(companion, companion.id);
  if (still) {
    const abs = absolutizeMediaUrl(still).split("?")[0]!;
    if (isPublicHttpMediaUrl(abs)) {
      return {
        url: abs,
        isVideo: false,
        warning: preferVideo ? "No loop video — using still portrait on X." : undefined,
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

export function resolveLovensePromoMediaUrls(args: {
  strategy: LovenseXMediaStrategy;
  companion?: DbCompanion | null;
  product?: Pick<AffiliateShopProduct, "image_url"> | null;
}): LovensePromoMediaResult {
  const warnings: string[] = [];
  const { strategy, companion, product } = args;

  let companionUrl: string | null = null;
  let productUrl: string | null = null;
  let hasVideo = false;
  let hasImage = false;
  let xPlatformNote: string | null = null;

  if (product) {
    productUrl = resolveProductBannerUrl(product);
    if (!productUrl) warnings.push("Product needs a banner image in Affiliate Shop.");
  }

  if (companion) {
    const preferVideo = strategy === "companion_video";
    const { url, isVideo, warning } = resolveCompanionMediaUrlForX(companion, preferVideo);
    companionUrl = url;
    if (isVideo) hasVideo = true;
    else if (url) hasImage = true;
    if (warning) warnings.push(warning);
  }

  const mediaUrls: string[] = [];

  switch (strategy) {
    case "companion_video": {
      if (companionUrl) {
        if (!hasVideo) warnings.push("Companion video not found — pick a companion with profile loop enabled.");
        mediaUrls.push(companionUrl);
      } else {
        warnings.push("Select a companion with a loop video.");
      }
      xPlatformNote = "X allows 1 video per tweet (product mentioned in copy + /toys link).";
      break;
    }
    case "companion_still": {
      if (companion) {
        const still = resolveCompanionMediaUrlForX(companion, false);
        if (still.url) {
          companionUrl = still.url;
          mediaUrls.push(still.url);
          hasVideo = false;
          hasImage = true;
          if (still.warning) warnings.push(still.warning);
        }
      }
      xPlatformNote = "Single companion image — tease the toy in tweet text.";
      break;
    }
    case "dual_stills": {
      if (companion) {
        const still = resolveCompanionMediaUrlForX(companion, false);
        companionUrl = still.url;
        if (still.url) {
          mediaUrls.push(still.url);
          hasImage = true;
        }
        if (still.warning) warnings.push(still.warning);
      }
      if (productUrl) {
        mediaUrls.push(productUrl);
        hasImage = true;
      }
      xPlatformNote =
        "X shows 2 images side-by-side. Portrait + landscape may letterbox — that is normal on X, not a Zernio bug.";
      break;
    }
    case "product_banner": {
      if (productUrl) {
        mediaUrls.push(productUrl);
        hasImage = true;
      }
      xPlatformNote = "Single product banner — companion referenced in copy only.";
      break;
    }
  }

  if (mediaUrlsMixVideoAndImages(mediaUrls)) {
    warnings.unshift(
      "Invalid for X: cannot mix video and images in one tweet. Zernio will fail — change media strategy.",
    );
  }

  return {
    mediaUrls,
    companionUrl,
    productUrl,
    hasVideo,
    hasImage,
    warnings,
    xPlatformNote,
  };
}

/** @deprecated use resolveLovensePromoMediaUrls with dual_stills */
export function resolveLovenseComboMediaUrls(
  companion: DbCompanion,
  product: Pick<AffiliateShopProduct, "image_url">,
): LovensePromoMediaResult {
  return resolveLovensePromoMediaUrls({ strategy: "dual_stills", companion, product });
}
