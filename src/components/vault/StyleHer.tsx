import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TreasureArt } from "@/components/vault/TreasureCard";
import { TREASURES, type TreasureSlot, type VaultCategory, type VaultRarity } from "@/lib/vault/treasures";
import { loadCompanionLooks, lookSlotId, vaultCall, type LookRow, type VaultPiece } from "@/lib/vault/looks";

const SLOTS: Array<{ id: TreasureSlot; label: string }> = [
  { id: "outfit", label: "Outfit" },
  { id: "accessory", label: "Accessory" },
  { id: "pose", label: "Pose" },
  { id: "scene", label: "Scene" },
  { id: "hair", label: "Hair" },
  { id: "mood", label: "Mood" },
];

function seedPieces(): VaultPiece[] {
  return TREASURES.map((item) => ({
    id: item.id,
    name: item.name,
    slot: item.slot,
    kind: item.kind,
    rarity: item.rarity,
    blurb: item.blurb,
    owned: false,
    isNew: item.isNew,
    poseId: item.poseId ?? null,
  }));
}

export function StyleHer({
  companionId,
  userId,
  preview,
  name,
}: {
  companionId: string;
  userId: string | null;
  preview: boolean;
  name: string;
}) {
  const [pieces, setPieces] = useState<VaultPiece[]>(() => seedPieces());
  const [looks, setLooks] = useState<LookRow[]>([]);
  const [slot, setSlot] = useState<TreasureSlot>("outfit");
  const [picks, setPicks] = useState<Partial<Record<TreasureSlot, string>>>({});
  const [lookName, setLookName] = useState("");
  const [makeDefault, setMakeDefault] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const q = preview ? "?preview=1" : "";

  useEffect(() => {
    let cancel = false;
    void vaultCall({ action: "quote" }).then((res) => {
      if (cancel || res.error || !Array.isArray(res.data?.items)) return;
      const next = (res.data.items as Array<Record<string, unknown>>).map((item) => ({
        id: String(item.id),
        name: String(item.name ?? ""),
        slot: String(item.slot ?? "outfit") as TreasureSlot,
        kind: String(item.kind ?? "lingerie"),
        rarity: String(item.rarity ?? "silk"),
        blurb: String(item.blurb ?? ""),
        owned: Boolean(item.owned),
        isNew: Boolean(item.isNew),
        poseId: item.poseId ? String(item.poseId) : null,
      }));
      if (next.length) setPieces(next);
    });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!userId || !companionId) return;
    void loadCompanionLooks(userId, companionId).then((rows) => {
      setLooks(rows);
      const current = rows.find((row) => row.is_default) ?? rows[0];
      if (!current) return;
      const next: Partial<Record<TreasureSlot, string>> = {};
      for (const item of SLOTS) {
        const id = lookSlotId(current, item.id);
        if (id) next[item.id] = id;
      }
      setPicks(next);
    });
  }, [userId, companionId]);

  const inSlot = useMemo(() => pieces.filter((item) => item.slot === slot), [pieces, slot]);
  const owned = inSlot.filter((item) => item.owned);
  const locked = inSlot.length - owned.length;

  async function wear(item: VaultPiece) {
    if (!userId) {
      setNotice("Sign in to dress her.");
      return;
    }
    setBusy(true);
    const res = await vaultCall({ action: "wear", companionId, itemId: item.id });
    setBusy(false);
    if (res.error) {
      setNotice(res.error);
      return;
    }
    setPicks((current) => ({ ...current, [item.slot]: item.id }));
    setNotice(`${name} is wearing ${item.name}.`);
    const rows = await loadCompanionLooks(userId, companionId);
    setLooks(rows);
  }

  async function saveLook() {
    if (!userId) {
      setNotice("Sign in to keep a look.");
      return;
    }
    const nameValue = lookName.trim();
    if (!nameValue) {
      setNotice("Name this look.");
      return;
    }
    setBusy(true);
    const res = await vaultCall({
      action: "saveLook",
      companionId,
      name: nameValue,
      isDefault: makeDefault,
      outfitId: picks.outfit ?? null,
      accessoryId: picks.accessory ?? null,
      sceneId: picks.scene ?? null,
      poseId: picks.pose ?? null,
      hairId: picks.hair ?? null,
      moodId: picks.mood ?? null,
    });
    setBusy(false);
    if (res.error) {
      setNotice(res.error);
      return;
    }
    setLookName("");
    setNotice(makeDefault ? `${nameValue} is her default look.` : `Saved ${nameValue}.`);
    setLooks(await loadCompanionLooks(userId, companionId));
  }

  async function useLook(look: LookRow) {
    if (!userId) return;
    setBusy(true);
    const res = await vaultCall({ action: "applyLook", companionId, lookId: look.id });
    setBusy(false);
    if (res.error) {
      setNotice(res.error);
      return;
    }
    const next: Partial<Record<TreasureSlot, string>> = {};
    for (const item of SLOTS) {
      const id = lookSlotId(look, item.id);
      if (id) next[item.id] = id;
    }
    setPicks(next);
    setLooks((current) => current.map((row) => ({ ...row, is_default: row.id === look.id })));
    setNotice(`${name} is in ${look.name}.`);
  }

  return (
    <section className="mt-6 space-y-4">
      <div>
        <h2 className="font-gothic text-3xl">Style her</h2>
        <p className="text-sm text-muted-foreground">One piece per slot. What she does not own yet stays in the Vault.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {SLOTS.map((item) => {
          const picked = pieces.find((piece) => piece.id === picks[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSlot(item.id)}
              className={`h-16 min-w-[7.5rem] shrink-0 rounded-2xl border px-3 text-left ${slot === item.id ? "border-primary bg-primary/15" : "border-white/10"}`}
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-primary">{item.label}</p>
              <p className="truncate text-sm">{picked?.name ?? "Empty"}</p>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {owned.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => void wear(item)}
            className={`overflow-hidden rounded-2xl border text-left ${picks[slot] === item.id ? "border-primary shadow-[0_0_18px_hsl(var(--primary)/0.35)]" : "border-white/10"} ${item.rarity === "forbidden" ? "forbidden-card" : ""} ${item.rarity === "obsession" ? "obsession-card" : ""}`}
          >
            <div className="aspect-[3/4] bg-black">
              <TreasureArt kind={item.kind as VaultCategory} rarity={item.rarity as VaultRarity} poseId={item.poseId} />
            </div>
            <p className="px-2 py-2 text-xs leading-tight">{item.name}</p>
          </button>
        ))}
        {locked > 0 ? (
          <Link to={`/treasures${q}`} className="overflow-hidden rounded-2xl border border-white/10 text-left">
            <div className="aspect-[3/4]">
              <TreasureArt kind={(owned[0]?.kind as VaultCategory) ?? "lingerie"} rarity="silk" hidden />
            </div>
            <p className="px-2 py-2 text-xs text-primary">Find in the Vault</p>
          </Link>
        ) : null}
      </div>
      {!owned.length ? <p className="text-sm text-muted-foreground">Nothing owned in this slot yet.</p> : null}
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1 text-xs text-muted-foreground">
          Look name
          <input value={lookName} onChange={(event) => setLookName(event.target.value)} placeholder="After midnight" className="mt-1 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm text-foreground" />
        </label>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={makeDefault} onChange={(event) => setMakeDefault(event.target.checked)} />
          Default
        </label>
        <button type="button" disabled={busy} onClick={() => void saveLook()} className="h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">Save look</button>
      </div>
      {looks.length ? (
        <ul className="space-y-2">
          {looks.map((look) => (
            <li key={look.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-3 py-2">
              <div>
                <p className="text-sm">{look.name}</p>
                {look.is_default ? <p className="text-[10px] uppercase tracking-[0.16em] text-primary">Default</p> : null}
              </div>
              <button type="button" disabled={busy} className="h-10 rounded-xl border border-border px-3 text-xs" onClick={() => void useLook(look)}>Wear this look</button>
            </li>
          ))}
        </ul>
      ) : null}
      {notice ? <p className="text-sm" role="status">{notice}</p> : null}
    </section>
  );
}
