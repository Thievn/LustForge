import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { gate, json } from "../_shared/studioHttp.ts";
import { isLustforgeAdminUser } from "../_shared/requireSessionUser.ts";
import { cryptoRoll, drawWeighted, drawWithPity, dropOdds, tierOdds, type VaultRarity } from "../_shared/vaultDraw.ts";
import { assignLookSlots, composeLookSlots, LOOK_SLOTS, type LookSlot } from "../_shared/phraseTreasure.ts";
import { POSE_SET } from "../_shared/studioPoseIds.ts";

type Item = {
  id: string;
  name: string;
  kind: string;
  slot?: string | null;
  rarity: string;
  weight: number;
  neutral: string;
  pose_id: string | null;
  blurb: string;
  image_url?: string | null;
  thumb_url?: string | null;
  active: boolean;
  is_new?: boolean;
  pattern_payload?: unknown;
};

const SLOT_OF: Record<string, LookSlot> = {
  lingerie: "outfit",
  swim: "outfit",
  night: "outfit",
  costume: "outfit",
  accessory: "accessory",
  scene: "scene",
  pose: "pose",
  hair: "hair",
  mood: "mood",
};

function isVibration(item: Item): boolean {
  return item.kind === "vibration" || item.slot === "vibration";
}

function slotOf(item: Item): LookSlot {
  if (isVibration(item)) return "outfit";
  const raw = String(item.slot ?? "");
  if (raw === "outfit" || raw === "accessory" || raw === "scene" || raw === "pose" || raw === "hair" || raw === "mood") return raw;
  return SLOT_OF[item.kind] ?? "outfit";
}

function poseSkeleton(item: Item | null | undefined): string | null {
  const id = item?.pose_id ? String(item.pose_id) : "";
  return id && POSE_SET.has(id) ? id : null;
}

