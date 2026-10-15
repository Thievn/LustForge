import { supabase } from "@/integrations/supabase/client";
import { messageFromFunctionsInvoke } from "@/lib/supabaseFunctionsError";
import type { TreasureSlot } from "@/lib/vault/treasures";

export type LookRow = {
  id: string;
  name: string;
  is_default: boolean;
  outfit_id: string | null;
  accessory_id: string | null;
  scene_id: string | null;
  pose_id: string | null;
  hair_id: string | null;
  mood_id: string | null;
};

export type VaultPiece = {
  id: string;
  name: string;
  slot: TreasureSlot;
  kind: string;
  rarity: string;
  blurb: string;
  owned: boolean;
  isNew: boolean;
  poseId?: string | null;
};

const SLOT_COLUMN: Record<Exclude<TreasureSlot, "vibration">, keyof LookRow> = {
  outfit: "outfit_id",
  accessory: "accessory_id",
  scene: "scene_id",
  pose: "pose_id",
  hair: "hair_id",
  mood: "mood_id",
};

export function lookSlotId(look: LookRow, slot: TreasureSlot): string | null {
  if (slot === "vibration") return null;
  const value = look[SLOT_COLUMN[slot]];
  return typeof value === "string" && value ? value : null;
}

export async function vaultCall(body: Record<string, unknown>): Promise<{ data: Record<string, unknown> | null; error: string | null; code?: string }> {
  const res = await supabase.functions.invoke("velvet-vault", { body });
  const data = (res.data ?? null) as Record<string, unknown> | null;
  if (res.error || (data && typeof data.error === "string")) {
    return {
      data,
      error: await messageFromFunctionsInvoke(res.error, data),
      code: typeof data?.code === "string" ? data.code : undefined,
    };
  }
  return { data, error: null };
}

export async function loadCompanionLooks(userId: string, companionId: string): Promise<LookRow[]> {
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: LookRow[] | null }>;
            };
          };
        };
      };
    };
  };
  const { data } = await client
    .from("companion_looks")
    .select("id, name, is_default, outfit_id, accessory_id, scene_id, pose_id, hair_id, mood_id")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .order("created_at", { ascending: false })
    .limit(40);
  return data ?? [];
}
