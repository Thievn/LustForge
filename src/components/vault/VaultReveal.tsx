import { useEffect, useState, type CSSProperties } from "react";
import { Lock } from "lucide-react";
import { RARITY_TONE } from "@/lib/vault/art";
import { VaultFrame } from "@/components/vault/TreasureCard";
import type { VaultRarity } from "@/lib/vault/treasures";

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
  onDone,
}: {
  name: string;
  rarity: VaultRarity;
  blurb: string;
  imageUrl: string;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const tone = RARITY_TONE[rarity];
  const play = !reduced;
  const style = { "--vault-light": tone.light, "--vault-glow": tone.glow } as CSSProperties;
  const glow = rarity === "obsession" || rarity === "forbidden" ? "h-80 w-80" : rarity === "velvet" ? "h-72 w-72" : "h-64 w-64";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/78 px-4" role="dialog" aria-modal="true" aria-label={`${tone.label}. ${name}`} onClick={onDone}>
      <div className={`relative grid place-items-center ${play ? "vault-reveal-play" : ""}`} style={style} onClick={(event) => event.stopPropagation()}>
          <div className={`pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 ${glow}`} aria-hidden>
            <div className="vault-reveal-light h-full w-full" />
          </div>
          <div className="vault-reveal-card relative w-[min(100%,200px)]">
            <VaultFrame rarity={rarity} owned>
              <div className="relative aspect-[3/4] overflow-hidden bg-[#14090f]">
                <img src={imageUrl} alt="" width={512} height={683} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                {rarity === "obsession" ? <span className="vault-sheen pointer-events-none absolute inset-0" aria-hidden /> : null}
                {play ? (
                  <>
                    <img src={imageUrl} alt="" width={512} height={683} className="vault-frost absolute inset-0 h-full w-full scale-110 object-cover blur-[10px] brightness-[0.35]" aria-hidden />
                    <div className="vault-frost absolute inset-0" style={{ backgroundColor: tone.tint }} aria-hidden />
                    <div className="vault-frost pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" aria-hidden />
                    <Lock className="vault-frost absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white/90" strokeWidth={1.75} aria-hidden />
                  </>
                ) : null}
              </div>
            </VaultFrame>
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.16em]" style={{ color: tone.border }}>{tone.label}</p>
            <h2 className="mt-0.5 text-center font-gothic text-lg leading-tight text-white">{name}</h2>
            <p className="mt-1 line-clamp-2 text-center text-[12px] leading-snug text-white/70">{blurb}</p>
            <button type="button" className="mt-3 h-8 w-full rounded-full bg-primary text-xs font-medium text-primary-foreground" onClick={onDone}>
              Keep
            </button>
          </div>
      </div>
    </div>
  );
}
