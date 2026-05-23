-- Affiliate shop: per-product media display controls + optional HTML embed

ALTER TABLE public.affiliate_shop_products
  ADD COLUMN IF NOT EXISTS image_fit text NOT NULL DEFAULT 'contain'
    CHECK (image_fit IN ('contain', 'cover')),
  ADD COLUMN IF NOT EXISTS image_aspect text NOT NULL DEFAULT 'auto'
    CHECK (image_aspect IN ('auto', 'portrait', 'landscape', 'square')),
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'html')),
  ADD COLUMN IF NOT EXISTS media_html text;

COMMENT ON COLUMN public.affiliate_shop_products.image_fit IS 'contain = show full image; cover = crop to fill card.';
COMMENT ON COLUMN public.affiliate_shop_products.image_aspect IS 'auto | portrait (3:4) | landscape (4:3) | square (1:1).';
COMMENT ON COLUMN public.affiliate_shop_products.media_type IS 'image (default) or sanitized html embed.';
COMMENT ON COLUMN public.affiliate_shop_products.media_html IS 'Optional custom HTML — scripts stripped on render.';
