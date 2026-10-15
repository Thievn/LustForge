import { ExternalLink } from "lucide-react";
import { AffiliateProductMedia } from "@/components/affiliate/AffiliateProductMedia";
import { normalizeAffiliateUrl } from "@/lib/affiliateUrl";
import { LOVENSE_NEON } from "@/lib/lovenseProductCardTheme";
import { normalizeMediaType } from "@/lib/affiliateProductMedia";
import type { AffiliateShopProduct } from "@/hooks/useAffiliateShop";
import { cn } from "@/lib/utils";

type Props = {
  product: Pick<
    AffiliateShopProduct,
    | "name"
    | "description"
    | "image_url"
    | "badge"
    | "affiliate_url"
    | "media_type"
    | "media_html"
    | "image_fit"
    | "image_aspect"
  >;
  shopHref?: string | null;
  interactive?: boolean;
  className?: string;
};

function ShopNowButton({ href, className }: { href: string | null; className?: string }) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
          "border border-white/10 transition-all hover:scale-[1.02]",
          "shadow-[0_0_20px_rgba(214,51,108,0.2)]",
          className,
        )}
        style={{
          background: `linear-gradient(135deg, ${LOVENSE_NEON}, hsl(280 48% 40%))`,
        }}
      >
        Shop Now
        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
      </a>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
        "cursor-not-allowed border border-white/10 bg-white/[0.04] text-muted-foreground",
        className,
      )}
    >
      Shop Now — link needed
    </span>
  );
}

/** Public /toys card — banner (auto-sized) + text + CTA, no heavy chrome. */
export function AffiliateShopProductCard({
  product,
  shopHref: shopHrefProp,
  interactive = false,
  className,
}: Props) {
  const shopHref = shopHrefProp !== undefined ? shopHrefProp : normalizeAffiliateUrl(product.affiliate_url);
  const mediaType = normalizeMediaType(product.media_type);
  const imageUrl = product.image_url?.trim();

  return (
    <article className={cn("group flex flex-col gap-3", className)}>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0a0a10]">
        {mediaType === "html" && product.media_html?.trim() ? (
          <AffiliateProductMedia
            name={product.name}
            imageUrl={product.image_url}
            badge={product.badge}
            imageFit={product.image_fit}
            imageAspect="auto"
            mediaType={product.media_type}
            mediaHtml={product.media_html}
            bare
            interactive={interactive}
          />
        ) : imageUrl ? (
          <div className="relative">
            {product.badge?.trim() ? (
              <span className="absolute left-2 top-2 z-[2] rounded-full border border-[#D6336C]/40 bg-[#1B1620]/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#D6336C] backdrop-blur-sm">
                {product.badge.trim()}
              </span>
            ) : null}
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              className={cn(
                "block w-full h-auto",
                interactive && "transition-transform duration-300 group-hover:scale-[1.01]",
              )}
            />
          </div>
        ) : (
          <AffiliateProductMedia
            name={product.name}
            imageUrl={null}
            badge={product.badge}
            imageAspect="landscape"
            bare
          />
        )}
      </div>

      <div className="flex flex-col gap-2 px-0.5">
        <h3 className="font-gothic text-lg text-foreground/95">{product.name}</h3>
        {product.description?.trim() ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{product.description.trim()}</p>
        ) : null}
        <ShopNowButton href={shopHref} className="mt-1 w-full sm:w-auto" />
      </div>
    </article>
  );
}
