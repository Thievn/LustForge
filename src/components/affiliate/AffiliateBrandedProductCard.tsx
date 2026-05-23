import { ExternalLink } from "lucide-react";
import { AffiliateProductMedia } from "@/components/affiliate/AffiliateProductMedia";
import { normalizeAffiliateUrl } from "@/lib/affiliateUrl";
import {
  LOVENSE_CARD_ASPECT,
  LOVENSE_CARD_BG,
  LOVENSE_GLOW_STYLE,
  LOVENSE_NEON,
} from "@/lib/lovenseProductCardTheme";
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
  /** Override normalized shop link (e.g. admin preview before save) */
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
          "shadow-[0_0_20px_rgba(255,45,123,0.25)]",
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

function ProductImagePanel({
  product,
  interactive,
  className,
}: {
  product: Props["product"];
  interactive?: boolean;
  className?: string;
}) {
  const mediaType = normalizeMediaType(product.media_type);
  const imageUrl = product.image_url?.trim();
  const initial = product.name.trim().charAt(0).toUpperCase() || "?";

  if (mediaType === "html" && product.media_html?.trim()) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden rounded-xl", className)}>
        <AffiliateProductMedia
          name={product.name}
          imageUrl={product.image_url}
          badge={null}
          imageFit={product.image_fit}
          imageAspect="landscape"
          mediaType={product.media_type}
          mediaHtml={product.media_html}
          className="h-full rounded-xl"
          interactive={interactive}
        />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-xl border border-[#FF2D7B]/35 bg-white/[0.03]",
          className,
        )}
      >
        <img
          src={imageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-40 saturate-125"
        />
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className={cn(
            "relative z-[1] h-full w-full object-contain p-1 sm:p-2 transition-transform duration-500",
            interactive && "group-hover:scale-[1.02]",
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-[#FF2D7B]/25",
        className,
      )}
      style={{
        background: "linear-gradient(145deg, hsl(280 45% 18%), hsl(330 70% 22%))",
      }}
    >
      <span className="font-gothic text-5xl text-white/25">{initial}</span>
    </div>
  );
}

export function AffiliateBrandedProductCard({
  product,
  shopHref: shopHrefProp,
  interactive = false,
  className,
}: Props) {
  const shopHref = shopHrefProp !== undefined ? shopHrefProp : normalizeAffiliateUrl(product.affiliate_url);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08]",
        "transition-all duration-300 hover:border-[#FF2D7B]/35 hover:shadow-[0_0_32px_rgba(255,45,123,0.12)]",
        className,
      )}
    >
      <div className="absolute inset-0" style={{ background: LOVENSE_CARD_BG }} aria-hidden />
      <div className="absolute inset-0 pointer-events-none" style={LOVENSE_GLOW_STYLE} aria-hidden />

      {/* Mobile: image top, text below */}
      <div className="relative flex flex-col md:hidden">
        <div className="w-full" style={{ aspectRatio: LOVENSE_CARD_ASPECT }}>
          <div className="h-full p-3 pb-0">
            <ProductImagePanel product={product} interactive={interactive} className="h-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 pt-3">
          <CardTextContent product={product} />
          <ShopNowButton href={shopHref} className="w-full" />
        </div>
      </div>

      {/* Desktop: side-by-side 16:9 */}
      <div
        className="relative hidden md:grid md:grid-cols-[45%_55%]"
        style={{ aspectRatio: LOVENSE_CARD_ASPECT }}
      >
        <div className="flex flex-col justify-between p-5 lg:p-6 min-h-0">
          <CardTextContent product={product} />
          <div className="mt-4 shrink-0">
            <ShopNowButton href={shopHref} className="w-full sm:w-auto" />
          </div>
        </div>
        <div className="p-4 pl-0 min-h-0">
          <ProductImagePanel product={product} interactive={interactive} className="h-full" />
        </div>
      </div>
    </article>
  );
}

function CardTextContent({ product }: { product: Props["product"] }) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: `${LOVENSE_NEON}eb` }}>
        LustForge × Lovense
      </p>
      {product.badge?.trim() ? (
        <span className="inline-block rounded-lg border border-[#FF2D7B]/45 bg-[#FF2D7B]/[0.18] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ffb8d9]">
          {product.badge.trim()}
        </span>
      ) : null}
      <h3 className="font-gothic text-xl lg:text-2xl text-white leading-tight">{product.name}</h3>
      {product.description?.trim() ? (
        <p className="text-sm leading-relaxed text-white/70 line-clamp-3">{product.description.trim()}</p>
      ) : null}
    </div>
  );
}
