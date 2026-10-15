-- Dashboard-only hide. Rows stay in place; browse surfaces omit them.
-- Direct id lookups still succeed for admins, the owning account, and accounts
-- that already have a chat, gallery item, or relationship pointing at the row.

ALTER TABLE public.custom_characters
  ADD COLUMN IF NOT EXISTS hidden_from_dashboard boolean;

ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS hidden_from_dashboard boolean;

UPDATE public.custom_characters
SET hidden_from_dashboard = false
WHERE hidden_from_dashboard IS NULL;

UPDATE public.companions
SET hidden_from_dashboard = false
WHERE hidden_from_dashboard IS NULL;

ALTER TABLE public.custom_characters
  ALTER COLUMN hidden_from_dashboard SET DEFAULT false,
  ALTER COLUMN hidden_from_dashboard SET NOT NULL;

ALTER TABLE public.companions
  ALTER COLUMN hidden_from_dashboard SET DEFAULT false,
  ALTER COLUMN hidden_from_dashboard SET NOT NULL;

COMMENT ON COLUMN public.custom_characters.hidden_from_dashboard IS
  'When true, omit this companion from dashboard, discover, and other browse lists. Id lookups, existing threads, gallery rows, and relationships stay valid.';

COMMENT ON COLUMN public.companions.hidden_from_dashboard IS
  'When true, omit this companion from dashboard, discover, and other browse lists. Id lookups, existing threads, gallery rows, and relationships stay valid.';

-- True when the current user already has a thread, gallery item, pin, or relationship.
-- Security invoker so those tables'' own RLS applies. Does not grant access to private forges.
CREATE OR REPLACE FUNCTION public.user_has_companion_reference(p_companion_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE((
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE m.user_id = (SELECT auth.uid()) AND m.companion_id = p_companion_id
    )
    OR EXISTS (
      SELECT 1 FROM public.companion_relationships r
      WHERE r.user_id = (SELECT auth.uid()) AND r.companion_id = p_companion_id
    )
    OR EXISTS (
      SELECT 1 FROM public.generated_images g
      WHERE g.user_id = (SELECT auth.uid()) AND g.companion_id = p_companion_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_companion_portrait_overrides o
      WHERE o.user_id = (SELECT auth.uid()) AND o.companion_id = p_companion_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_discover_pins p
      WHERE p.user_id = (SELECT auth.uid()) AND p.companion_id = p_companion_id
    )
    OR EXISTS (
      SELECT 1 FROM public.lf_media lm
      WHERE lm.user_id = (SELECT auth.uid()) AND lm.companion_id = p_companion_id
    )
    OR EXISTS (
      SELECT 1 FROM public.companion_bonds b
      WHERE b.user_id = (SELECT auth.uid()) AND b.companion_id = p_companion_id
    )
    OR EXISTS (
      SELECT 1 FROM public.companion_posts posts
      WHERE posts.user_id = (SELECT auth.uid()) AND posts.companion_id = p_companion_id
    )
    OR EXISTS (
      SELECT 1 FROM public.group_chats g
      WHERE g.user_id = (SELECT auth.uid()) AND p_companion_id = ANY (g.companion_ids)
    )
  ), false);
$$;

REVOKE ALL ON FUNCTION public.user_has_companion_reference(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_companion_reference(text) TO authenticated;

-- Public catalog read: hidden rows drop out for everyone who only has this policy.
DROP POLICY IF EXISTS "Users can view approved public characters" ON public.custom_characters;
CREATE POLICY "Users can view approved public characters"
  ON public.custom_characters FOR SELECT
  USING (
    is_public = true
    AND approved = true
    AND hidden_from_dashboard = false
  );

-- Owning-account policy ("Users can view their own characters") is unchanged,
-- so the owner can still select a hidden row by id.
-- Admin policy ("Admins can manage all characters") is unchanged and unfiltered.

DROP POLICY IF EXISTS "Users can read hidden custom characters they already reference" ON public.custom_characters;
CREATE POLICY "Users can read hidden custom characters they already reference"
  ON public.custom_characters FOR SELECT
  TO authenticated
  USING (
    hidden_from_dashboard = true
    AND is_public = true
    AND approved = true
    AND public.user_has_companion_reference('cc-' || id::text)
  );

-- Catalog-owner roster is a dashboard listing. Hidden rows stay out of that blanket read.
-- Admins still read every row through "Admins can manage all characters".
DROP POLICY IF EXISTS "Catalog owner reads custom characters" ON public.custom_characters;
CREATE POLICY "Catalog owner reads custom characters"
  ON public.custom_characters FOR SELECT TO authenticated
  USING (
    hidden_from_dashboard = false
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid()) AND p.is_catalog_owner = true
    )
  );

DROP POLICY IF EXISTS "Users can view active companions" ON public.companions;
CREATE POLICY "Users can view active companions"
  ON public.companions
  FOR SELECT
  TO authenticated
  USING (is_active = true AND hidden_from_dashboard = false);

-- "Admins have full access to companions" is unchanged and unfiltered.

DROP POLICY IF EXISTS "Users can read hidden companions they already reference" ON public.companions;
CREATE POLICY "Users can read hidden companions they already reference"
  ON public.companions
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND hidden_from_dashboard = true
    AND public.user_has_companion_reference(id)
  );
