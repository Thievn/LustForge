-- Bulk repair: loop MP4 exists in generated_images but profile/override row was never wired.

WITH latest_gallery_loop AS (
  SELECT DISTINCT ON (g.user_id, g.companion_id)
    g.user_id,
    g.companion_id,
    g.image_url AS public_url,
    g.created_at
  FROM public.generated_images g
  WHERE g.is_video = true
    AND btrim(coalesce(g.image_url, '')) <> ''
    AND (
      g.image_url LIKE '%/profile-loops/%'
      OR g.image_url ~* '\.(mp4|webm|mov)(\?|$)'
    )
  ORDER BY g.user_id, g.companion_id, g.created_at DESC
),
cc_ctx AS (
  SELECT
    l.user_id,
    l.companion_id,
    l.public_url,
    c.id AS cc_uuid,
    coalesce(
      nullif(btrim(ov.portrait_url), ''),
      nullif(btrim(c.static_image_url), ''),
      nullif(btrim(c.image_url), '')
    ) AS portrait_still
  FROM latest_gallery_loop l
  INNER JOIN public.custom_characters c ON ('cc-' || c.id::text) = l.companion_id
  LEFT JOIN public.user_companion_portrait_overrides ov
    ON ov.user_id = l.user_id AND ov.companion_id = l.companion_id
),
cat_ctx AS (
  SELECT
    l.user_id,
    l.companion_id,
    l.public_url,
    coalesce(
      nullif(btrim(ov.portrait_url), ''),
      nullif(btrim(c.static_image_url), ''),
      nullif(btrim(c.image_url), '')
    ) AS portrait_still
  FROM latest_gallery_loop l
  INNER JOIN public.companions c ON c.id = l.companion_id
  LEFT JOIN public.user_companion_portrait_overrides ov
    ON ov.user_id = l.user_id AND ov.companion_id = l.companion_id
  WHERE l.companion_id NOT LIKE 'cc-%'
),
all_ctx AS (
  SELECT user_id, companion_id, public_url, portrait_still FROM cc_ctx WHERE portrait_still IS NOT NULL
  UNION ALL
  SELECT user_id, companion_id, public_url, portrait_still FROM cat_ctx WHERE portrait_still IS NOT NULL
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
FROM all_ctx
ON CONFLICT (user_id, companion_id) DO UPDATE SET
  animated_portrait_url = EXCLUDED.animated_portrait_url,
  profile_loop_video_enabled = true,
  portrait_url = coalesce(
    public.user_companion_portrait_overrides.portrait_url,
    EXCLUDED.portrait_url
  ),
  updated_at = now()
WHERE btrim(coalesce(public.user_companion_portrait_overrides.animated_portrait_url, '')) = '';

-- Private forge rows (not discover-listed template): mirror gallery loop onto custom_characters when empty.
UPDATE public.custom_characters c
SET
  animated_image_url = l.public_url,
  profile_loop_video_enabled = true
FROM (
  SELECT DISTINCT ON (g.user_id, g.companion_id)
    g.user_id,
    g.companion_id,
    g.image_url AS public_url
  FROM public.generated_images g
  WHERE g.is_video = true
    AND btrim(coalesce(g.image_url, '')) <> ''
    AND (
      g.image_url LIKE '%/profile-loops/%'
      OR g.image_url ~* '\.(mp4|webm|mov)(\?|$)'
    )
  ORDER BY g.user_id, g.companion_id, g.created_at DESC
) l
WHERE ('cc-' || c.id::text) = l.companion_id
  AND l.user_id = c.user_id
  AND NOT (coalesce(c.is_public, false) AND coalesce(c.approved, false))
  AND btrim(coalesce(c.animated_image_url, '')) = '';
