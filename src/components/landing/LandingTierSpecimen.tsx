import { TierHaloPortraitFrame } from "@/components/rarity/TierHaloPortraitFrame";
import { RarityBadgeIcon } from "@/components/rarity/RarityBadgeIcon";
import { defaultProfileGradientForRarity, type CompanionRarity } from "@/lib/companionRarity";
import { PORTRAIT_CARD_ASPECT_CLASS } from "@/lib/portraitAspect";
import { cn } from "@/lib/utils";

const TIER_INDEX: Record<CompanionRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
  abyssal: 5,
};

type Props = {
  rarity: CompanionRarity;
  size?: "default" | "compact";
  className?: string;
};

/** Abstract chamber slab — real tier frame, no portrait (landing spectrum row only). */
export function LandingTierSpecimen({ rarity, size = "default", className }: Props) {
  const compact = size === "compact";
  const { from, to } = defaultProfileGradientForRarity(rarity);
  const tierIndex = TIER_INDEX[rarity];
  const isAbyssal = rarity === "abyssal";
  const isMythic = rarity === "mythic";
  const pulseStrength = compact ? 0.42 + tierIndex * 0.07 : 0.5 + tierIndex * 0.09;

  const radialFill = isMythic
    ? `radial-gradient(ellipse 85% 70% at 28% 38%, color-mix(in srgb, ${from} ${compact ? "58" : "72"}%, transparent), transparent 55%), radial-gradient(ellipse 80% 65% at 74% 56%, color-mix(in srgb, ${to} ${compact ? "62" : "78"}%, transparent), transparent 52%), linear-gradient(160deg, #0a0a12 0%, #1a0a14 100%)`
    : `radial-gradient(ellipse 90% 75% at 50% 38%, color-mix(in srgb, ${from} ${Math.round(pulseStrength * 100)}%, transparent), transparent 58%), radial-gradient(ellipse 100% 80% at 50% 100%, color-mix(in srgb, ${to} ${compact ? "32" : "42"}%, transparent), transparent 50%)`;

  return (
    <TierHaloPortraitFrame
      variant="compact"
      frameStyle="clean"
      rarity={rarity}
      gradientFrom={from}
      gradientTo={to}
      rarityFrameBleed
      aspectClassName={cn(PORTRAIT_CARD_ASPECT_CLASS, "w-full")}
      className={cn("w-full", className)}
    >
      <div className="absolute inset-0 z-0 bg-black/75" />
      <div className="absolute inset-0 z-[1]" style={{ background: radialFill }} />
      <div
        className={cn(
          "absolute inset-0 z-[1] pointer-events-none",
          compact ? "opacity-[0.08]" : "opacity-[0.14]",
        )}
        style={{
          backgroundImage: `
            linear-gradient(hsl(330 100% 58% / 0.35) 1px, transparent 1px),
            linear-gradient(90deg, hsl(170 100% 50% / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: compact ? "10px 10px" : "12px 12px",
        }}
      />
      {isAbyssal ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] motion-reduce:opacity-0 motion-reduce:animate-none animate-rarity-neon-outer-breathe",
            compact ? "opacity-15" : "opacity-25",
          )}
          style={{ background: `linear-gradient(135deg, ${from}44, ${to}33)` }}
        />
      ) : null}
      <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
        <RarityBadgeIcon
          rarity={rarity}
          className={cn(
            "drop-shadow-[0_0_14px_rgba(0,0,0,0.85)]",
            compact ? "scale-[1.5] sm:scale-[1.55]" : "scale-[2.15] sm:scale-[2.35]",
          )}
        />
      </div>
      <div
        className={cn(
          "absolute inset-0 z-[3] bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none",
          compact && "from-black/70",
        )}
      />
    </TierHaloPortraitFrame>
  );
}
