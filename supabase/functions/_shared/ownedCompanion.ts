/** Edits may target only a companion this user owns. Catalog access does not widen that. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function customCompanionUuid(companionId: string | null | undefined): string | null {
  const value = String(companionId ?? "").trim();
  if (!value.startsWith("cc-")) return null;
  const uuid = value.slice(3);
  return UUID.test(uuid) ? uuid : null;
}

export function ownsCompanion(input: {
  companionId: string | null | undefined;
  customOwned: boolean;
  pinned: boolean;
  purchased: boolean;
}): boolean {
  const id = String(input.companionId ?? "").trim();
  if (!id) return true;
  if (id.startsWith("cc-")) return input.customOwned;
  return input.pinned || input.purchased;
}

type RowError = { message?: string } | null;
type RowResult = { data: unknown; error: RowError };

type Builder = PromiseLike<RowResult> & {
  select: (columns?: string) => Builder;
  eq: (column: string, value: string) => Builder;
  limit: (count: number) => Builder;
  maybeSingle: () => Promise<RowResult>;
};

type Svc = {
  from: (table: string) => Builder;
};

function failed(message: string) {
  return { ok: false as const, error: message, code: "OWN_COMPANION" as const, status: 403 as const };
}

export async function assertOwnedCompanion(
  svc: Svc,
  userId: string,
  companionId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string; code: "OWN_COMPANION"; status: 403 }> {
  const id = String(companionId ?? "").trim();
  if (!id) return { ok: true };
  try {
    const uuid = customCompanionUuid(id);
    if (id.startsWith("cc-")) {
      if (!uuid) return failed("That companion isn't yours.");
      const row = await svc.from("custom_characters").select("id").eq("id", uuid).eq("user_id", userId).maybeSingle();
      if (row.error || !row.data) return failed("That companion isn't yours.");
      return { ok: true };
    }
    const pins = await svc.from("user_discover_pins").select("companion_id").eq("user_id", userId).eq("companion_id", id).limit(1);
    const tx = await svc
      .from("user_transactions")
      .select("metadata")
      .eq("user_id", userId)
      .eq("transaction_type", "card_purchase")
      .limit(400);
    if (pins.error || tx.error) return failed("That companion isn't yours.");
    const pinned = Array.isArray(pins.data) && pins.data.length > 0;
    const purchased = Array.isArray(tx.data) && tx.data.some((row) => {
      const meta = (row as { metadata?: { companion_id?: unknown } | null }).metadata;
      return meta?.companion_id === id;
    });
    if (!ownsCompanion({ companionId: id, customOwned: false, pinned, purchased })) {
      return failed("That companion isn't yours.");
    }
    return { ok: true };
  } catch {
    return failed("That companion isn't yours.");
  }
}
