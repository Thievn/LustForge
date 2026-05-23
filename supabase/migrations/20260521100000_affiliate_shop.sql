-- Lovense affiliate shop: page copy + product grid (admin-managed, public read)

CREATE TABLE IF NOT EXISTS public.affiliate_shop_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_title text NOT NULL DEFAULT 'Enhance Your Companion',
  hero_subtitle text NOT NULL DEFAULT 'Prepare for launch with app-controlled toys that sync with your LustForge companion in chat.',
  sync_section_body text NOT NULL DEFAULT 'Pair your Lovense toy through the Lovense app, then link it in LustForge chat. Your companion can respond in real time — vibration patterns, intensity, and rhythm matched to the moment.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.affiliate_shop_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.affiliate_shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL DEFAULT 0,
  name text NOT NULL,
  description text,
  image_url text,
  affiliate_url text NOT NULL DEFAULT '#',
  badge text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_shop_products_sort_idx
  ON public.affiliate_shop_products (sort_order ASC, created_at ASC);

ALTER TABLE public.affiliate_shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_shop_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read affiliate shop settings" ON public.affiliate_shop_settings;
CREATE POLICY "Anyone can read affiliate shop settings"
  ON public.affiliate_shop_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage affiliate shop settings" ON public.affiliate_shop_settings;
CREATE POLICY "Admins manage affiliate shop settings"
  ON public.affiliate_shop_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Anyone can read active affiliate products" ON public.affiliate_shop_products;
CREATE POLICY "Anyone can read active affiliate products"
  ON public.affiliate_shop_products
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage affiliate products" ON public.affiliate_shop_products;
CREATE POLICY "Admins manage affiliate products"
  ON public.affiliate_shop_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

INSERT INTO public.affiliate_shop_products (sort_order, name, description, affiliate_url, badge)
SELECT * FROM (VALUES
  (10, 'Lush 4', 'App-controlled wearable with deep, rumbly vibes — discreet enough for anywhere, powerful enough for everything.', '#', 'Best for sync'),
  (20, 'Nora', 'Rotating head and pulsing shaft in one sleek silhouette — built for hands-free rhythm.', '#', 'Popular'),
  (30, 'Max 2', 'Interactive sleeve with adjustable grip and stroke — syncs intensity to the scene.', '#', NULL),
  (40, 'Edge 2', 'Adjustable prostate massager with dual motors — precision pressure where it counts.', '#', NULL),
  (50, 'Ferri', 'Magnetic panty vibe with a low profile and high output — control from across the room.', '#', 'Discreet'),
  (60, 'Gush 2', 'Hands-free stroker with adjustable mount — let your companion set the tempo.', '#', NULL),
  (70, 'Dolce', 'Adjustable dual stimulator — customize the fit for clitoral and G-spot contact.', '#', NULL),
  (80, 'Lapis', 'Dual-ended vibrator for couples — share control through the Lovense app.', '#', 'Couples')
) AS seed(sort_order, name, description, affiliate_url, badge)
WHERE NOT EXISTS (SELECT 1 FROM public.affiliate_shop_products LIMIT 1);

INSERT INTO storage.buckets (id, name, public)
VALUES ('affiliate-shop', 'affiliate-shop', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets SET public = true WHERE id = 'affiliate-shop';

DROP POLICY IF EXISTS "Anyone can view affiliate shop media" ON storage.objects;
CREATE POLICY "Anyone can view affiliate shop media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'affiliate-shop');

DROP POLICY IF EXISTS "Admins can upload affiliate shop media" ON storage.objects;
CREATE POLICY "Admins can upload affiliate shop media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'affiliate-shop' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update affiliate shop media" ON storage.objects;
CREATE POLICY "Admins can update affiliate shop media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'affiliate-shop' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete affiliate shop media" ON storage.objects;
CREATE POLICY "Admins can delete affiliate shop media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'affiliate-shop' AND public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.affiliate_shop_settings IS 'Singleton row id=1: hero copy for /toys affiliate page.';
COMMENT ON TABLE public.affiliate_shop_products IS 'Lovense affiliate product cards — managed in admin, shown on /toys.';
