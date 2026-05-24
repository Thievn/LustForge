/** Shared Lovense callback / getToys payload parsing for edge functions. */

export type ParsedLovenseToy = {
  deviceUid: string;
  displayName: string;
  toyType: string;
  nickname: string | null;
  battery: number | null;
};

const TOY_TYPE_CAPS: Record<string, string[]> = {
  lush: ["vibrate"],
  hush: ["vibrate"],
  nora: ["vibrate", "rotate"],
  max: ["vibrate", "thrust"],
  calor: ["vibrate"],
  gush: ["vibrate"],
  ferri: ["vibrate"],
  domi: ["vibrate"],
  osci: ["vibrate"],
  edge: ["vibrate"],
  solace: ["vibrate", "thrust"],
  unknown: ["vibrate"],
};

export function capabilitiesForToyType(toyType: string): string[] {
  const t = (toyType || "").toLowerCase();
  return TOY_TYPE_CAPS[t] ?? TOY_TYPE_CAPS.unknown;
}

function toyTypeFromRecord(toy: Record<string, unknown>): string {
  if (typeof toy.toyType === "string" && toy.toyType.trim()) return toy.toyType.toLowerCase();
  if (typeof toy.type === "string" && toy.type.trim()) return toy.type.toLowerCase();
  if (typeof toy.name === "string" && toy.name.trim()) return String(toy.name).toLowerCase();
  return "unknown";
}

function displayNameFromRecord(toy: Record<string, unknown>, toyType: string): string {
  const nick =
    (typeof toy.nickName === "string" && toy.nickName.trim()) ||
    (typeof toy.nickname === "string" && toy.nickname.trim()) ||
    "";
  if (nick) return nick;
  const model =
    (typeof toy.toyType === "string" && toy.toyType.trim()) ||
    (typeof toy.name === "string" && toy.name.trim()) ||
    "";
  if (model && model.toLowerCase() !== "unknown") {
    const m = model.trim();
    return m.charAt(0).toUpperCase() + m.slice(1);
  }
  if (toyType !== "unknown") {
    return toyType.charAt(0).toUpperCase() + toyType.slice(1);
  }
  return "Lovense toy";
}

function recordToParsed(mapKey: string, toy: Record<string, unknown>): ParsedLovenseToy | null {
  const rawId = toy.id ?? toy.uid ?? mapKey;
  const deviceUid = rawId != null ? String(rawId).trim() : mapKey.trim();
  if (!deviceUid) return null;
  const toyType = toyTypeFromRecord(toy);
  const battery =
    typeof toy.battery === "number" && Number.isFinite(toy.battery) ? Math.round(toy.battery) : null;
  const nickname =
    typeof toy.nickName === "string"
      ? toy.nickName
      : typeof toy.nickname === "string"
        ? toy.nickname
        : null;
  return {
    deviceUid,
    displayName: displayNameFromRecord(toy, toyType),
    toyType,
    nickname,
    battery,
  };
}

/** Lovense may send `toyList` (array), `toys` (map), or a single `toy` object. */
export function extractToysFromCallback(callbackData: Record<string, unknown>): ParsedLovenseToy[] {
  const out: ParsedLovenseToy[] = [];
  const seen = new Set<string>();

  const pushRecord = (key: string, toy: unknown) => {
    if (!toy || typeof toy !== "object" || Array.isArray(toy)) return;
    const parsed = recordToParsed(key, toy as Record<string, unknown>);
    if (!parsed || seen.has(parsed.deviceUid)) return;
    seen.add(parsed.deviceUid);
    out.push(parsed);
  };

  const toyList = callbackData.toyList;
  if (Array.isArray(toyList)) {
    for (const toy of toyList) {
      const rec = toy as Record<string, unknown>;
      const key = String(rec.id ?? rec.uid ?? "").trim() || `toy-${out.length}`;
      pushRecord(key, rec);
    }
  }

  const toys = callbackData.toys;
  if (Array.isArray(toys)) {
    for (const toy of toys) {
      const rec = toy as Record<string, unknown>;
      const key = String(rec.id ?? rec.uid ?? "").trim() || `toy-${out.length}`;
      pushRecord(key, rec);
    }
  } else if (toys && typeof toys === "object") {
    for (const [mapKey, toy] of Object.entries(toys as Record<string, unknown>)) {
      pushRecord(mapKey, toy);
    }
  }

  const single = callbackData.toy;
  if (single && typeof single === "object" && !Array.isArray(single)) {
    const rec = single as Record<string, unknown>;
    const key = String(rec.id ?? rec.uid ?? "toy-0").trim();
    pushRecord(key, rec);
  }

  return out;
}

/** Parse getToys cloud response — toys may be a JSON string or object map. */
export function extractToysFromGetToysResponse(raw: unknown): ParsedLovenseToy[] {
  if (!raw || typeof raw !== "object") return [];
  const root = raw as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  let toysRaw = data.toys;
  if (typeof toysRaw === "string" && toysRaw.trim()) {
    try {
      toysRaw = JSON.parse(toysRaw) as unknown;
    } catch {
      return [];
    }
  }
  if (!toysRaw || typeof toysRaw !== "object") return [];
  return extractToysFromCallback({ toys: toysRaw });
}

/** Reject storing the Lovense *user* uid as a toy device id. */
export function isLikelyUserUidNotToyId(deviceUid: string, userId: string): boolean {
  const d = deviceUid.trim();
  const u = userId.trim();
  if (!d || !u) return false;
  if (d === u) return true;
  // Legacy bad rows from callback fallback stored auth uuid with dashes
  if (d.length === 36 && u.length === 36 && d === u) return true;
  return false;
}
