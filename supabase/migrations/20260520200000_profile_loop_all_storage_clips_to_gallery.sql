-- Register every profile-loops MP4 in the owner's gallery and wire the newest to profile playback.

WITH parsed AS (
  SELECT
    substring(o.name FROM '^profile-loops/([^/]+)/') AS companion_id,
    o.name,
    o.created_at,
    'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/' || o.name AS public_url
  FROM storage.objects o
  WHERE o.bucket_id = 'companion-images'
    AND o.name ~ '^profile-loops/.+\.(mp4|webm|mov)$'
),
cc_owner AS (
  SELECT
    p.companion_id,
    p.public_url,
    p.created_at,
    c.user_id,
    coalesce(
      nullif(btrim(ov.portrait_url), ''),
      nullif(btrim(c.static_image_url), ''),
      nullif(btrim(c.image_url), '')
    ) AS portrait_still,
    (coalesce(c.is_public, false) AND coalesce(c.approved, false)) AS discover_listed
  FROM parsed p
  INNER JOIN public.custom_characters c ON ('cc-' || c.id::text) = p.companion_id
  LEFT JOIN public.user_companion_portrait_overrides ov
    ON ov.user_id = c.user_id AND ov.companion_id = p.companion_id
)
INSERT INTO public.generated_images (
  user_id,
  companion_id,
  image_url,
  prompt,
  is_video,
  saved_to_companion_gallery,
  saved_to_personal_gallery,
  created_at
)
SELECT
  o.user_id,
  o.companion_id,
  o.public_url,
  'Profile loop video (storage gallery repair)',
  true,
  true,
  false,
  o.created_at
FROM cc_owner o
WHERE o.portrait_still IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.generated_images g
    WHERE g.user_id = o.user_id
      AND g.companion_id = o.companion_id
      AND g.is_video = true
      AND g.image_url = o.public_url
  );

WITH latest_storage_loop AS (
  SELECT DISTINCT ON (companion_id)
    companion_id,
    public_url,
    user_id,
    portrait_still,
    discover_listed
  FROM (
    SELECT
      substring(o.name FROM '^profile-loops/([^/]+)/') AS companion_id,
      'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/' || o.name AS public_url,
      c.user_id,
      coalesce(
        nullif(btrim(ov.portrait_url), ''),
        nullif(btrim(c.static_image_url), ''),
        nullif(btrim(c.image_url), '')
      ) AS portrait_still,
      (coalesce(c.is_public, false) AND coalesce(c.approved, false)) AS discover_listed,
      o.created_at
    FROM storage.objects o
    INNER JOIN public.custom_characters c ON ('cc-' || c.id::text) = substring(o.name FROM '^profile-loops/([^/]+)/')
    LEFT JOIN public.user_companion_portrait_overrides ov
      ON ov.user_id = c.user_id AND ov.companion_id = substring(o.name FROM '^profile-loops/([^/]+)/')
    WHERE o.bucket_id = 'companion-images'
      AND o.name ~ '^profile-loops/cc-[^/]+/.+\.(mp4|webm|mov)$'
  ) sub
  WHERE portrait_still IS NOT NULL
  ORDER BY companion_id, created_at DESC
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
FROM latest_storage_loop
ON CONFLICT (user_id, companion_id) DO UPDATE SET
  animated_portrait_url = EXCLUDED.animated_portrait_url,
  profile_loop_video_enabled = true,
  portrait_url = coalesce(
    public.user_companion_portrait_overrides.portrait_url,
    EXCLUDED.portrait_url
  ),
  updated_at = now();

WITH latest_storage_loop AS (
  SELECT DISTINCT ON (companion_id)
    companion_id,
    public_url,
    user_id,
    discover_listed
  FROM (
    SELECT
      substring(o.name FROM '^profile-loops/([^/]+)/') AS companion_id,
      'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/' || o.name AS public_url,
      c.user_id,
      (coalesce(c.is_public, false) AND coalesce(c.approved, false)) AS discover_listed,
      o.created_at
    FROM storage.objects o
    INNER JOIN public.custom_characters c ON ('cc-' || c.id::text) = substring(o.name FROM '^profile-loops/([^/]+)/')
    WHERE o.bucket_id = 'companion-images'
      AND o.name ~ '^profile-loops/cc-[^/]+/.+\.(mp4|webm|mov)$'
  ) sub
  ORDER BY companion_id, created_at DESC
)
UPDATE public.custom_characters c
SET
  animated_image_url = l.public_url,
  profile_loop_video_enabled = true,
  updated_at = now()
FROM latest_storage_loop l
WHERE ('cc-' || c.id::text) = l.companion_id
  AND c.user_id = l.user_id
  AND NOT l.discover_listed
  AND (
    btrim(coalesce(c.animated_image_url, '')) = ''
    OR c.animated_image_url IS DISTINCT FROM l.public_url
  );
