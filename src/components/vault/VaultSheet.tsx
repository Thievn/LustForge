import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { VaultArt, VaultFrame } from "@/components/vault/TreasureCard";
import { RARITY_TONE } from "@/lib/vault/art";
import { vaultCall } from "@/lib/vault/looks";
import { VAULT_CATEGORIES, type VaultCategory, type VaultRarity } from "@/lib/vault/treasures";

type Her = { id: string; name: string };

export function VaultSheet({
  itemId,
  name,
  rarity,
  kind,
  blurb,
  owned,
  imageUrl,
  companions,
  preview,
  onClose,
}: {
  itemId: string;
  name: string;
  rarity: VaultRarity;
  kind: VaultCategory;
  blurb: string;
  owned: boolean;
  imageUrl: string;
  companions: Her[];
  preview: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const tone = RARITY_TONE[rarity];
  const category = VAULT_CATEGORIES.find((row) => row.id === kind)?.label ?? kind;
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const query = preview ? "?preview=1" : "";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function styleHer(companionId: string) {
    if (!companionId) return;
    if (!preview) {
      setBusy(true);
      const res = await vaultCall({ action: "wear", companionId, itemId });
      setBusy(false);
      if (res.error) {
        setNotice(res.error);
        return;
      }
    }
    const next = new URLSearchParams();
    if (preview) next.set("preview", "1");
    next.set("tab", "style");
    navigate(`/companions/${companionId}/bond?${next.toString()}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 sm:items-center" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-sheet-title"
        className="w-full max-w-[360px] rounded-t-2xl border border-white/10 bg-[#10090e] px-3.5 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:rounded-2xl sm:pb-3.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Treasure</p>
          <button type="button" className="grid h-7 w-7 place-items-center rounded-full text-white/70 hover:bg-white/5" onClick={onClose} aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mx-auto w-[168px]">
          <VaultFrame rarity={rarity} owned={owned}>
            <VaultArt src={imageUrl} locked={!owned} rarity={rarity} eager frost="sheet" />
          </VaultFrame>
        </div>
        <h2 id="vault-sheet-title" className="mt-2.5 text-center font-gothic text-lg leading-tight text-white">{name}</h2>
        <p className="mt-1 truncate text-center text-[12px] text-white/65">{blurb}</p>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className="rounded-full px-2 py-0.5 text-[10px] tracking-wide" style={{ color: tone.border, backgroundColor: tone.tint }}>{tone.label}</span>
          <span className="text-[10px] text-white/45">{category}</span>
        </div>
        {owned && companions.length === 0 ? (
          <Link to={`/companions${query}`} className="mt-3 flex h-8 items-center justify-center rounded-full border border-white/15 text-xs text-primary">
            Style Her with this
          </Link>
        ) : null}
        {owned && companions.length === 1 ? (
          <button type="button" disabled={busy} className="mt-3 h-8 w-full rounded-full border border-white/15 text-xs text-primary disabled:opacity-50" onClick={() => void styleHer(companions[0]!.id)}>
            Style Her with this
          </button>
        ) : null}
        {owned && companions.length > 1 ? (
          <div className="mt-3">
            <button type="button" disabled={busy} className="h-8 w-full rounded-full border border-white/15 text-xs text-primary disabled:opacity-50" onClick={() => setPicking((open) => !open)} aria-expanded={picking}>
              Style Her with this
            </button>
            {picking ? (
              <ul className="mt-1 max-h-28 overflow-y-auto">
                {companions.map((her) => (
                  <li key={her.id}>
                    <button type="button" disabled={busy} className="flex h-8 w-full items-center px-2 text-left text-xs text-white/80 hover:text-white" onClick={() => void styleHer(her.id)}>
                      {her.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {notice ? <p className="mt-2 text-center text-[11px] text-white/80" role="status">{notice}</p> : null}
      </div>
    </div>
  );
}
