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
  poseId,
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
  poseId?: string | null;
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
    navigate(`/companions/${companionId}${query}`);
    onClose();
  }

  const vibration = kind === "vibration";
  const actionLabel = vibration ? "Apply to companion" : companions.length === 1 ? `Equip on ${companions[0]!.name}` : "Equip";

  async function apply(companionId: string) {
    if (vibration) {
      if (!preview) {
        setBusy(true);
        const res = await vaultCall({ action: "wear", companionId, itemId });
        setBusy(false);
        if (res.error) {
          setNotice(res.error);
          return;
        }
      }
      const her = companions.find((row) => row.id === companionId);
      setNotice(her ? `Applied to ${her.name}. It is ready in chat and on a call.` : "Applied.");
      setPicking(false);
      return;
    }
    await styleHer(companionId);
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[rgba(15,10,18,0.55)] p-5 backdrop-blur-[14px]" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-sheet-title"
        className="flex max-h-[calc(100vh-40px)] w-full max-w-[440px] flex-col overflow-auto rounded-[20px] bg-[#EADFD6] text-[#2A2030] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end px-4 pt-4">
          <button type="button" className="grid h-12 w-12 place-items-center rounded-[14px] bg-[rgba(42,32,48,0.08)] text-[#2A2030]" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-2">
          <div className="mx-auto w-[min(100%,280px)]">
            <VaultFrame rarity={rarity} owned={owned}>
              <VaultArt src={imageUrl} locked={!owned} rarity={rarity} eager frost="sheet" kind={kind} poseId={poseId} />
            </VaultFrame>
          </div>
        </div>
        <div className="flex flex-col gap-4 px-7 pb-7 pt-4">
          <span className="inline-flex w-fit items-center rounded-full bg-[#2A2030] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.06em] text-[#D4AF37]">{tone.label}</span>
          <h2 id="vault-sheet-title" className="text-[26px] font-semibold leading-tight text-[#2A2030]">{name}</h2>
          <p className="text-[15px] leading-relaxed text-[#665670]">{blurb.trim() || `${tone.label} · ${category}`}</p>
          <p className="text-sm text-[#665670]">{category}{owned ? "" : " · locked. Roll to unlock it."}</p>
          {owned && companions.length === 0 ? (
            <Link to={`/companions${query}`} className="inline-flex h-12 items-center justify-center rounded-[14px] bg-[#D6336C] text-[15px] font-semibold text-white">
              {actionLabel}
            </Link>
          ) : null}
          {owned && companions.length === 1 ? (
            <button type="button" disabled={busy} className="h-12 w-full rounded-[14px] bg-[#D6336C] text-[15px] font-semibold text-white disabled:opacity-50" onClick={() => void apply(companions[0]!.id)}>
              {actionLabel}
            </button>
          ) : null}
          {owned && companions.length > 1 ? (
            <div>
              <button type="button" disabled={busy} className="h-12 w-full rounded-[14px] bg-[#D6336C] text-[15px] font-semibold text-white disabled:opacity-50" onClick={() => setPicking((open) => !open)} aria-expanded={picking}>
                {actionLabel}
              </button>
              {picking ? (
                <ul className="mt-2 max-h-40 overflow-y-auto rounded-[14px] border border-[rgba(42,32,48,0.12)]">
                  {companions.map((her) => (
                    <li key={her.id}>
                      <button type="button" disabled={busy} className="flex h-12 w-full items-center px-4 text-left text-[15px] font-medium text-[#2A2030] hover:bg-black/5" onClick={() => void apply(her.id)}>
                        {her.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {notice ? <p className="text-center text-sm text-[#2A2030]" role="status">{notice}</p> : null}
        </div>
      </div>
    </div>
  );
}
