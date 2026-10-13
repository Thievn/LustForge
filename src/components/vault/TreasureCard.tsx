import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { VaultCategory, VaultRarity } from "@/lib/vault/treasures";

export const RARITY_COLOR: Record<VaultRarity, { label: string; from: string; to: string; glow: string; ink: string }> = {
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
      {hidden ? <text x="80" y="112" textAnchor="middle" fontSize="42" fill="#f4e9f2">?</text> : null}
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

export function TreasureCard({
  name,
  kind,
  rarity,
  blurb,
  owned,
  percent,
  isNew,
  onClick,
}: {
  name: string;
  kind: VaultCategory;
  rarity: VaultRarity;
  blurb?: string;
  owned?: boolean;
  percent?: number;
  isNew?: boolean;
  onClick?: () => void;
}) {
  const tone = RARITY_COLOR[rarity];
  const [flipped, setFlipped] = useState(false);
  const locked = !owned;
  return (
    <button
      type="button"
      onClick={() => {
        setFlipped((open) => !open);
        onClick?.();
      }}
      className={cn(
        "group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border text-left [perspective:800px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        rarity === "obsession" && "obsession-card",
        rarity === "forbidden" && "forbidden-card",
      )}
      style={
        rarity === "obsession" || rarity === "forbidden"
          ? undefined
          : { boxShadow: `0 0 0 1px ${tone.from}, 0 10px 28px ${tone.glow}`, borderColor: tone.from }
      }
      aria-pressed={flipped}
    >
      <div className={cn("relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}>
        <div className="absolute inset-0 [backface-visibility:hidden]">
          {rarity === "forbidden" ? <span className="pointer-events-none absolute inset-0 z-[1] animate-forbidden-shimmer opacity-80" aria-hidden /> : null}
          {rarity === "obsession" ? <span className="pointer-events-none absolute inset-0 z-[1] animate-obsession-sheen" aria-hidden /> : null}
          <TreasureArt kind={kind} rarity={rarity} hidden={locked} />
          {isNew ? <span className="absolute left-2 top-2 z-[2] rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">New!</span> : null}
          {!flipped && !locked ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
              <p className="text-[9px] uppercase tracking-[0.16em]" style={{ color: tone.from }}>{tone.label}</p>
              <p className="font-gothic text-sm leading-tight text-white">{name}</p>
            </div>
          ) : null}
        </div>
        <div className="absolute inset-0 flex flex-col justify-end bg-[#12080e] p-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-[9px] uppercase tracking-[0.16em]" style={{ color: tone.from }}>{tone.label}</p>
          <p className="font-gothic text-base leading-tight text-white">{locked ? name : name}</p>
          <p className="mt-1 line-clamp-4 text-[11px] text-white/75">{blurb}</p>
          <p className="mt-2 text-[11px] text-white/80">{owned ? "Yours" : percent != null ? `${percent.toFixed(2)}% to find` : "Locked"}</p>
        </div>
      </div>
    </button>
  );
}
