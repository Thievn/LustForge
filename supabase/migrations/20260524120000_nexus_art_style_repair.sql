-- Repair Nexus hybrid rows where anime tab/tags disagree with stored forge artStyle.

-- Drop erroneous Anime Style tag when artStyle is not anime.
UPDATE public.custom_characters c
SET tags = COALESCE(
  (
    SELECT array_agg(t)
    FROM unnest(c.tags) AS t
    WHERE lower(trim(t)) <> 'anime style'
  ),
  ARRAY[]::text[]
)
WHERE c.is_nexus_hybrid = true
  AND c.tags IS NOT NULL
  AND 'Anime Style' = ANY (c.tags)
  AND NOT COALESCE(c.personality_forge->'_forgeThemeV2'->>'artStyle', '') ~* '\y(anime|manga|cel[- ]?shad|ghibli|chibi|2d anime|screentone|cyber-goth anime|hentai|yaoi|yuri)\y';

-- Align activeForgeTab with photoreal / non-anime artStyle lanes.
UPDATE public.custom_characters c
SET personality_forge = jsonb_set(
  jsonb_set(
    COALESCE(c.personality_forge, '{}'::jsonb),
    '{_forgeThemeV2,activeForgeTab}',
    '"realistic_craving"'::jsonb,
    true
  ),
  '{_forgeThemeV1,activeForgeTab}',
  '"realistic_craving"'::jsonb,
  true
)
WHERE c.is_nexus_hybrid = true
  AND COALESCE(c.personality_forge->'_forgeThemeV2'->>'activeForgeTab', '') = 'anime_temptation'
  AND COALESCE(c.personality_forge->'_forgeThemeV2'->>'artStyle', '') ~* '\y(photoreal|hyper-real|dark moody realism|cinematic photography|studio portrait|boudoir photography|high fashion editorial|film noir)\y';

-- Explicit repair for Juno Vale hybrid (cc-f63516cf…).
UPDATE public.custom_characters c
SET
  tags = COALESCE(
    (
      SELECT array_agg(t)
      FROM unnest(c.tags) AS t
      WHERE lower(trim(t)) <> 'anime style'
    ),
    ARRAY[]::text[]
  ),
  personality_forge = jsonb_set(
    jsonb_set(
      COALESCE(c.personality_forge, '{}'::jsonb),
      '{_forgeThemeV2,activeForgeTab}',
      '"realistic_craving"'::jsonb,
      true
    ),
    '{_forgeThemeV1,activeForgeTab}',
    '"realistic_craving"'::jsonb,
    true
  )
WHERE c.id = 'f63516cf-b42e-49b7-9ae9-06d231444181'::uuid;
