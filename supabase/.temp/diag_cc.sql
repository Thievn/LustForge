SELECT 'custom_characters' AS src, id::text, user_id::text, is_public, approved,
  profile_loop_video_enabled,
  left(coalesce(animated_image_url,''), 140) AS animated,
  left(coalesce(static_image_url,''), 80) AS static_img
FROM custom_characters WHERE id = '9c63ec0c-c11e-4335-8bbd-78c97c7f5b5e';

SELECT 'override' AS src, user_id::text, profile_loop_video_enabled,
  left(coalesce(animated_portrait_url,''), 140) AS animated,
  left(coalesce(portrait_url,''), 80) AS portrait
FROM user_companion_portrait_overrides
WHERE companion_id = 'cc-9c63ec0c-c11e-4335-8bbd-78c97c7f5b5e';

SELECT 'jobs' AS src, status,
  left(coalesce(public_url,''), 140) AS public_url, created_at
FROM profile_loop_video_jobs
WHERE companion_id = 'cc-9c63ec0c-c11e-4335-8bbd-78c97c7f5b5e'
ORDER BY created_at DESC LIMIT 3;

SELECT 'gallery' AS src, user_id::text, is_video,
  left(coalesce(image_url,''), 140) AS url, created_at
FROM generated_images
WHERE companion_id = 'cc-9c63ec0c-c11e-4335-8bbd-78c97c7f5b5e' AND is_video = true
ORDER BY created_at DESC LIMIT 3;
