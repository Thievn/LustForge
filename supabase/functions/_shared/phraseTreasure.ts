/** Style-neutral treasure text, phrased for the companion's art lane at generation time. */

export type ArtLane = "photoreal" | "cinematic" | "semireal" | "anime" | "illustrated" | "3d";

const LANE_TAIL: Record<ArtLane, string> = {
  photoreal: "photographed realistically, true fabric and skin texture, natural light, sharp focus, fictional adult",
  cinematic: "cinematic film still of a fictional adult, realistic cloth, shallow depth of field",
  semireal: "semi-realistic digital painting of a fictional adult, stylized shading, solid anatomy",
  anime: "anime illustration of a fictional adult, cel shading, clean lineart, not a photograph",
  illustrated: "illustration of a fictional adult in the companion's drawn style, not a photograph",
  "3d": "3D character render of a fictional adult, physically based cloth, studio light",
};

export function artLaneFromLabel(label: string | null | undefined): ArtLane {
  const art = String(label ?? "").toLowerCase();
  if (/anime|manga|cel[-\s]?shad|hentai|ecchi|screentone/.test(art)) return "anime";
  if (/\b3d\b|octane|pixar|cg render|unreal/.test(art)) return "3d";
  if (/semi-?real|painterly digital/.test(art)) return "semireal";
  if (/oil|watercolor|comic|sketch|pin-?up|illustration|manga/.test(art)) return "illustrated";
  if (/cinematic|film still|anamorphic/.test(art)) return "cinematic";
  return "photoreal";
}

/** `neutral` must not name an art style. The lane tail is added once, here. */
export function phraseNeutralForStyle(neutral: string, lane: ArtLane): string {
  const core = String(neutral ?? "").trim().replace(/\.+$/, "");
  if (!core) return LANE_TAIL[lane];
  return `${core}, ${LANE_TAIL[lane]}`;
}

export type LookSlot = "outfit" | "accessory" | "scene" | "pose" | "hair" | "mood";

export const LOOK_SLOTS: LookSlot[] = ["outfit", "accessory", "scene", "pose", "hair", "mood"];

const SLOT_ORDER: LookSlot[] = ["outfit", "accessory", "hair", "scene", "pose", "mood"];

export type LookPiece = { id: string; slot: LookSlot; neutral: string; poseId?: string | null };

/**
 * Requested ids must be owned and must match the slot.
 * Spontaneous fills use a default look when any of its pieces are owned,
 * and otherwise one owned piece per slot.
 */
export function assignLookSlots(args: {
  requested: Partial<Record<LookSlot, string | null | undefined>>;
  catalog: LookPiece[];
  ownedIds: ReadonlySet<string>;
  fill?: "look-or-owned";
  preferred?: Partial<Record<LookSlot, string | null | undefined>>;
  pick?: (slot: LookSlot, choices: LookPiece[]) => LookPiece | null;
}): { ok: true; slots: Partial<Record<LookSlot, LookPiece>> } | { ok: false; code: "NOT_OWNED" | "WRONG_SLOT"; slot: LookSlot } {
  const byId = new Map(args.catalog.map((item) => [item.id, item]));
  const slots: Partial<Record<LookSlot, LookPiece>> = {};
  const take = (slot: LookSlot, raw: string | null | undefined, strict: boolean) => {
    const id = String(raw ?? "").trim();
    if (!id) return "skip" as const;
    const item = byId.get(id);
    if (!item || !args.ownedIds.has(id)) return strict ? ("NOT_OWNED" as const) : ("skip" as const);
    if (item.slot !== slot) return strict ? ("WRONG_SLOT" as const) : ("skip" as const);
    slots[slot] = item;
    return "ok" as const;
  };
  for (const slot of LOOK_SLOTS) {
    const result = take(slot, args.requested[slot], true);
    if (result === "NOT_OWNED" || result === "WRONG_SLOT") return { ok: false, code: result, slot };
  }
  const explicit = LOOK_SLOTS.some((slot) => String(args.requested[slot] ?? "").trim());
  if (args.fill === "look-or-owned" && !explicit) {
    let usedLook = false;
    for (const slot of LOOK_SLOTS) {
      const before = slots[slot];
      take(slot, args.preferred?.[slot], false);
      if (!before && slots[slot]) usedLook = true;
    }
    if (!usedLook && args.pick) {
      for (const slot of LOOK_SLOTS) {
        if (slots[slot]) continue;
        const choices = args.catalog.filter((item) => item.slot === slot && args.ownedIds.has(item.id));
        const picked = choices.length ? args.pick(slot, choices) : null;
        if (picked && picked.slot === slot && args.ownedIds.has(picked.id)) slots[slot] = picked;
      }
    }
  }
  return { ok: true, slots };
}

export function phraseWornLook(
  pieces: Array<{ neutral: string } | null | undefined>,
  artLabel: string | null | undefined,
): string {
  const lane = artLaneFromLabel(artLabel);
  const cores = pieces
    .map((piece) => String(piece?.neutral ?? "").trim().replace(/\.+$/, ""))
    .filter(Boolean);
  if (!cores.length) return "";
  return phraseNeutralForStyle(cores.join(", "), lane);
}

/** One item per slot. The pose skeleton comes only from the pose slot. */
export function composeLookSlots(
  slots: Partial<Record<LookSlot, { neutral: string; poseId?: string | null } | null>>,
  artLabel: string | null | undefined,
): { prompt: string; poseId: string | null } {
  const pieces = SLOT_ORDER.map((slot) => slots[slot] ?? null);
  return {
    prompt: phraseWornLook(pieces, artLabel),
    poseId: slots.pose?.poseId ? String(slots.pose.poseId) : null,
  };
}
