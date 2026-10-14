import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { RARITY_TONE, vaultFrostClass } from "@/lib/vault/art";
import { TreasureArt, VaultFrame, VaultFrostVeil } from "@/components/vault/TreasureCard";
import type { VaultCategory, VaultRarity } from "@/lib/vault/treasures";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function VaultReveal({
  name,
  rarity,
  blurb,
  imageUrl,
  kind = "lingerie",
  poseId,
  onDone,
}: {
  name: string;
  rarity: VaultRarity;
  blurb: string;
  imageUrl: string;
  kind?: VaultCategory;
  poseId?: string | null;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const tone = RARITY_TONE[rarity];
  const play = !reduced;
  const [artFailed, setArtFailed] = useState(false);
  const style = { "--vault-light": tone.light, "--vault-glow": tone.glow } as CSSProperties;
  const glow = rarity === "obsession" || rarity === "forbidden" ? "h-80 w-80" : rarity === "velvet" ? "h-72 w-72" : "h-64 w-64";
  const line = blurb.trim() || `${tone.label} · ${name}`;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/78 px-4" role="dialog" aria-modal="true" aria-label={`${tone.label}. ${name}`} onClick={onDone}>
      <div className={`relative grid place-items-center ${play ? "vault-reveal-play" : ""}`} style={style} onClick={(event) => event.stopPropagation()}>
        <div className={`pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 ${glow}`} aria-hidden>
          <div className="vault-reveal-light h-full w-full" />
        </div>
        <div className="vault-reveal-card relative w-[min(100%,200px)]">
          <VaultFrame rarity={rarity} owned>
            <div className="relative aspect-[3/4] overflow-hidden bg-[#14090f]">
              {artFailed || !imageUrl ? (
                <TreasureArt kind={kind} rarity={rarity} poseId={poseId} />
              ) : (
                <img src={imageUrl} alt="" width={512} height={683} decoding="async" className="absolute inset-0 h-full w-full object-cover" onError={() => setArtFailed(true)} />
              )}
              {rarity === "obsession" && !artFailed ? <span className="vault-sheen pointer-events-none absolute inset-0" aria-hidden /> : null}
              {play && !artFailed && imageUrl ? (
                <>
                  <img src={imageUrl} alt="" width={512} height={683} className={cn("vault-frost absolute inset-0 h-full w-full object-cover", vaultFrostClass("card"))} aria-hidden />
                  <VaultFrostVeil rarity={rarity} className="vault-frost" />
                </>
              ) : null}
            </div>
          </VaultFrame>
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: tone.border }}>{tone.label}</p>
          <h2 className="mt-0.5 text-center font-gothic text-lg leading-tight text-white">{name}</h2>
          <p className="mt-1 line-clamp-2 text-center text-[12px] leading-snug text-white/70">{line}</p>
          <button type="button" className="mt-3 h-8 w-full rounded-full bg-primary text-xs font-medium text-primary-foreground" onClick={onDone}>
            Keep
          </button>
        </div>
      </div>
    </div>
  );
}
