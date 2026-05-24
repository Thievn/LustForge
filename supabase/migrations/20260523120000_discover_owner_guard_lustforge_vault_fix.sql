-- Owner cannot re-purchase their own forge rows; repair lustforge operator vault rows.

CREATE OR REPLACE FUNCTION public.purchase_discover_companion (p_companion_id text)
RETURNS TABLE (ok boolean, already_owned boolean, new_balance integer, price_fc integer, err text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u uuid;
  rar text;
  price integer;
  cur integer;
  nxt integer;
  v text;
  inner_u uuid;
  claimed boolean;
  owner_u uuid;
BEGIN
  u := auth.uid();
  v := btrim(p_companion_id);
  IF u IS NULL THEN
    RETURN QUERY SELECT false, false, 0, 0, 'not_authenticated'::text;
    RETURN;
  END IF;
  IF v = '' THEN
    RETURN QUERY SELECT false, false, 0, 0, 'invalid_companion'::text;
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_discover_pins p WHERE p.user_id = u AND p.companion_id = v) THEN
    SELECT p.tokens_balance INTO nxt FROM public.profiles p WHERE p.user_id = u;
    RETURN QUERY SELECT true, true, COALESCE(nxt, 0), 0, NULL::text;
    RETURN;
  END IF;
  IF v ~* '^cc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    inner_u := (substring(v from 4))::uuid;
    SELECT c.user_id, c.rarity
    INTO owner_u, rar
    FROM public.custom_characters c
    WHERE c.id = inner_u
    LIMIT 1;
    IF owner_u IS NOT NULL AND owner_u = u THEN
      SELECT p.tokens_balance INTO nxt FROM public.profiles p WHERE p.user_id = u;
      RETURN QUERY SELECT true, true, COALESCE(nxt, 0), 0, NULL::text;
      RETURN;
    END IF;
    IF rar IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.custom_characters c
      WHERE c.id = inner_u
        AND c.is_public = true
        AND c.approved = true
    ) THEN
      rar := NULL;
    END IF;
  ELSE
    SELECT c2.rarity INTO rar
    FROM public.companions c2
    WHERE c2.id = v AND c2.is_active = true
    LIMIT 1;
  END IF;
  IF rar IS NULL THEN
    RETURN QUERY SELECT false, false, 0, 0, 'companion_not_found'::text;
    RETURN;
  END IF;
  price := public.discover_purchase_price_fc(rar);
  SELECT p.tokens_balance, COALESCE(p.discover_free_common_claimed, false)
  INTO cur, claimed
  FROM public.profiles p
  WHERE p.user_id = u
  FOR UPDATE;
  IF NOT FOUND OR cur IS NULL THEN
    RETURN QUERY SELECT false, false, 0, price, 'no_profile'::text;
    RETURN;
  END IF;
  IF lower(rar) = 'common' AND NOT claimed THEN
    price := 0;
  END IF;
  IF price < 0 THEN
    RETURN QUERY SELECT false, false, cur, price, 'invalid_price'::text;
    RETURN;
  END IF;
  IF price > 0 AND cur < price THEN
    RETURN QUERY SELECT false, false, cur, price, 'insufficient_funds'::text;
    RETURN;
  END IF;
  nxt := cur - price;
  UPDATE public.profiles p
  SET
    tokens_balance = nxt,
    discover_free_common_claimed = CASE
      WHEN lower(rar) = 'common' AND NOT p.discover_free_common_claimed AND price = 0 THEN true
      ELSE p.discover_free_common_claimed
    END
  WHERE p.user_id = u;
  INSERT INTO public.user_discover_pins (user_id, companion_id) VALUES (u, v) ON CONFLICT DO NOTHING;
  IF price > 0 THEN
    INSERT INTO public.user_transactions (user_id, credits_change, balance_after, transaction_type, description, metadata)
    VALUES (
      u,
      -price,
      nxt,
      'card_purchase',
      'Discover: collection unlock',
      jsonb_build_object('companion_id', v, 'rarity', rar, 'fc', price)
    );
  END IF;
  RETURN QUERY SELECT true, false, nxt, price, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_discover_companion (text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_discover_companion (text) TO authenticated;

-- LustForge operator account: personal vault only, never Discover-listed (Nexus hybrids + known misfiled row).
UPDATE public.custom_characters c
SET
  exclude_from_personal_vault = false,
  is_public = false,
  approved = false
FROM auth.users u
WHERE c.user_id = u.id
  AND lower(u.email) IN ('lustforgeapp@gmail.com', 'lustforgeapp@googlemail.com')
  AND (
    COALESCE(c.is_nexus_hybrid, false) = true
    OR c.id = 'a7b3329e-919f-49b5-9a3c-de7c5a9888ef'::uuid
  );
