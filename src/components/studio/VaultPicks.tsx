import { useEffect, useMemo, useState } from "react";
import { VaultArt } from "@/components/vault/TreasureCard";
import { vaultCall } from "@/lib/vault/looks";
import { vaultImageUrl, vaultThumbUrl } from "@/lib/vault/art";
import type { TreasureSlot, VaultCategory, VaultRarity } from "@/lib/vault/treasures";

const SLOTS: Array<{ id: TreasureSlot; label: string }> = [
  { id: "outfit", label: "Outfit" },
  { id: "accessory", label: "Accessory" },
  { id: "scene", label: "Scene" },
  { id: "pose", label: "Pose" },
  { id: "hair", label: "Hair" },
  { id: "mood", label: "Mood" },
];

export type VaultPick = {
  id: string;
  name: string;
  slot: TreasureSlot;
  kind: VaultCategory;
  rarity: VaultRarity;
  poseId?: string | null;
  imageUrl?: string | null;
  thumbUrl?: string | null;
};

type Piece = VaultPick & { owned: boolean };

export function VaultPicks({
  picks,
  onChange,
}: {
  picks: Partial<Record<TreasureSlot, string>>;
  onChange: (next: Partial<Record<TreasureSlot, string>>, pieces: VaultPick[]) => void;
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [slot, setSlot] = useState<TreasureSlot>("outfit");

  useEffect(() => {
    let cancel = false;
    void vaultCall({ action: "quote" }).then((res) => {
      if (cancel || res.error || !Array.isArray(res.data?.items)) return;
      const next = (res.data.items as Array<Record<string, unknown>>)
        .filter((item) => item.slot !== "vibration")
        .map((item) => {
          const id = String(item.id);
          return {
            id,
            name: String(item.name ?? ""),
            slot: String(item.slot ?? "outfit") as TreasureSlot,
            kind: String(item.kind ?? "lingerie") as VaultCategory,
            rarity: String(item.rarity ?? "silk") as VaultRarity,
            poseId: item.poseId ? String(item.poseId) : null,
            imageUrl: typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : vaultImageUrl(id),
            thumbUrl: typeof item.thumbUrl === "string" && item.thumbUrl ? item.thumbUrl : vaultThumbUrl(id),
            owned: Boolean(item.owned),
          };
        });
      setPieces(next);
    });
    return () => {
      cancel = true;
    };
  }, []);

  const owned = useMemo(() => pieces.filter((item) => item.owned && item.slot === slot), [pieces, slot]);
  const chosen = pieces.filter((item) => item.owned && picks[item.slot] === item.id);

  function toggle(item: Piece) {
    const next = { ...picks };
    if (next[item.slot] === item.id) delete next[item.slot];
    else next[item.slot] = item.id;
    const selected = pieces.filter((piece) => piece.owned && next[piece.slot] === piece.id);
    onChange(next, selected);
  }

  if (!pieces.some((item) => item.owned)) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>From her vault</span>
        <span>{chosen.length ? chosen.map((item) => item.name).join(" · ") : "Nothing chosen"}</span>
      </div>
      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        {SLOTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSlot(item.id)}
            className={`h-8 shrink-0 rounded-full border px-3 text-[11px] ${slot === item.id || picks[item.id] ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {owned.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {owned.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item)}
              className={`w-16 shrink-0 overflow-hidden rounded-xl border text-left ${picks[slot] === item.id ? "border-primary shadow-[0_0_16px_hsl(var(--primary)/0.35)]" : "border-white/10"}`}
            >
              <VaultArt src={item.thumbUrl || item.imageUrl || ""} rarity={item.rarity} kind={item.kind} poseId={item.poseId} alt="" />
              <p className="truncate px-1 py-1 text-[10px] leading-tight">{item.name}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nothing unlocked in this slot yet.</p>
      )}
    </div>
  );
}
