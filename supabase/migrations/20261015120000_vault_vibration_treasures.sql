-- Additive: Vibrations, a 10th Velvet Vault category.
-- Tier odds stay 53/27/13/5/2 (silk/satin/velvet/forbidden/obsession).
-- Pattern payloads reuse the existing Lovense vibration command shape.
-- Card art ships with the app at /vault-art/vib-*.webp (not the production bucket).
-- Do not apply this against production from a client. Run it with the normal migration path.

ALTER TABLE public.collectible_items
  ADD COLUMN IF NOT EXISTS pattern_payload jsonb;

ALTER TABLE public.companion_looks
  ADD COLUMN IF NOT EXISTS vibration_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companion_looks_vibration_id_fkey'
  ) THEN
    ALTER TABLE public.companion_looks
      ADD CONSTRAINT companion_looks_vibration_id_fkey
      FOREIGN KEY (vibration_id) REFERENCES public.collectible_items (id) ON DELETE SET NULL;
  END IF;
END $$;

INSERT INTO public.collectible_items (id, name, kind, rarity, weight, neutral, pose_id, blurb, slot, is_new, pattern_payload, image_url, thumb_url)
VALUES
  ('vib-pulse', 'Pulse', 'vibration', 'silk', 1, 'a slow even pulse, felt more than seen', NULL, 'A steady pulse. She does not rush it.', 'vibration', false, '{"command":"pattern","pattern":"Pulse","intensity":50,"duration":8000}'::jsonb, '/vault-art/vib-pulse.webp', '/vault-art/thumbs/vib-pulse.webp'),
  ('vib-heartbeat', 'Heartbeat', 'vibration', 'silk', 1, 'a heartbeat that stays close', NULL, 'Two beats, then a wait. Like she is listening.', 'vibration', false, '{"command":"pattern","pattern":"Pulse","intensity":42,"duration":11000}'::jsonb, '/vault-art/vib-heartbeat.webp', '/vault-art/thumbs/vib-heartbeat.webp'),
  ('vib-soft', 'Soft wave', 'vibration', 'silk', 1, 'a soft wave that barely arrives', NULL, 'It comes in, and it does not leave all at once.', 'vibration', false, '{"command":"vibrate","intensity":22,"duration":9000}'::jsonb, '/vault-art/vib-soft.webp', '/vault-art/thumbs/vib-soft.webp'),
  ('vib-flutter', 'Flutter', 'vibration', 'silk', 1, 'a light flutter against the skin', NULL, 'Short. Then gone. Then back.', 'vibration', false, '{"command":"vibrate","intensity":25,"duration":6000}'::jsonb, '/vault-art/vib-flutter.webp', '/vault-art/thumbs/vib-flutter.webp'),
  ('vib-hush', 'Hush', 'vibration', 'silk', 1, 'a hush that stays low', NULL, 'Quiet enough to make her lean in.', 'vibration', false, '{"command":"vibrate","intensity":18,"duration":7000}'::jsonb, '/vault-art/vib-hush.webp', '/vault-art/thumbs/vib-hush.webp'),
  ('vib-wave', 'Wave', 'vibration', 'satin', 1, 'a long wave that rises and falls', NULL, 'She lets it travel the whole way.', 'vibration', false, '{"command":"pattern","pattern":"Wave","intensity":50,"duration":10000}'::jsonb, '/vault-art/vib-wave.webp', '/vault-art/thumbs/vib-wave.webp'),
  ('vib-tease', 'Tease', 'vibration', 'satin', 1, 'a tease that stops just short', NULL, 'Almost. Then she makes you wait.', 'vibration', false, '{"command":"pattern","pattern":"Wave","intensity":36,"duration":12000}'::jsonb, '/vault-art/vib-tease.webp', '/vault-art/thumbs/vib-tease.webp'),
  ('vib-tide', 'Tide', 'vibration', 'satin', 1, 'a tide that takes its time', NULL, 'Out, then further in.', 'vibration', false, '{"command":"pattern","pattern":"Wave","intensity":50,"duration":12000}'::jsonb, '/vault-art/vib-tide.webp', '/vault-art/thumbs/vib-tide.webp'),
  ('vib-coil', 'Deep coil', 'vibration', 'velvet', 1, 'a deep coil that stays low and close', NULL, 'It sits in one place and does not apologize.', 'vibration', false, '{"command":"vibrate","intensity":52,"duration":10000}'::jsonb, '/vault-art/vib-coil.webp', '/vault-art/thumbs/vib-coil.webp'),
  ('vib-thorn', 'Rose thorn', 'vibration', 'velvet', 1, 'a sharper rhythm with a soft edge', NULL, 'Sweet, then it catches.', 'vibration', false, '{"command":"vibrate","intensity":48,"duration":8000}'::jsonb, '/vault-art/vib-thorn.webp', '/vault-art/thumbs/vib-thorn.webp'),
  ('vib-crescendo', 'Crescendo', 'vibration', 'forbidden', 1, 'a climb that does not plateau', NULL, 'Each pass is louder than the last.', 'vibration', false, '{"command":"pattern","pattern":"Fireworks","intensity":64,"duration":11000}'::jsonb, '/vault-art/vib-crescendo.webp', '/vault-art/thumbs/vib-crescendo.webp'),
  ('vib-obsession', 'Obsession wave', 'vibration', 'obsession', 1, 'the pattern she does not share', NULL, 'It does not fade until she says so.', 'vibration', true, '{"command":"pattern","pattern":"Earthquake","intensity":70,"duration":15000}'::jsonb, '/vault-art/vib-obsession.webp', '/vault-art/thumbs/vib-obsession.webp')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  kind = EXCLUDED.kind,
  rarity = EXCLUDED.rarity,
  weight = EXCLUDED.weight,
  neutral = EXCLUDED.neutral,
  pose_id = EXCLUDED.pose_id,
  blurb = EXCLUDED.blurb,
  slot = EXCLUDED.slot,
  is_new = EXCLUDED.is_new,
  pattern_payload = EXCLUDED.pattern_payload,
  image_url = EXCLUDED.image_url,
  thumb_url = EXCLUDED.thumb_url,
  active = true;
