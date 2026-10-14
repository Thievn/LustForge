import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { RARITY_TONE, rarityBreathes, rarityShimmers } from "@/lib/vault/art";
import type { VaultCategory, VaultRarity } from "@/lib/vault/treasures";

const RARITY_COLOR: Record<VaultRarity, { label: string; from: string; to: string; glow: string; ink: string }> = {
  silk: { label: "Silk", from: "#ffd0e4", to: "#f4a7c5", glow: "rgba(255, 182, 213, 0.62)", ink: "#4a1830" },
  satin: { label: "Satin", from: "#ddd6fe", to: "#7c3aed", glow: "rgba(139, 92, 246, 0.7)", ink: "#1e1033" },
  velvet: { label: "Velvet", from: "#fb7185", to: "#7f1d1d", glow: "rgba(159, 18, 57, 0.8)", ink: "#fff5f5" },
  forbidden: { label: "Forbidden", from: "#fde68a", to: "#b45309", glow: "rgba(250, 204, 21, 0.92)", ink: "#2a1604" },
  obsession: { label: "Obsession", from: "#f8fafc", to: "#0a0a0a", glow: "rgba(255, 45, 123, 0.85)", ink: "#f8f4ff" },
};

function artShape(kind: VaultCategory): "lace" | "swim" | "jewel" | "place" | "pose" | "hair" {
  if (kind === "swim") return "swim";
  if (kind === "night" || kind === "costume" || kind === "lingerie") return "lace";
  if (kind === "accessory" || kind === "hair") return kind === "hair" ? "hair" : "jewel";
  if (kind === "pose") return "pose";
  return "place";
}

/** Flat fallback used outside the vault grid. The vault itself uses photographed cards. */
export function TreasureArt({ kind, rarity, hidden }: { kind: VaultCategory; rarity: VaultRarity; hidden?: boolean }) {
  const tone = RARITY_COLOR[rarity];
  const grad = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 160 200" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone.from} />
          <stop offset="1" stopColor={tone.to} />
        </linearGradient>
      </defs>
      <rect width="160" height="200" fill="#140910" />
      <rect x="8" y="8" width="144" height="184" rx="18" fill={hidden ? "#1a1020" : `url(#${grad})`} opacity="0.95" />
      {!hidden && artShape(kind) === "lace" ? (
        <>
          <path d="M80 48c18 0 28 16 28 32 0 28-28 48-28 48S52 108 52 80c0-16 10-32 28-32z" fill={tone.ink} opacity="0.85" />
          <path d="M62 150h36l8 22H54z" fill={tone.ink} opacity="0.75" />
          <path d="M58 78h44M70 92h20" stroke="#140910" strokeWidth="2" opacity="0.35" />
        </>
      ) : null}
      {!hidden && artShape(kind) === "swim" ? (
        <>
          <path d="M48 70h64l-8 28H56z" fill={tone.ink} opacity="0.8" />
          <path d="M58 118h44l6 36H52z" fill={tone.ink} opacity="0.72" />
          <path d="M20 150c30 16 90 16 120 0" fill="none" stroke={tone.ink} strokeWidth="3" opacity="0.45" />
        </>
      ) : null}
      {!hidden && artShape(kind) === "jewel" ? (
        <>
          <circle cx="80" cy="78" r="22" fill="none" stroke={tone.ink} strokeWidth="6" />
          <circle cx="80" cy="132" r="10" fill={tone.ink} />
          <path d="M80 100v22" stroke={tone.ink} strokeWidth="3" />
        </>
      ) : null}
      {!hidden && artShape(kind) === "place" ? (
        <>
          <path d="M28 140 L80 58 L132 140 Z" fill={tone.ink} opacity="0.8" />
          <rect x="68" y="112" width="24" height="28" fill="#140910" opacity="0.45" />
          <circle cx="118" cy="48" r="10" fill={tone.ink} opacity="0.7" />
        </>
      ) : null}
      {!hidden && artShape(kind) === "hair" ? (
        <>
          <circle cx="80" cy="78" r="18" fill={tone.ink} />
          <path d="M52 78c4-28 52-28 56 0 2 30-10 48-28 62-18-14-30-32-28-62z" fill={tone.ink} opacity="0.8" />
        </>
      ) : null}
      {!hidden && artShape(kind) === "pose" ? (
        <>
          <circle cx="80" cy="58" r="12" fill={tone.ink} />
          <path d="M80 72 v46 M80 92 l-26 22 M80 92 l28 18 M80 118 l-16 40 M80 118 l18 40" stroke={tone.ink} strokeWidth="6" strokeLinecap="round" fill="none" />
        </>
      ) : null}
    </svg>
  );
}

export function VaultArt({
  src,
  locked,
  rarity,
  eager,
  alt = "",
}: {
  src: string;
  locked?: boolean;
  rarity: VaultRarity;
  eager?: boolean;
  alt?: string;
}) {
  const tone = RARITY_TONE[rarity];
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[3/4] overflow-hidden bg-[#14090f]">
      {failed ? null : (
        <img
          src={src}
          alt={alt}
          width={eager ? 512 : 256}
          height={eager ? 683 : 341}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("absolute inset-0 h-full w-full object-cover", locked && "scale-110 blur-[10px] brightness-[0.35]")}
        />
      )}
      {locked ? (
        <>
          <div className="absolute inset-0" style={{ backgroundColor: tone.tint }} aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent" aria-hidden />
          <Lock className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white/90" strokeWidth={1.75} aria-hidden />
        </>
      ) : null}
    </div>
  );
}

export function VaultFrame({
  rarity,
  owned,
  children,
  className,
}: {
  rarity: VaultRarity;
  owned?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const tone = RARITY_TONE[rarity];
  const breathe = rarityBreathes(rarity, Boolean(owned));
  const style = { "--vault-glow": tone.glow } as CSSProperties;
  if (rarity === "obsession") {
    return (
      <div className={cn("vault-obsession-frame rounded-[10px] p-[1.5px]", breathe && "vault-breathe", className)} style={style}>
        <div className="overflow-hidden rounded-[8.5px] bg-[#120910]">{children}</div>
      </div>
    );
  }
  return (
    <div className={cn("rounded-[10px] border-[1.5px]", breathe && "vault-breathe", className)} style={{ ...style, borderColor: tone.border }}>
      <div className="overflow-hidden rounded-[8.5px]">{children}</div>
    </div>
  );
}

export function TreasureCard({
  name,
  rarity,
  owned,
  thumbUrl,
  isNew,
  onClick,
}: {
  name: string;
  rarity: VaultRarity;
  owned?: boolean;
  thumbUrl: string;
  isNew?: boolean;
  onClick?: () => void;
}) {
  const shimmer = rarityShimmers(rarity, Boolean(owned));
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
      aria-label={owned ? name : `${name}, locked`}
    >
      <VaultFrame rarity={rarity} owned={owned}>
        <div className="relative">
          <VaultArt src={thumbUrl} locked={!owned} rarity={rarity} />
          {shimmer ? <span className="vault-sheen pointer-events-none absolute inset-0" aria-hidden /> : null}
          {isNew ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> : null}
        </div>
      </VaultFrame>
      <p className="mt-1 line-clamp-2 h-[2.35em] text-[10px] leading-[1.15] text-foreground/75">{name}</p>
    </button>
  );
}
