import { describe, expect, it } from "vitest";
import { drawMany, drawWeighted, drawWithPity, dropOdds, poolForPity, settleVaultCharge, tierOdds } from "../../supabase/functions/_shared/vaultDraw";
import { assignLookSlots, composeLookSlots, phraseNeutralForStyle, artLaneFromLabel } from "../../supabase/functions/_shared/phraseTreasure";
import { TREASURES, assertTreasureCatalog } from "@/lib/vault/treasures";
import { DATE_SCENES } from "@/lib/bond/scenes";
import { STORYLINES } from "@/lib/bond/storylines";

describe("velvet vault", () => {
  it("seeds a full pool and never repeats an owned treasure", () => {
    assertTreasureCatalog();
    expect(TREASURES.length).toBe(162);
    const counts = { silk: 0, satin: 0, velvet: 0, forbidden: 0, obsession: 0 };
    for (const item of TREASURES) counts[item.rarity] += 1;
    expect(counts).toEqual({ silk: 68, satin: 46, velvet: 20, forbidden: 17, obsession: 11 });
    expect(TREASURES.filter((item) => item.kind === "vibration")).toHaveLength(12);
    const full = tierOdds(TREASURES);
    expect(full.silk).toBeCloseTo(53, 5);
    expect(full.satin).toBeCloseTo(27, 5);
    expect(full.velvet).toBeCloseTo(13, 5);
    expect(full.forbidden).toBeCloseTo(5, 5);
    expect(full.obsession).toBeCloseTo(2, 5);
    expect(DATE_SCENES.length).toBeGreaterThanOrEqual(40);
    expect(STORYLINES.length).toBeGreaterThanOrEqual(40);
    const owned = new Set(["lace-black-set"]);
    const remaining = TREASURES.filter((item) => !owned.has(item.id));
    const odds = dropOdds(remaining);
    const sum = odds.reduce((total, item) => total + item.percent, 0);
    expect(sum).toBeCloseTo(100, 5);
    expect(odds.find((item) => item.id === "lace-black-set")).toBeUndefined();
    const first = drawWeighted(odds, 0);
    expect(first.id).toBe(odds[0]?.id);
    const last = drawWeighted(odds, 0.999999);
    expect(last.id).toBe(odds[odds.length - 1]?.id);
    const noSilk = TREASURES.filter((item) => item.rarity !== "silk");
    const shifted = tierOdds(noSilk);
    expect(shifted.silk).toBe(0);
    expect(shifted.satin).toBeCloseTo((27 / 47) * 100, 5);
    expect(shifted.velvet).toBeCloseTo((13 / 47) * 100, 5);
    expect(shifted.forbidden).toBeCloseTo((5 / 47) * 100, 5);
    expect(shifted.obsession).toBeCloseTo((2 / 47) * 100, 5);
    const silkOnly = TREASURES.filter((item) => item.rarity === "silk").slice(0, 3);
    expect(poolForPity(silkOnly, 14).pity).toBe(false);
    const mixed = [
      ...TREASURES.filter((item) => item.rarity === "silk").slice(0, 2),
      ...TREASURES.filter((item) => item.rarity === "velvet").slice(0, 2),
    ];
    const forced = poolForPity(mixed, 14);
    expect(forced.pity).toBe(true);
    expect(forced.pool.every((item) => item.rarity === "velvet")).toBe(true);
    const pityDraw = drawWithPity(mixed, [0.99], 14);
    expect(pityDraw.drawn[0]?.rarity).toBe("velvet");
    expect(pityDraw.pity).toBe(0);
    const look = composeLookSlots({
      outfit: { neutral: "a black lace bra and a matching thong on a fictional adult" },
      pose: { neutral: "looking back over her shoulder, fictional adult", poseId: "t_lookback_hip" },
      mood: { neutral: "candlelight on a fictional adult" },
    }, "Anime Style");
    expect(look.poseId).toBe("t_lookback_hip");
    expect(look.prompt.match(/cel shading/g)?.length).toBe(1);
    expect(look.prompt).toContain("candlelight");
    const onlyObsession = TREASURES.filter((item) => item.rarity === "obsession");
    expect(tierOdds(onlyObsession).obsession).toBeCloseTo(100, 5);
    const bundle = drawMany(noSilk, [0, 0, 0]);
    expect(new Set(bundle.map((item) => item.id)).size).toBe(3);
    expect(bundle.every((item) => item.rarity !== "silk")).toBe(true);
  });

  it("refunds a failed crack and phrases a neutral garment for her art style", () => {
    expect(settleVaultCharge({ admin: false, cost: 3, ok: false })).toEqual({ kept: 0, refunded: 3 });
    expect(settleVaultCharge({ admin: false, cost: 3, ok: true })).toEqual({ kept: 3, refunded: 0 });
    expect(settleVaultCharge({ admin: true, cost: 3, ok: true })).toEqual({ kept: 0, refunded: 0 });
    const neutral = "a black lace bra and a matching thong on a fictional adult";
    expect(artLaneFromLabel("Anime Style")).toBe("anime");
    expect(artLaneFromLabel("Photorealistic")).toBe("photoreal");
    const anime = phraseNeutralForStyle(neutral, "anime");
    const photo = phraseNeutralForStyle(neutral, "photoreal");
    expect(anime).toContain("cel shading");
    expect(photo).toContain("photographed realistically");
    expect(anime).not.toContain("photographed realistically");
    expect(neutral).not.toMatch(/anime|photoreal/i);
  });

  it("refuses unowned treasures and keeps a default look intact", () => {
    const catalog = [
      { id: "o1", slot: "outfit" as const, neutral: "black lace" },
      { id: "p1", slot: "pose" as const, neutral: "looking back", poseId: "t_lookback_hip" },
      { id: "m1", slot: "mood" as const, neutral: "candlelight" },
    ];
    const owned = new Set(["o1", "p1"]);
    const refused = assignLookSlots({ requested: { outfit: "missing" }, catalog, ownedIds: owned });
    expect(refused.ok).toBe(false);
    if (refused.ok === false) expect(refused.code).toBe("NOT_OWNED");
    const wrong = assignLookSlots({ requested: { pose: "o1" }, catalog, ownedIds: owned });
    expect(wrong.ok).toBe(false);
    if (wrong.ok === false) expect(wrong.code).toBe("WRONG_SLOT");
    const fromLook = assignLookSlots({
      requested: {},
      catalog,
      ownedIds: owned,
      fill: "look-or-owned",
      preferred: { outfit: "o1", mood: "m1" },
      pick: () => catalog[1]!,
    });
    expect(fromLook.ok).toBe(true);
    if (fromLook.ok) {
      expect(fromLook.slots.outfit?.id).toBe("o1");
      expect(fromLook.slots.mood).toBeUndefined();
      expect(fromLook.slots.pose).toBeUndefined();
    }
    const random = assignLookSlots({
      requested: {},
      catalog,
      ownedIds: owned,
      fill: "look-or-owned",
      preferred: { outfit: "nope" },
      pick: (_slot, choices) => choices[0] ?? null,
    });
    expect(random.ok).toBe(true);
    if (random.ok) {
      expect(random.slots.outfit?.id).toBe("o1");
      expect(random.slots.pose?.id).toBe("p1");
      expect(random.slots.mood).toBeUndefined();
    }
  });
});
