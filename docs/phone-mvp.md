# Phone shell MVP

The new home screen is `/dashboard`. The previous dashboard stays at `/vault`.

Companions are read from `custom_characters` (production `companions` is empty). Gallery reads `generated_images`, `companion_portraits`, `user_companion_portrait_overrides`, `chat_messages.image_url`, `custom_characters` stills, and `profile_loop_video_jobs.public_url`. It does not render `xai_video_url`.

## Secrets (placeholders only — do not commit values)

Set these in the Supabase dashboard after review. They are not in git.

```
RUNPOD_API_KEY=
RUNPOD_ENDPOINT_ID=knag1yvb1tlqk3
```

`XAI_API_KEY` or `GROK_API_KEY` is the existing Grok 4.3 chat secret.

## Migration

`supabase/migrations/20261012064734_phone_shell_and_media_archive.sql` is additive. It does not delete or rewrite image URLs. Apply it only after a backup. This repo does not apply it to production.

## Archive job (do not run here)

`scripts/archive-external-images.mjs` calls `archive-external-images`. It exits unless you pass `--dry-run` or `--apply`, and it refuses the production project ref unless you pass `--allow-production`.

Rows that already have a Storage `public_url` are skipped. The eight temporary xAI URLs on `profile_loop_video_jobs` already have `public_url`, so a dry run should copy nothing for those jobs. `xai_video_url` is left in place.

New in-chat Runpod images are uploaded to Storage before a `generated_images` row is written. The temporary Runpod URL is not stored as `image_url`.

## Finished

- Phone home, messages, thread (LustForge bubbles by default; iOS, Android, and Forge Noir are optional)
- Typing indicator, read receipts, multi-bubble pacing, photo placeholder
- Lab: profile, edit, 5-step create
- Gallery from the real image tables
- Plans and credit packs as limits UI, checkout disabled
- Adult 21+ character guard
- PWA manifest (already installable; description updated)
- Existing profile page kept, with a Phone thread button and the existing Live Call

## Stubbed

- NOWPayments and any checkout
- Free-tier cheap chat model (phone chat uses the existing Grok 4.3 path)
- Lab portrait previews are gradient cards that lock a seed; they do not call the GPU
- Pose match is a small keyword list, not embeddings, and it is not shown in the UI
- Voice-note bubbles and proactive messages
