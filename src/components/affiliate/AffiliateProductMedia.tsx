import { useEffect, useMemo, useState } from "react";
import {
  clampAutoAspectRatio,
  normalizeImageAspect,
  normalizeImageFit,
  normalizeMediaType,
  resolveAspectRatio,
  type AffiliateImageAspect,
  type AffiliateImageFit,
  type AffiliateMediaType,
} from "@/lib/affiliateProductMedia";
import { sanitizeAffiliateHtml } from "@/lib/sanitizeAffiliateHtml";
import { cn } from "@/lib/utils";

export type AffiliateProductMediaProps = {
  name: string;
  imageUrl?: string | null;
  badge?: string | null;
  imageFit?: AffiliateImageFit | string | null;
  imageAspect?: AffiliateImageAspect | string | null;
  mediaType?: AffiliateMediaType | string | null;
  mediaHtml?: string | null;
  className?: string;
  /** Enable hover scale on shop cards */
  interactive?: boolean;
  /** Plain image only — no blur backdrop or gradient overlay */
  bare?: boolean;
};

export function AffiliateProductMedia({
  name,
  imageUrl,
  badge,
  imageFit: imageFitProp,
  imageAspect: imageAspectProp,
  mediaType: mediaTypeProp,
  mediaHtml,
  className,
  interactive = false,
  bare = false,
}: AffiliateProductMediaProps) {
  const imageFit = normalizeImageFit(imageFitProp);
  const imageAspect = normalizeImageAspect(imageAspectProp);
  const mediaType = normalizeMediaType(mediaTypeProp);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const [detectedRatio, setDetectedRatio] = useState<number | null>(null);
  const aspectRatio = resolveAspectRatio(imageAspect, detectedRatio);

  useEffect(() => {
    setDetectedRatio(null);
  }, [imageUrl, imageAspect, mediaType]);

  const sanitizedHtml = useMemo(() => {
    if (mediaType !== "html") return "";
    return sanitizeAffiliateHtml(mediaHtml);
  }, [mediaType, mediaHtml]);

  const showHtml = mediaType === "html" && sanitizedHtml.length > 0;
  const showImage = !showHtml && Boolean(imageUrl?.trim());

  return (
    <div
      className={cn("relative w-full overflow-hidden bg-[#0a0a10]", className)}
      style={{ aspectRatio }}
    >
      {showHtml ? (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-br from-[hsl(280_45%_14%)] to-[hsl(330_60%_16%)]"
            aria-hidden
          />
          <div
            className="relative z-[1] flex h-full w-full items-center justify-center p-2 [&_img]:max-h-full [&_img]:max-w-full [&_img]:object-contain [&_iframe]:max-h-full [&_iframe]:w-full [&_video]:max-h-full [&_video]:max-w-full"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </>
      ) : showImage ? (
        bare ? (
          <img
            src={imageUrl!}
            alt={name}
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (imageAspect === "auto") {
                setDetectedRatio(clampAutoAspectRatio(img.naturalWidth, img.naturalHeight));
              }
            }}
            className={cn(
              "h-full w-full",
              imageFit === "cover" ? "object-cover" : "object-contain",
              interactive && "transition-transform duration-300 group-hover:scale-[1.02]",
            )}
          />
        ) : (
          <>
            <img
              src={imageUrl!}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-50 saturate-125"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#050508]/40 via-[#050508]/20 to-[#050508]/55"
              aria-hidden
            />
            <img
              src={imageUrl!}
              alt={name}
              loading="lazy"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (imageAspect === "auto") {
                  setDetectedRatio(clampAutoAspectRatio(img.naturalWidth, img.naturalHeight));
                }
              }}
              className={cn(
                "relative z-[1] h-full w-full transition-transform duration-500",
                imageFit === "cover" ? "object-cover" : "object-contain",
                interactive && "group-hover:scale-[1.03]",
              )}
            />
          </>
        )
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: "linear-gradient(145deg, hsl(280 45% 18%), hsl(330 70% 22%))",
          }}
        >
          <span className="font-gothic text-5xl text-white/25">{initial}</span>
        </div>
      )}

      {badge ? (
        <span className="absolute left-3 top-3 z-[2] rounded-full border border-[#FF2D7B]/40 bg-[#050508]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#FF2D7B] backdrop-blur-sm">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
