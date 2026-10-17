-- Edited gallery rows keep a durable pointer at the picture they started from.
-- Gallery uses it to reopen the before/after compare. Null on generates and older rows.

ALTER TABLE public.generated_images
  ADD COLUMN IF NOT EXISTS source_image_url text;

COMMENT ON COLUMN public.generated_images.source_image_url IS
  'Storage or public URL of the picture this edit started from. Null on generates and rows that have no original.';

UPDATE public.generated_images AS gi
SET source_image_url = sj.subject_url
FROM public.studio_jobs AS sj
WHERE gi.source_image_url IS NULL
  AND sj.user_id = gi.user_id
  AND sj.kind = 'edit'
  AND sj.image_url IS NOT NULL
  AND sj.subject_url IS NOT NULL
  AND gi.image_url = sj.image_url;
