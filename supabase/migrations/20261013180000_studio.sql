-- Studio (Create + Edit). Additive only: new tables, new nullable columns, one counter on profiles.
-- Does not rewrite existing image rows, URLs, or balances.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS studio_free_left integer NOT NULL DEFAULT 3;

COMMENT ON COLUMN public.profiles.studio_free_left IS
  'Free Studio generations left for plan=free. 1 credit or 1 try per variation. Admins are not charged.';

ALTER TABLE public.generated_images
  ADD COLUMN IF NOT EXISTS source_tag text,
  ADD COLUMN IF NOT EXISTS source_sig text,
  ADD COLUMN IF NOT EXISTS studio_asset_id uuid;

COMMENT ON COLUMN public.generated_images.source_tag IS
  'Studio provenance: lab, character, or upload. Null on older rows.';

CREATE TABLE IF NOT EXISTS public.studio_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  companion_id text,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  source_tag text NOT NULL CHECK (source_tag IN ('lab', 'character', 'upload')),
  source_sig text NOT NULL,
  sha256 text NOT NULL,
  kind text NOT NULL DEFAULT 'image',
  prompt text,
  parent_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_assets
  DROP CONSTRAINT IF EXISTS studio_assets_parent_fk;

ALTER TABLE public.studio_assets
  ADD CONSTRAINT studio_assets_parent_fk
  FOREIGN KEY (parent_id) REFERENCES public.studio_assets (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS studio_assets_user_created_idx
  ON public.studio_assets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS studio_assets_path_idx
  ON public.studio_assets (storage_bucket, storage_path);

ALTER TABLE public.studio_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own studio assets" ON public.studio_assets;
CREATE POLICY "Users read own studio assets"
  ON public.studio_assets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.studio_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  runpod_id text,
  status text NOT NULL DEFAULT 'queued',
  kind text NOT NULL DEFAULT 'generate',
  source_tag text NOT NULL DEFAULT 'lab',
  prompt text,
  companion_id text,
  charge_mode text NOT NULL DEFAULT 'none',
  refunded boolean NOT NULL DEFAULT false,
  error text,
  asset_id uuid,
  image_url text,
  seed bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS studio_jobs_user_created_idx
  ON public.studio_jobs (user_id, created_at DESC);

ALTER TABLE public.studio_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own studio jobs" ON public.studio_jobs;
CREATE POLICY "Users read own studio jobs"
  ON public.studio_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
