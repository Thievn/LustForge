-- Portrait-only override rows were hiding loops still stored on the owner's forge/catalog row.

UPDATE public.user_companion_portrait_overrides ov
SET
  animated_portrait_url = cc.animated_image_url,
  profile_loop_video_enabled = true,
  updated_at = now()
FROM public.custom_characters cc
WHERE ov.companion_id = ('cc-' || cc.id::text)
  AND ov.user_id = cc.user_id
  AND btrim(coalesce(ov.animated_portrait_url, '')) = ''
  AND btrim(coalesce(cc.animated_image_url, '')) <> ''
  AND (
    cc.animated_image_url LIKE '%/profile-loops/%'
    OR cc.animated_image_url ~* '\.(mp4|webm|mov)(\?|$)'
  );

UPDATE public.user_companion_portrait_overrides ov
SET
  animated_portrait_url = c.animated_image_url,
  profile_loop_video_enabled = true,
  updated_at = now()
FROM public.companions c
WHERE ov.companion_id = c.id
  AND ov.companion_id NOT LIKE 'cc-%'
  AND btrim(coalesce(ov.animated_portrait_url, '')) = ''
  AND btrim(coalesce(c.animated_image_url, '')) <> ''
  AND (
    c.animated_image_url LIKE '%/profile-loops/%'
    OR c.animated_image_url ~* '\.(mp4|webm|mov)(\?|$)'
  );
