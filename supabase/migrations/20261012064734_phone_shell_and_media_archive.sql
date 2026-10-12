-- Phone shell + permanent gallery storage.
-- Additive only. Does not delete, rename, or rewrite existing image rows or URLs.
-- Apply only after a database backup. Do not run from CI against production.
--
-- Production roster (read-only audit): companions has 0 rows. Companions live in
-- custom_characters. Images already live in Storage (companion-portraits,
-- companion-images, chat-tts, affiliate-shop, x-marketing-framed). The only
-- temporary xAI URLs are profile_loop_video_jobs.xai_video_url, and those rows
-- already have public_url. This migration does not touch those URLs.

-- ---------------------------------------------------------------------------
-- Profiles: plan limits and phone preferences (payments are not processed here)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_skin text NOT NULL DEFAULT 'lustforge',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#FF2D7B',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS texts_left integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS pics_left integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS companion_slots integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS lab_mode text NOT NULL DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS texts_quota_date date,
  ADD COLUMN IF NOT EXISTS is_catalog_owner boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.plan IS 'free | ember | blaze | inferno. Display and limits only; checkout is not wired.';
COMMENT ON COLUMN public.profiles.credits IS 'Spendable credits. Voice is 25/min, extra picture 10, 100 texts 75. Not a payment ledger.';
COMMENT ON COLUMN public.profiles.is_catalog_owner IS 'When true, the phone dashboard lists every active catalog companion. Existing rows are not reassigned.';

-- ---------------------------------------------------------------------------
-- Companion identity lock (face descriptor + seed). Existing rows kept.
-- ---------------------------------------------------------------------------
ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS descriptor text,
  ADD COLUMN IF NOT EXISTS base_seed bigint,
  ADD COLUMN IF NOT EXISTS engine text NOT NULL DEFAULT 'zimage',
  ADD COLUMN IF NOT EXISTS style_id text NOT NULL DEFAULT 'photoreal',
  ADD COLUMN IF NOT EXISTS canonical_portrait_path text,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS relationship_preset text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.custom_characters
  ADD COLUMN IF NOT EXISTS descriptor text,
  ADD COLUMN IF NOT EXISTS base_seed bigint,
  ADD COLUMN IF NOT EXISTS engine text NOT NULL DEFAULT 'zimage',
  ADD COLUMN IF NOT EXISTS style_id text NOT NULL DEFAULT 'photoreal',
  ADD COLUMN IF NOT EXISTS canonical_portrait_path text,
  ADD COLUMN IF NOT EXISTS relationship_preset text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

UPDATE public.companions
SET descriptor = left(btrim(coalesce(
  nullif(character_reference, ''),
  nullif(appearance_reference, ''),
  nullif(appearance, ''),
  name
)), 800)
WHERE descriptor IS NULL OR btrim(descriptor) = '';

UPDATE public.companions
SET base_seed = abs(hashtext(id)::bigint)
WHERE base_seed IS NULL;

UPDATE public.custom_characters
SET descriptor = left(btrim(coalesce(
  nullif(character_reference, ''),
  nullif(appearance_reference, ''),
  nullif(appearance, ''),
  name
)), 800)
WHERE descriptor IS NULL OR btrim(descriptor) = '';

UPDATE public.custom_characters
SET base_seed = abs(hashtext(id::text)::bigint)
WHERE base_seed IS NULL;

-- Stock catalog stays shared. Mark as templates without hiding or moving them.
UPDATE public.companions
SET is_template = true
WHERE owner_user_id IS NULL AND is_template IS NOT TRUE;