Deno.serve(async (req) => {
  const session = await gate(req);
  if ("response" in session) return session.response;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const action = String(body?.action ?? "quote");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);
    const user = session.user;
    const admin = await isLustforgeAdminUser(user);

    const settings = await svc.from("velvet_vault_settings").select("credit_cost, bundle_size, bundle_cost").eq("id", 1).maybeSingle();
    if (settings.error && /velvet_vault_settings|relation/i.test(settings.error.message)) {
      return json({ error: "The Velvet Vault is not migrated yet.", code: "MIGRATION_REQUIRED" }, 503);
    }
    const cost = Math.max(1, Math.min(50, Number(settings.data?.credit_cost ?? 5) || 5));
    const bundleSize = Math.max(2, Math.min(10, Number(settings.data?.bundle_size ?? 5) || 5));
    const bundleCost = Math.max(1, Math.min(200, Number(settings.data?.bundle_cost ?? 20) || 20));
    const itemsRes = await svc.from("collectible_items").select("*").eq("active", true);
    const items = (itemsRes.data ?? []) as Item[];
    const ownedRes = await svc.from("user_collectibles").select("item_id").eq("user_id", user.id);
    const owned = new Set((ownedRes.data ?? []).map((row) => String(row.item_id)));
    const remaining = items.filter((item) => !owned.has(item.id));
    const odds = dropOdds(remaining.map((item) => ({
      ...item,
      rarity: item.rarity as VaultRarity,
      weight: Number(item.weight) || 1,
    })));
    const percent = new Map(odds.map((item) => [item.id, item.percent]));
    const pool = items.map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      rarity: item.rarity,
      weight: Number(item.weight),
      neutral: item.neutral,
      poseId: item.pose_id,
      imageUrl: item.image_url,
      thumbUrl: item.thumb_url,
      blurb: item.blurb,
      slot: isVibration(item) ? "vibration" : slotOf(item),
      isNew: Boolean(item.is_new),
      owned: owned.has(item.id),
      percent: owned.has(item.id) ? 0 : percent.get(item.id) ?? 0,
    }));

    const tiers = tierOdds(remaining.map((item) => ({ rarity: item.rarity as VaultRarity })));
    const pityRow = await svc.from("user_vault_state").select("cracks_since_velvet").eq("user_id", user.id).maybeSingle();
    const pity = Number((pityRow.data as { cracks_since_velvet?: number } | null)?.cracks_since_velvet ?? 0);

    if (action === "quote") {
      const rewards = await svc.from("user_vault_rewards").select("category, title, badge").eq("user_id", user.id);
      return json({
        cost: admin ? 0 : cost,
        bundleSize,
        bundleCost: admin ? 0 : bundleCost,
        admin,
        collected: owned.size,
        total: items.length,
        allCollected: items.length > 0 && remaining.length === 0,
        tiers,
        pity,
        rewards: rewards.data ?? [],
        items: pool,
      });
    }

    const ownedItem = (id: unknown) => {
      const key = String(id ?? "");
      if (!key || !owned.has(key)) return null;
      return items.find((item) => item.id === key) ?? null;
    };

    const catalog = items.filter((item) => !isVibration(item)).map((item) => ({
      id: item.id,
      slot: slotOf(item),
      neutral: item.neutral,
      poseId: poseSkeleton(item),
    }));
    const slotRequest = {
      outfit: body?.outfitId,
      accessory: body?.accessoryId,
      scene: body?.sceneId,
      pose: body?.poseId,
      hair: body?.hairId,
      mood: body?.moodId,
    } as Partial<Record<LookSlot, string>>;

    if (action === "picture" || action === "compose") {
      const artLabel = String(body?.artLabel ?? "Photorealistic");
      let preferred: Partial<Record<LookSlot, string | null>> | undefined;
      if (action === "picture") {
        const companionId = String(body?.companionId ?? "").trim();
        if (companionId) {
          const look = await svc.from("companion_looks").select("outfit_id, accessory_id, scene_id, pose_id, hair_id, mood_id").eq("user_id", user.id).eq("companion_id", companionId).eq("is_default", true).maybeSingle();
          const row = look.data as Record<string, string | null> | null;
          if (row) {
            preferred = {
              outfit: row.outfit_id,
              accessory: row.accessory_id,
              scene: row.scene_id,
              pose: row.pose_id,
              hair: row.hair_id,
              mood: row.mood_id,
            };
          }
        }
      }
      const assigned = assignLookSlots({
        requested: slotRequest,
        catalog,
        ownedIds: owned,
        fill: action === "picture" ? "look-or-owned" : undefined,
        preferred,
        pick: (_slot, choices) => drawWeighted(choices.map((item) => ({ ...item, weight: 1 })), cryptoRoll()),
      });
      if (!assigned.ok) {
        const status = assigned.code === "WRONG_SLOT" ? 400 : 403;
        return json({
          error: assigned.code === "WRONG_SLOT" ? "That treasure does not go in that slot." : "Find it in the Vault first.",
          code: assigned.code,
        }, status);
      }
      if (!Object.keys(assigned.slots).length) {
        return json({ error: "She has nothing to wear yet. Unveil a Treasure, or tap Wear this." }, 400);
      }
      const composed = composeLookSlots(
        Object.fromEntries(LOOK_SLOTS.map((slot) => {
          const item = assigned.slots[slot];
          return [slot, item ? { neutral: item.neutral, poseId: item.poseId } : null];
        })),
        artLabel,
      );
      if (!composed.prompt) return json({ error: "That look has nothing to say yet." }, 400);
      return json({ prompt: composed.prompt, poseId: composed.poseId, artLabel });
    }

    if (action === "wear" || action === "saveLook" || action === "applyLook") {
      const companionId = String(body?.companionId ?? "").trim();
      if (!companionId) return json({ error: "Pick her first." }, 400);
      const remember = async (patch: Record<string, unknown>) => {
        if (!Object.keys(patch).length) return;
        await svc.from("companion_style").upsert({
          user_id: user.id,
          companion_id: companionId,
          updated_at: new Date().toISOString(),
          ...patch,
        });
      };
      if (action === "wear") {
        const item = ownedItem(body?.itemId);
        if (!item) return json({ error: "Find it in the Vault first.", code: "NOT_OWNED" }, 403);
        if (isVibration(item)) {
          const existing = await svc.from("companion_looks").select("id").eq("user_id", user.id).eq("companion_id", companionId).eq("is_default", true).maybeSingle();
          if (existing.error && /vibration_id|column/i.test(existing.error.message) === false && existing.error) {
            return json({ error: "Could not save that pattern." }, 500);
          }
          const written = existing.data?.id
            ? await svc.from("companion_looks").update({ vibration_id: item.id }).eq("id", existing.data.id)
            : await svc.from("companion_looks").insert({
              user_id: user.id,
              companion_id: companionId,
              name: "Worn now",
              is_default: true,
              vibration_id: item.id,
            });
          if (written.error) {
            const missing = /vibration_id|column/i.test(written.error.message);
            return json({
              error: missing ? "Vibration treasures need the latest vault migration before they can be applied." : "Could not save that pattern.",
            }, missing ? 503 : 500);
          }
          return json({ ok: true, slot: "vibration", itemId: item.id, name: item.name, pattern: item.pattern_payload ?? null });
        }
        const slot = slotOf(item);
        const column = `${slot === "pose" ? "pose" : slot}_id`;
        const existing = await svc.from("companion_looks").select("id").eq("user_id", user.id).eq("companion_id", companionId).eq("is_default", true).maybeSingle();
        const patch: Record<string, unknown> = { [column]: item.id, user_id: user.id, companion_id: companionId, name: "Worn now", is_default: true };
        if (existing.data?.id) {
          await svc.from("companion_looks").update({ [column]: item.id }).eq("id", existing.data.id);
        } else {
          await svc.from("companion_looks").insert(patch);
        }
        const style: Record<string, unknown> = {};
        if (slot === "outfit") {
          style.outfit_name = item.name;
          style.outfit_neutral = item.neutral;
        } else if (slot === "scene") {
          style.scene_name = item.name;
          style.scene_neutral = item.neutral;
        } else if (slot === "pose") {
          style.pose_id = poseSkeleton(item);
          style.pose_neutral = item.neutral;
        }
        await remember(style);
        return json({ ok: true, slot, itemId: item.id, name: item.name });
      }
      if (action === "applyLook") {
        const look = await svc.from("companion_looks").select("*").eq("id", String(body?.lookId ?? "")).eq("user_id", user.id).maybeSingle();
        const row = look.data as Record<string, string | null> | null;
        if (!row) return json({ error: "That look is not yours." }, 404);
        const fields = ["outfit_id", "accessory_id", "scene_id", "pose_id", "hair_id", "mood_id"] as const;
        if (fields.some((field) => row[field] && !owned.has(String(row[field])))) {
          return json({ error: "Find it in the Vault first.", code: "NOT_OWNED" }, 403);
        }
        const worn = assignLookSlots({
          requested: {
            outfit: row.outfit_id,
            accessory: row.accessory_id,
            scene: row.scene_id,
            pose: row.pose_id,
            hair: row.hair_id,
            mood: row.mood_id,
          },
          catalog,
          ownedIds: owned,
        });
        if (!worn.ok) return json({ error: "Find it in the Vault first.", code: worn.code }, worn.code === "WRONG_SLOT" ? 400 : 403);
        await svc.from("companion_looks").update({ is_default: false }).eq("user_id", user.id).eq("companion_id", companionId).eq("is_default", true);
        await svc.from("companion_looks").update({ is_default: true }).eq("id", row.id);
        await remember({
          outfit_name: worn.slots.outfit ? items.find((item) => item.id === worn.slots.outfit?.id)?.name ?? null : null,
          outfit_neutral: worn.slots.outfit?.neutral ?? null,
          scene_name: worn.slots.scene ? items.find((item) => item.id === worn.slots.scene?.id)?.name ?? null : null,
          scene_neutral: worn.slots.scene?.neutral ?? null,
          pose_id: worn.slots.pose?.poseId ?? null,
          pose_neutral: worn.slots.pose?.neutral ?? null,
        });
        return json({ ok: true, look: row });
      }
      const assigned = assignLookSlots({ requested: slotRequest, catalog, ownedIds: owned });
      if (!assigned.ok) {
        return json({
          error: assigned.code === "WRONG_SLOT" ? "That treasure does not go in that slot." : "Find it in the Vault first.",
          code: assigned.code,
        }, assigned.code === "WRONG_SLOT" ? 400 : 403);
      }
      if (!Object.keys(assigned.slots).length) return json({ error: "A look needs at least one treasure." }, 400);
      const wanted = {
        outfit_id: assigned.slots.outfit?.id ?? null,
        accessory_id: assigned.slots.accessory?.id ?? null,
        scene_id: assigned.slots.scene?.id ?? null,
        pose_id: assigned.slots.pose?.id ?? null,
        hair_id: assigned.slots.hair?.id ?? null,
        mood_id: assigned.slots.mood?.id ?? null,
      };
      const name = String(body?.name ?? "A look").slice(0, 48) || "A look";
      const makeDefault = Boolean(body?.isDefault);
      if (makeDefault) {
        await svc.from("companion_looks").update({ is_default: false }).eq("user_id", user.id).eq("companion_id", companionId).eq("is_default", true);
      }
      const saved = await svc.from("companion_looks").insert({
        user_id: user.id,
        companion_id: companionId,
        name,
        is_default: makeDefault,
        ...wanted,
      }).select("id").maybeSingle();
      if (saved.error) return json({ error: saved.error.message }, 400);
      return json({ ok: true, id: (saved.data as { id?: string } | null)?.id ?? null });
    }

    if (action === "post") {
      const companionId = String(body?.companionId ?? "").trim();
      const imageUrl = String(body?.imageUrl ?? "").trim();
      const caption = String(body?.caption ?? "For you.").slice(0, 280);
      if (!companionId || imageUrl.length < 8) {
        return json({ error: "A post needs her and a picture." }, 400);
      }
      const committed = await svc.rpc("velvet_commit_post", {
        p_user_id: user.id,
        p_companion_id: companionId,
        p_caption: caption,
        p_image_url: imageUrl,
        p_skip_charge: admin,
      });
      if (committed.error) {
        const message = committed.error.message || "That post did not go up.";
        const code = /NEED_CREDITS/.test(message) ? "NEED_CREDITS" : "POST_FAILED";
        return json({
          error: code === "NEED_CREDITS" ? "A post takes 1 credit." : message,
          code,
        }, code === "NEED_CREDITS" ? 402 : 409);
      }
      return json({
        postId: (committed.data as { post_id?: string } | null)?.post_id ?? null,
        credits: (committed.data as { credits?: number } | null)?.credits ?? null,
        cost: admin ? 0 : 1,
      });
    }

    if (action !== "open" && action !== "bundle") return json({ error: "Unknown action" }, 400);
    if (!items.length) return json({ error: "The vault is empty.", code: "MIGRATION_REQUIRED" }, 503);
    if (!remaining.length) return json({ error: "All collected, more coming soon", code: "ALL_COLLECTED", items: pool }, 409);

    const snapshot = odds.map((item) => ({ id: item.id, percent: Number(item.percent.toFixed(4)), rarity: item.rarity }));
    const drawPool = remaining.map((item) => ({ ...item, rarity: item.rarity as VaultRarity, weight: Number(item.weight) || 1 }));

    if (action === "bundle") {
      if (remaining.length < bundleSize) {
        return json({ error: "Not enough treasures left for a bundle.", code: "SHORT_POOL", tiers }, 409);
      }
      const rolls = Array.from({ length: bundleSize }, () => cryptoRoll());
      const drawn = drawWithPity(drawPool, rolls, pity).drawn;
      const committed = await svc.rpc("velvet_commit_bundle", {
        p_user_id: user.id,
        p_item_ids: drawn.map((item) => item.id),
        p_cost: bundleCost,
        p_rolls: rolls,
        p_odds: snapshot,
        p_skip_charge: admin,
      });
      if (committed.error) {
        const message = committed.error.message || "Could not unveil the bundle";
        const code = /NEED_CREDITS/.test(message) ? "NEED_CREDITS" : /ALREADY_OWNED/.test(message) ? "ALREADY_OWNED" : /PITY_DUE/.test(message) ? "PITY_DUE" : "VAULT_FAILED";
        return json({
          error: code === "NEED_CREDITS" ? `A bundle of ${bundleSize} takes ${bundleCost} credits.` : message,
          code,
        }, code === "NEED_CREDITS" ? 402 : 409);
      }
      return json({
        items: drawn.map((item) => pool.find((row) => row.id === item.id) ?? item),
        credits: (committed.data as { credits?: number } | null)?.credits ?? null,
        cost: admin ? 0 : bundleCost,
        rolls,
        tiers,
      });
    }

    const roll = cryptoRoll();
    const drawn = drawWithPity(drawPool, [roll], pity).drawn[0];
    if (!drawn) return json({ error: "The vault stayed shut." }, 409);
    const committed = await svc.rpc("velvet_commit_open", {
      p_user_id: user.id,
      p_item_id: drawn.id,
      p_cost: cost,
      p_roll: roll,
      p_odds: snapshot,
      p_skip_charge: admin,
    });
    if (committed.error) {
      const message = committed.error.message || "Could not unveil the vault";
      const code = /NEED_CREDITS/.test(message) ? "NEED_CREDITS" : /ALREADY_OWNED/.test(message) ? "ALREADY_OWNED" : /PITY_DUE/.test(message) ? "PITY_DUE" : "VAULT_FAILED";
      return json({ error: code === "NEED_CREDITS" ? `Unveiling a Treasure takes ${cost} credits.` : message, code }, code === "NEED_CREDITS" ? 402 : 409);
    }
    return json({
      item: pool.find((item) => item.id === drawn.id) ?? drawn,
      credits: (committed.data as { credits?: number } | null)?.credits ?? null,
      cost: admin ? 0 : cost,
      roll,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message.slice(0, 400) }, 500);
  }
});
