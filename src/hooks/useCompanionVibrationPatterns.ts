import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CompanionVibrationPatternRow = {
  id: string;
  display_name: string;
  sort_order: number;
  is_abyssal_signature: boolean;
  vibration_pattern_pool: { payload: unknown } | null;
};

type LooseQuery = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string | boolean) => LooseEq;
    };
  };
};
type LooseEq = {
  eq: (col: string, val: string | boolean) => LooseEq;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
};

async function equippedVaultVibration(companionId: string): Promise<CompanionVibrationPatternRow | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return null;
  const client = supabase as unknown as LooseQuery;
  const look = await client
    .from("companion_looks")
    .select("vibration_id")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .eq("is_default", true)
    .maybeSingle();
  const vibrationId = typeof look.data?.vibration_id === "string" ? look.data.vibration_id : "";
  if (look.error || !vibrationId) return null;
  const item = await client.from("collectible_items").select("id, name, pattern_payload").eq("id", vibrationId).maybeSingle();
  if (item.error || item.data?.pattern_payload == null || typeof item.data.id !== "string") return null;
  return {
    id: `vault-${item.data.id}`,
    display_name: typeof item.data.name === "string" && item.data.name ? item.data.name : "Vault pattern",
    sort_order: -1,
    is_abyssal_signature: false,
    vibration_pattern_pool: { payload: item.data.pattern_payload },
  };
}

export function useCompanionVibrationPatterns(companionId: string | undefined) {
  return useQuery({
    queryKey: ["companion-vibration-patterns", companionId],
    enabled: Boolean(companionId?.trim()),
    queryFn: async (): Promise<CompanionVibrationPatternRow[]> => {
      const { data: rows, error: e1 } = await supabase
        .from("companion_vibration_patterns")
        .select("id, display_name, sort_order, is_abyssal_signature, pool_pattern_id")
        .eq("companion_id", companionId!)
        .order("sort_order", { ascending: true });
      if (e1) throw e1;
      if (!rows?.length) {
        const onlyEquipped = await equippedVaultVibration(companionId!);
        return onlyEquipped ? [onlyEquipped] : [];
      }

      const poolIds = [...new Set(rows.map((r) => r.pool_pattern_id))];
      const { data: pools, error: e2 } = await supabase
        .from("vibration_pattern_pool")
        .select("id, payload")
        .in("id", poolIds);
      if (e2) throw e2;
      const byId = new Map((pools ?? []).map((p) => [p.id, p]));

      const mapped = rows.map((r) => ({
        id: r.id,
        display_name: r.display_name,
        sort_order: r.sort_order,
        is_abyssal_signature: r.is_abyssal_signature,
        vibration_pattern_pool: byId.get(r.pool_pattern_id)
          ? { payload: byId.get(r.pool_pattern_id)!.payload }
          : null,
      }));
      const equipped = await equippedVaultVibration(companionId!);
      return equipped ? [equipped, ...mapped] : mapped;
    },
    staleTime: 60 * 1000,
  });
}
