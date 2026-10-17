import { describe, expect, it } from "vitest";
import { assertOwnedCompanion, ownsCompanion } from "../../supabase/functions/_shared/ownedCompanion";

const UUID = "11111111-1111-4111-8111-111111111111";

function svc(tables: Record<string, { data: unknown; error: { message: string } | null }>) {
  return {
    from(table: string) {
      const result = tables[table] ?? { data: null, error: { message: "missing" } };
      const builder = {
        select: () => builder,
        eq: () => builder,
        limit: () => builder,
        maybeSingle: () => Promise.resolve(result),
        then: (resolve: (value: typeof result) => unknown) => Promise.resolve(resolve(result)),
      };
      return builder;
    },
  };
}

describe("ownsCompanion", () => {
  it("allows a blank target, an owned forge companion, and a pinned or purchased stock companion", () => {
    expect(ownsCompanion({ companionId: null, customOwned: false, pinned: false, purchased: false })).toBe(true);
    expect(ownsCompanion({ companionId: `cc-${UUID}`, customOwned: true, pinned: false, purchased: false })).toBe(true);
    expect(ownsCompanion({ companionId: `cc-${UUID}`, customOwned: false, pinned: true, purchased: true })).toBe(false);
    expect(ownsCompanion({ companionId: "lilith-vesper", customOwned: false, pinned: true, purchased: false })).toBe(true);
    expect(ownsCompanion({ companionId: "lilith-vesper", customOwned: true, pinned: false, purchased: true })).toBe(true);
    expect(ownsCompanion({ companionId: "lilith-vesper", customOwned: true, pinned: false, purchased: false })).toBe(false);
  });
});

describe("assertOwnedCompanion", () => {
  it("rejects a companion the caller does not own, and fails closed when the lookup errors", async () => {
    const owned = await assertOwnedCompanion(
      svc({
        custom_characters: { data: { id: UUID }, error: null },
        user_discover_pins: { data: [], error: null },
        user_transactions: { data: [], error: null },
      }),
      "user-1",
      `cc-${UUID}`,
    );
    expect(owned.ok).toBe(true);

    const stranger = await assertOwnedCompanion(
      svc({ custom_characters: { data: null, error: null } }),
      "user-1",
      `cc-${UUID}`,
    );
    expect(stranger).toMatchObject({ ok: false, code: "OWN_COMPANION", status: 403 });

    const bought = await assertOwnedCompanion(
      svc({
        user_discover_pins: { data: [], error: null },
        user_transactions: { data: [{ metadata: { companion_id: "lilith-vesper" } }], error: null },
      }),
      "user-1",
      "lilith-vesper",
    );
    expect(bought.ok).toBe(true);

    const locked = await assertOwnedCompanion(
      svc({
        user_discover_pins: { data: [], error: null },
        user_transactions: { data: [{ metadata: { companion_id: "someone-else" } }], error: null },
      }),
      "user-1",
      "lilith-vesper",
    );
    expect(locked.ok).toBe(false);

    const broken = await assertOwnedCompanion(
      svc({
        user_discover_pins: { data: null, error: { message: "permission" } },
        user_transactions: { data: [], error: null },
      }),
      "user-1",
      "lilith-vesper",
    );
    expect(broken.ok).toBe(false);

    const open = await assertOwnedCompanion(svc({}), "user-1", null);
    expect(open.ok).toBe(true);
  });
});
