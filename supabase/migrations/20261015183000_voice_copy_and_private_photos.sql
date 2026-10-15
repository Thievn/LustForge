-- First-person profile voice, and private in-chat photos only the uploader can read.

ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS voice_teaser text,
  ADD COLUMN IF NOT EXISTS voice_story text;

ALTER TABLE public.custom_characters
  ADD COLUMN IF NOT EXISTS voice_teaser text,
  ADD COLUMN IF NOT EXISTS voice_story text;

COMMENT ON COLUMN public.companions.voice_teaser IS
  'Short first-person profile teaser, about 160 characters, in the companion''s voice.';
COMMENT ON COLUMN public.companions.voice_story IS
  '3–4 sentence first-person story in the companion''s voice. Must not contradict backstory.';
COMMENT ON COLUMN public.custom_characters.voice_teaser IS
  'Short first-person profile teaser, about 160 characters, in the companion''s voice.';
COMMENT ON COLUMN public.custom_characters.voice_story IS
  '3–4 sentence first-person story in the companion''s voice. Must not contradict backstory.';

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS private_photo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS private_storage_path text;

COMMENT ON COLUMN public.chat_messages.private_photo IS
  'User uploaded a photo for this companion to react to. The thread shows a lock, not the picture.';
COMMENT ON COLUMN public.chat_messages.private_storage_path IS
  'Object path in the private-chat-photos bucket. Only the uploading user can read it.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-chat-photos',
  'private-chat-photos',
  false,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users insert own private chat photos" ON storage.objects;
CREATE POLICY "Users insert own private chat photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-chat-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users read own private chat photos" ON storage.objects;
CREATE POLICY "Users read own private chat photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-chat-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own private chat photos" ON storage.objects;
CREATE POLICY "Users update own private chat photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'private-chat-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'private-chat-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own private chat photos" ON storage.objects;
CREATE POLICY "Users delete own private chat photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'private-chat-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
