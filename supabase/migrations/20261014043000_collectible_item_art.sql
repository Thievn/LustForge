-- Card art for The Velvet Vault. Additive. Public objects in the vault-art bucket.
-- Full cards: {base}/{id}.webp (512x683). Thumbs: {base}/thumbs/{id}.webp (256x341).
-- The object name is the treasure id, matching the public vault-art map.

ALTER TABLE public.collectible_items
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS thumb_url text;

UPDATE public.collectible_items
SET
  image_url = 'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/vault-art/' || id || '.webp',
  thumb_url = 'https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/vault-art/thumbs/' || id || '.webp'
WHERE coalesce(image_url, '') = ''
   OR coalesce(thumb_url, '') = '';
