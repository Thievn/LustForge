-- Orphan repair: MP4 exists in companion-images/profile-loops/ but jobs/overrides were never wired
-- (e.g. Discover migration cleared shared row, or finalize failed after upload).

WITH parsed AS (
  SELECT
    substring(o.name FROM '^profile-loops/([^/]+)/') AS companion_id,
    o.name,
    o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'companion-images'
    AND o.name ~ '^profile-loops/.+\.(mp4|webm|mov)$'
),
latest_storage_loop AS (
  SELECT DISTINCT ON (companion_id)
    companion_id,
    'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/' || name AS public_url
  FROM parsed
  WHERE companion_id IS NOT NULL AND btrim(companion_id) <> ''
  ORDER BY companion_id, created_at DESC
),
cc_ctx AS (
  SELECT
    l.companion_id,
    l.public_url,
    c.user_id,
    coalesce(
      nullif(btrim(ov.portrait_url), ''),
      nullif(btrim(c.static_image_url), ''),
      nullif(btrim(c.image_url), '')
    ) AS portrait_still,
    (coalesce(c.is_public, false) AND coalesce(c.approved, false)) AS discover_listed
  FROM latest_storage_loop l
  INNER JOIN public.custom_characters c ON ('cc-' || c.id::text) = l.companion_id
  LEFT JOIN public.user_companion_portrait_overrides ov
    ON ov.user_id = c.user_id AND ov.companion_id = l.companion_id
)
INSERT INTO public.user_companion_portrait_overrides (
  user_id,
  companion_id,
  portrait_url,
  animated_portrait_url,
  profile_loop_video_enabled,
  updated_at
)
SELECT user_id, companion_id, portrait_still, public_url, true, now()
FROM cc_ctx
WHERE portrait_still IS NOT NULL
ON CONFLICT (user_id, companion_id) DO UPDATE SET
  animated_portrait_url = EXCLUDED.animated_portrait_url,
  profile_loop_video_enabled = true,
  portrait_url = coalesce(
    public.user_companion_portrait_overrides.portrait_url,
    EXCLUDED.portrait_url
  ),
  updated_at = now()
WHERE btrim(coalesce(public.user_companion_portrait_overrides.animated_portrait_url, '')) = '';

WITH parsed AS (
  SELECT
    substring(o.name FROM '^profile-loops/([^/]+)/') AS companion_id,
    o.name,
    o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'companion-images'
    AND o.name ~ '^profile-loops/.+\.(mp4|webm|mov)$'
),
latest_storage_loop AS (
  SELECT DISTINCT ON (companion_id)
    companion_id,
    'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/' || name AS public_url
  FROM parsed
  WHERE companion_id IS NOT NULL AND btrim(companion_id) <> ''
  ORDER BY companion_id, created_at DESC
),
cc_ctx AS (
  SELECT
    l.companion_id,
    l.public_url,
    c.user_id,
    (coalesce(c.is_public, false) AND coalesce(c.approved, false)) AS discover_listed
  FROM latest_storage_loop l
  INNER JOIN public.custom_characters c ON ('cc-' || c.id::text) = l.companion_id
)
UPDATE public.custom_characters c
SET
  animated_image_url = ctx.public_url,
  profile_loop_video_enabled = true,
  updated_at = now()
FROM cc_ctx ctx
WHERE ('cc-' || c.id::text) = ctx.companion_id
  AND c.user_id = ctx.user_id
  AND NOT ctx.discover_listed
  AND btrim(coalesce(c.animated_image_url, '')) = '';

WITH parsed AS (
  SELECT
    substring(o.name FROM '^profile-loops/([^/]+)/') AS companion_id,
    o.name,
    o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'companion-images'
    AND o.name ~ '^profile-loops/.+\.(mp4|webm|mov)$'
),
latest_storage_loop AS (
  SELECT DISTINCT ON (companion_id)
    companion_id,
    'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/' || name AS public_url
  FROM parsed
  WHERE companion_id IS NOT NULL AND btrim(companion_id) <> ''
  ORDER BY companion_id, created_at DESC
)
UPDATE public.companions c
SET
  animated_image_url = l.public_url,
  profile_loop_video_enabled = true,
  updated_at = now()
FROM latest_storage_loop l
WHERE c.id = l.companion_id
  AND l.companion_id NOT LIKE 'cc-%'
  AND btrim(coalesce(c.animated_image_url, '')) = '';

WITH parsed AS (
  SELECT
    substring(o.name FROM '^profile-loops/([^/]+)/') AS companion_id,
    o.name,
    o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'companion-images'
    AND o.name ~ '^profile-loops/.+\.(mp4|webm|mov)$'
),
latest_storage_loop AS (
  SELECT DISTINCT ON (companion_id)
    companion_id,
    'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/' || name AS public_url
  FROM parsed
  WHERE companion_id IS NOT NULL AND btrim(companion_id) <> ''
  ORDER BY companion_id, created_at DESC
),
cc_ctx AS (
  SELECT l.companion_id, l.public_url, c.user_id
  FROM latest_storage_loop l
  INNER JOIN public.custom_characters c ON ('cc-' || c.id::text) = l.companion_id
)
INSERT INTO public.generated_images (
  user_id,
  companion_id,
  image_url,
  prompt,
  is_video,
  saved_to_companion_gallery,
  saved_to_personal_gallery
)
SELECT
  ctx.user_id,
  ctx.companion_id,
  ctx.public_url,
  'Profile loop video (storage orphan repair)',
  true,
  true,
  false
FROM cc_ctx ctx
WHERE NOT EXISTS (
  SELECT 1
  FROM public.generated_images g
  WHERE g.companion_id = ctx.companion_id
    AND g.user_id = ctx.user_id
    AND g.is_video = true
    AND g.image_url = ctx.public_url
);