-- Email match for the account that owns the catalog (Gmail dots ignored).
CREATE OR REPLACE FUNCTION public.normalize_catalog_owner_email(raw text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    CASE
      WHEN raw IS NULL OR btrim(raw) = '' THEN false
      ELSE
        (
          CASE
            WHEN split_part(lower(btrim(raw)), '@', 2) IN ('gmail.com', 'googlemail.com') THEN
              regexp_replace(split_part(split_part(lower(btrim(raw)), '@', 1), '+', 1), '\.', '', 'g')
              || '@'
              || split_part(lower(btrim(raw)), '@', 2)
            ELSE lower(btrim(raw))
          END
        ) = 'lustforgeapp@gmail.com'
    END;
$$;

COMMENT ON FUNCTION public.normalize_catalog_owner_email(text) IS
  'True for the LustForge catalog owner mailbox. Used only to flag profiles.is_catalog_owner.';

-- ---------------------------------------------------------------------------
-- Owner dashboard: founder mailbox + admin role keep every current companion.
-- Slots are raised so creation limits never hide an existing roster.
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
SET is_catalog_owner = true
WHERE EXISTS (
  SELECT 1 FROM public.user_roles r
  WHERE r.user_id = p.user_id AND r.role = 'admin'
);

UPDATE public.profiles p
SET is_catalog_owner = true
FROM auth.users u
WHERE u.id = p.user_id
  AND public.normalize_catalog_owner_email(u.email);

UPDATE public.profiles p
SET companion_slots = GREATEST(
  p.companion_slots,
  COALESCE((SELECT count(*)::int FROM public.companions c WHERE c.is_active IS DISTINCT FROM false), 0),
  COALESCE((SELECT count(*)::int FROM public.custom_characters cc WHERE cc.user_id = p.user_id), 0)
)
WHERE p.is_catalog_owner;

UPDATE public.profiles p
SET companion_slots = GREATEST(p.companion_slots, sub.n)
FROM (
  SELECT user_id, count(*)::int AS n
  FROM public.custom_characters
  GROUP BY user_id
) sub
WHERE p.user_id = sub.user_id;

-- ---------------------------------------------------------------------------
-- Chat delivery metadata. Existing message text and image_url stay put.
-- ---------------------------------------------------------------------------
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS bubble_group text,
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS external_url text;

-- ---------------------------------------------------------------------------
-- Permanent storage pointers. image_url / portrait_url values are not rewritten.
-- ---------------------------------------------------------------------------
ALTER TABLE public.generated_images
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS external_url text;

ALTER TABLE public.companion_portraits
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS external_url text;

ALTER TABLE public.user_companion_portrait_overrides
  ADD COLUMN IF NOT EXISTS portrait_storage_bucket text,
  ADD COLUMN IF NOT EXISTS portrait_storage_path text,
  ADD COLUMN IF NOT EXISTS portrait_external_url text,
  ADD COLUMN IF NOT EXISTS animated_storage_bucket text,
  ADD COLUMN IF NOT EXISTS animated_storage_path text,
  ADD COLUMN IF NOT EXISTS animated_external_url text;

CREATE INDEX IF NOT EXISTS generated_images_storage_path_idx
  ON public.generated_images (storage_bucket, storage_path)
  WHERE storage_path IS NOT NULL;

-- ---------------------------------------------------------------------------
-- New gallery link table. Does not replace generated_images.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lf_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  companion_id text,
  generated_image_id uuid REFERENCES public.generated_images (id) ON DELETE SET NULL,
  chat_message_id uuid REFERENCES public.chat_messages (id) ON DELETE SET NULL,
  storage_bucket text NOT NULL DEFAULT 'lf-chat-media',
  storage_path text NOT NULL,
  external_url text,
  kind text NOT NULL DEFAULT 'image',
  saved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS lf_media_user_created_idx
  ON public.lf_media (user_id, created_at DESC);

ALTER TABLE public.lf_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own lf_media" ON public.lf_media;
CREATE POLICY "Users read own lf_media"
  ON public.lf_media FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own lf_media" ON public.lf_media;
CREATE POLICY "Users insert own lf_media"
  ON public.lf_media FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own lf_media" ON public.lf_media;
CREATE POLICY "Users update own lf_media"
  ON public.lf_media FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.lf_image_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  companion_id text NOT NULL,
  message_id uuid,
  prompt text NOT NULL,
  negative_prompt text,
  seed bigint,
  pose_id text,
  engine text NOT NULL DEFAULT 'zimage',
  status text NOT NULL DEFAULT 'queued',
  runpod_job_id text,
  storage_bucket text,
  storage_path text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lf_image_jobs_user_idx
  ON public.lf_image_jobs (user_id, created_at DESC);

ALTER TABLE public.lf_image_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own lf_image_jobs" ON public.lf_image_jobs;
CREATE POLICY "Users read own lf_image_jobs"
  ON public.lf_image_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Hidden pose keywords. Not shown in the consumer UI.
CREATE TABLE IF NOT EXISTS public.pose_keywords (
  pose_id text PRIMARY KEY,
  keywords text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  enabled boolean NOT NULL DEFAULT true
);

ALTER TABLE public.pose_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read pose keywords" ON public.pose_keywords;
CREATE POLICY "Authenticated read pose keywords"
  ON public.pose_keywords FOR SELECT TO authenticated
  USING (enabled = true);

INSERT INTO public.pose_keywords (pose_id, keywords, description, category)
VALUES
  ('couch_lying_03', ARRAY['couch','sofa','lying','laying'], 'Reclining on a couch', 'furniture'),
  ('mirror_selfie_01', ARRAY['mirror','selfie'], 'Mirror selfie', 'selfie'),
  ('kneeling_02', ARRAY['knees','kneeling'], 'Kneeling pose', 'pose'),
  ('bed_reclining_04', ARRAY['bed','pillow','sheets'], 'Reclining in bed', 'furniture'),
  ('standing_portrait_01', ARRAY['standing','full body','head to toe'], 'Standing portrait', 'pose')
ON CONFLICT (pose_id) DO NOTHING;

-- Catalog owner can read every custom_characters row (the real companion roster).
DROP POLICY IF EXISTS "Catalog owner reads custom characters" ON public.custom_characters;
CREATE POLICY "Catalog owner reads custom characters"
  ON public.custom_characters FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_catalog_owner = true
    )
  );

-- Private bucket for in-chat stills. Service role writes; the owner reads their prefix.
INSERT INTO storage.buckets (id, name, public)
VALUES ('lf-chat-media', 'lf-chat-media', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own lf-chat-media" ON storage.objects;
CREATE POLICY "Users read own lf-chat-media"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lf-chat-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
