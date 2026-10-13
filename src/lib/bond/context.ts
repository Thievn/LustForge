import { supabase } from "@/integrations/supabase/client";
import { bondPromptBlock, tierForXp } from "@/lib/bond/logic";
import { TREASURES } from "@/lib/vault/treasures";

type Row = Record<string, unknown>;

function db() {
  return supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: Row | null }>;
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: Row[] | null }>;
            };
          };
          order: (col: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: Row[] | null }>;
          };
          maybeSingle: () => Promise<{ data: Row | null }>;
        };
      };
    };
  };
}

export async function loadBondPrompt(userId: string, companionId: string): Promise<string> {
  const client = db();
  const [bond, memories, scene, style, looks] = await Promise.all([
    client.from("companion_bonds").select("xp, nickname").eq("user_id", userId).eq("companion_id", companionId).maybeSingle(),
    client.from("companion_memories").select("body, feeling").eq("user_id", userId).eq("companion_id", companionId).order("updated_at", { ascending: false }).limit(8),
    client.from("companion_scenes").select("scene_title, setting").eq("user_id", userId).eq("companion_id", companionId).maybeSingle(),
    client.from("companion_style").select("outfit_name, outfit_neutral, scenario_name").eq("user_id", userId).eq("companion_id", companionId).maybeSingle(),
    client.from("companion_looks").select("name, is_default, outfit_id, accessory_id, scene_id, pose_id, hair_id, mood_id").eq("user_id", userId).eq("companion_id", companionId).order("created_at", { ascending: false }).limit(12),
  ]);
  const xp = Number(bond.data?.xp ?? 0);
  const tier = tierForXp(xp);
  const look = (looks.data ?? []).find((row) => row.is_default) ?? null;
  const lookNames = look
    ? ["outfit_id", "accessory_id", "hair_id", "scene_id", "pose_id", "mood_id"]
      .map((key) => TREASURES.find((item) => item.id === String(look[key] ?? ""))?.name)
      .filter(Boolean)
      .join(", ")
    : "";
  const outfit = lookNames || String(style.data?.outfit_name || style.data?.outfit_neutral || "");
  return bondPromptBlock({
    memories: (memories.data ?? []).map((row) => ({ body: String(row.body ?? ""), feeling: String(row.feeling ?? "") })),
    scene: String(scene.data?.setting || scene.data?.scene_title || ""),
    outfit,
    tierName: tier.name,
    nickname: String(bond.data?.nickname || tier.nicknames[0] || "you"),
    lines: tier.lines,
    jokes: tier.jokes,
    story: style.data?.scenario_name ? String(style.data.scenario_name) : null,
  });
}
