import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseCustomCharacterRow, mapSupabaseStockCompanionRow, type DbCompanion } from "@/hooks/useCompanions";

/**
 * `useCompanions()` omits forge rows with `exclude_from_personal_vault`, non–public-approved rows,
 * and anything flagged `hidden_from_dashboard`.
 * For a direct id (chat, profile, live call), fetch that row with no dashboard filter when RLS allows
 * (owner, admin, or an existing thread / gallery / relationship).
 */
export function useForgeCompanionOverlay(
  id: string | undefined,
  dbCompanions: DbCompanion[] | undefined,
  companionsLoading: boolean,
): { dbComp: DbCompanion | null; forgeLookupBusy: boolean } {
  const [forgeRowOverlay, setForgeRowOverlay] = useState<DbCompanion | null>(null);
  const [forgeRowFetching, setForgeRowFetching] = useState(false);

  const dbCompFromList = useMemo(
    () => (id && dbCompanions ? dbCompanions.find((c) => c.id === id) : undefined) ?? null,
    [dbCompanions, id],
  );

  useEffect(() => {
    setForgeRowOverlay(null);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setForgeRowFetching(false);
      return;
    }
    if (dbCompFromList) {
      setForgeRowOverlay(null);
      setForgeRowFetching(false);
      return;
    }
    if (companionsLoading) return;

    let cancelled = false;
    setForgeRowFetching(true);
    void (async () => {
      if (id.startsWith("cc-")) {
        const uuid = id.slice(3);
        const { data, error } = await supabase.from("custom_characters").select("*").eq("id", uuid).maybeSingle();
        if (cancelled) return;
        if (error || !data) setForgeRowOverlay(null);
        else setForgeRowOverlay(mapSupabaseCustomCharacterRow(data as Record<string, unknown>));
      } else {
        const { data, error } = await supabase.from("companions").select("*").eq("id", id).maybeSingle();
        if (cancelled) return;
        if (error || !data) setForgeRowOverlay(null);
        else setForgeRowOverlay(mapSupabaseStockCompanionRow(data as Record<string, unknown>));
      }
      setForgeRowFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, companionsLoading, dbCompFromList]);

  const dbComp = dbCompFromList ?? forgeRowOverlay;
  return { dbComp, forgeLookupBusy: forgeRowFetching };
}
