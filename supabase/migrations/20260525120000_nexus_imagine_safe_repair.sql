-- Imagine-safe repair: sanitize provider-risky lexicon in generation-facing text fields.
-- Chat personality/kinks stay adult; appearance refs and image prompts get editorial-safe wording.

CREATE OR REPLACE FUNCTION public.sanitize_imagine_profile_text(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text := coalesce(input, '');
BEGIN
  IF s = '' THEN
    RETURN '';
  END IF;
  s := regexp_replace(s, '\mlewd\M', 'sensual editorial', 'gi');
  s := regexp_replace(s, '\mslut(s|ty)?\M', 'bold flirt', 'gi');
  s := regexp_replace(s, '\mdeprav(ed|ity)\M', 'intense passion', 'gi');
  s := regexp_replace(s, '\mbdsm\M', 'editorial power dynamic', 'gi');
  s := regexp_replace(s, '\mbondage\M', 'styled restraint aesthetic', 'gi');
  s := regexp_replace(s, '\mfetish(es|istic)?\M', 'signature style', 'gi');
  s := regexp_replace(s, '\msubmissive\M', 'devoted', 'gi');
  s := regexp_replace(s, '\mdominatrix\M', 'confident lead', 'gi');
  s := regexp_replace(s, '\bShameless Slut\b', 'bold shameless flirt', 'gi');
  s := regexp_replace(s, '\bDepraved & Extreme\b', 'intense passionate edge', 'gi');
  s := regexp_replace(s, '\bWholesome Filth\b', 'flirty wholesome heat', 'gi');
  s := regexp_replace(s, '\bCollar Play\b', 'playful accessory tease', 'gi');
  s := regexp_replace(s, '\bPower Play\b', 'confident dynamic tease', 'gi');
  s := regexp_replace(s, '\bnude(s|ity)?\M', 'editorial styling', 'gi');
  s := regexp_replace(s, '\btopless\M', 'shoulder-baring editorial top', 'gi');
  s := regexp_replace(s, '\bno bare skin[^.;]*', '', 'gi');
  s := regexp_replace(s, '\bno explicit[^.;]*', '', 'gi');
  s := regexp_replace(s, '\bno visible genitals[^.;]*', '', 'gi');
  s := regexp_replace(s, '\s{2,}', ' ', 'g');
  RETURN trim(s);
END;
$$;

-- Sylvara Grimthorne (cc-92ca6ffd): primary reported moderation case
UPDATE public.custom_characters
SET
  tagline = public.sanitize_imagine_profile_text(tagline),
  appearance = public.sanitize_imagine_profile_text(appearance),
  character_reference = public.sanitize_imagine_profile_text(character_reference),
  appearance_reference = public.sanitize_imagine_profile_text(appearance_reference),
  image_prompt = public.sanitize_imagine_profile_text(image_prompt)
WHERE id = '92ca6ffd-30c6-4500-8605-f8dd82051247';

-- Batch: Nexus hybrids with spicy kink labels in stored arrays (generation-facing refs only)
UPDATE public.custom_characters
SET
  tagline = public.sanitize_imagine_profile_text(tagline),
  appearance = public.sanitize_imagine_profile_text(appearance),
  character_reference = public.sanitize_imagine_profile_text(character_reference),
  appearance_reference = public.sanitize_imagine_profile_text(appearance_reference),
  image_prompt = public.sanitize_imagine_profile_text(image_prompt)
WHERE is_nexus_hybrid = true
  AND (
    coalesce(tagline, '') ~* '(lewd|slut|deprav|bdsm|bondage|fetish|topless|nude)'
    OR coalesce(appearance, '') ~* '(lewd|slut|deprav|bdsm|bondage|fetish|topless|nude)'
    OR coalesce(character_reference, '') ~* '(lewd|slut|deprav|bdsm|bondage|fetish|topless|nude)'
    OR coalesce(image_prompt, '') ~* '(lewd|slut|deprav|bdsm|bondage|fetish|topless|nude)'
    OR kinks && ARRAY['Wholesome Filth', 'Collar Play', 'Power Play Flips']::text[]
  );

COMMENT ON FUNCTION public.sanitize_imagine_profile_text IS
  'Regex pass for Grok Imagine / I2V prompts — editorial-safe replacements; used in Nexus repair migrations.';
