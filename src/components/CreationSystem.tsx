import { Layers, Library, GitMerge, WandSparkles } from "lucide-react";
import { LandingTierSpecimen } from "@/components/landing/LandingTierSpecimen";
import {
  COMPANION_RARITIES,
  rarityDisplayLabel,
  rarityTierCaptionColor,
  type CompanionRarity,
} from "@/lib/companionRarity";
import { LANDING_TIER_PERKS, LANDING_TIER_SUMMARY } from "@/data/landingRarityBenefits";
import { cn } from "@/lib/utils";

function TierSpectrumCell({ rarity }: { rarity: CompanionRarity }) {
  const isAbyssal = rarity === "abyssal";

  return (
    <div className="flex flex-col items-center gap-1 min-w-0 w-full max-w-[4.25rem] sm:max-w-[4.75rem] mx-auto">
      <LandingTierSpecimen rarity={rarity} size="compact" />
      <span
        className={cn(
          "font-gothic text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] w-full text-center",
          isAbyssal && "gradient-vice-text",
        )}
        style={isAbyssal ? undefined : { color: rarityTierCaptionColor(rarity) }}
      >
        {rarityDisplayLabel(rarity)}
      </span>
    </div>
  );
}

function TierPerksStrip() {
  const col = "grid grid-cols-[5.5rem_3.5rem_2.5rem_3.5rem] sm:grid-cols-[6rem_4rem_3rem_4rem] gap-x-2 gap-y-0.5";

  return (
    <div className="mt-5 max-w-md sm:max-w-lg mx-auto overflow-x-auto px-1">
      <div className="rounded-xl border border-white/[0.06] bg-card/50 backdrop-blur-sm px-3 py-2.5 w-max min-w-full sm:w-full sm:min-w-0">
        <div
          className={cn(
            col,
            "text-[9px] sm:text-[10px] uppercase tracking-[0.12em] text-muted-foreground/75 mb-1.5 border-b border-white/[0.06] pb-1.5",
          )}
        >
          <span className="font-medium text-foreground/70">Seal</span>
          <span className="text-center">Patterns</span>
          <span className="text-center">Traits</span>
          <span className="text-center">Stats</span>
        </div>
        {LANDING_TIER_PERKS.map((row) => {
          const isAbyssal = row.rarity === "abyssal";
          return (
            <div key={row.rarity} className={cn(col, "text-[9px] sm:text-[10px] py-0.5 items-center")}>
              <span
                className={cn("font-gothic font-semibold", isAbyssal && "gradient-vice-text")}
                style={isAbyssal ? undefined : { color: rarityTierCaptionColor(row.rarity) }}
              >
                {rarityDisplayLabel(row.rarity)}
              </span>
              <span className="text-center text-muted-foreground/90 tabular-nums">{row.patterns}</span>
              <span className="text-center text-muted-foreground/90 tabular-nums">{row.traits}</span>
              <span className="text-center text-muted-foreground/90 tabular-nums">{row.stats}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PATHS = [
  {
    icon: Library,
    title: "Catalog",
    desc: "Stock companion cards ready to acquire.",
  },
  {
    icon: WandSparkles,
    title: "Forge",
    desc: "Design a card from scratch—private or published.",
  },
  {
    icon: GitMerge,
    title: "Nexus",
    desc: "Merge two cards; hatch a hybrid with a rolled tier.",
  },
] as const;

export default function CreationSystem() {
  return (
    <section className="py-14 sm:py-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.07] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/35 bg-secondary/[0.14] backdrop-blur-md text-secondary text-xs font-medium mb-4 shadow-[0_0_22px_hsl(280_50%_35%/0.15)]">
            <Layers className="h-3 w-3" /> Companion cards
          </span>
          <h2 className="font-gothic text-3xl md:text-4xl font-bold gradient-vice-text mb-3">Card-based companions</h2>
          <p className="text-muted-foreground/90 text-sm max-w-xl mx-auto leading-relaxed">
            Collect AI companions as cards—catalog pulls, custom forges, and Nexus hybrids in one vault.
          </p>
        </div>

        <div className="mb-10 sm:mb-12">
          <p className="text-center text-[10px] sm:text-xs uppercase tracking-[0.35em] text-muted-foreground/80 mb-4">
            Spectrum · Common → Abyssal
          </p>
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6 sm:gap-x-2 max-w-3xl mx-auto px-1">
            {COMPANION_RARITIES.map((rarity) => (
              <TierSpectrumCell key={rarity} rarity={rarity} />
            ))}
          </div>
          <p className="mt-5 text-xs sm:text-sm text-muted-foreground/90 leading-relaxed text-center max-w-2xl mx-auto px-2">
            {LANDING_TIER_SUMMARY}
          </p>
          <TierPerksStrip />
        </div>

        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {PATHS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.07] bg-card/80 backdrop-blur-md p-6 shadow-lg shadow-black/20 hover:border-primary/40 transition-all duration-300 hover:glow-pink hover:shadow-[0_12px_40px_rgba(214,51,108,0.08)] ring-1 ring-white/[0.03]"
            >
              <div className="text-primary mb-4">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-gothic text-lg font-bold text-foreground mb-2">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/85 italic">
            Join the waitlist to be among the first creators when the Creation Chamber opens.
          </p>
        </div>
      </div>
    </section>
  );
}
