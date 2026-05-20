import { Layers, Library, GitMerge, WandSparkles } from "lucide-react";
import { TierHaloPortraitFrame } from "@/components/rarity/TierHaloPortraitFrame";
import {
  COMPANION_RARITIES,
  defaultProfileGradientForRarity,
  rarityDisplayLabel,
  rarityTierCaptionColor,
  type CompanionRarity,
} from "@/lib/companionRarity";
import { companionImages } from "@/data/companionImages";
import { PORTRAIT_CARD_ASPECT_CLASS } from "@/lib/portraitAspect";
import { cn } from "@/lib/utils";

const TIER_LADDER_PORTRAIT =
  companionImages["kira-lux"] ?? companionImages["jax-harlan"] ?? Object.values(companionImages)[0];

function TierLadderMiniCard({ rarity }: { rarity: CompanionRarity }) {
  const { from, to } = defaultProfileGradientForRarity(rarity);
  const isAbyssal = rarity === "abyssal";

  return (
    <div className="flex flex-col items-center gap-2 min-w-0 w-full max-w-[5.5rem] sm:max-w-[6.25rem] mx-auto">
      <TierHaloPortraitFrame
        variant="compact"
        frameStyle="clean"
        rarity={rarity}
        gradientFrom={from}
        gradientTo={to}
        rarityFrameBleed
        aspectClassName={cn(PORTRAIT_CARD_ASPECT_CLASS, "w-full")}
        className="w-full"
      >
        {TIER_LADDER_PORTRAIT ? (
          <img
            src={TIER_LADDER_PORTRAIT}
            alt=""
            className="absolute inset-0 z-[1] h-full w-full object-cover object-top"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div
            className="absolute inset-0 z-0"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          />
        )}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />
      </TierHaloPortraitFrame>
      <span
        className={cn(
          "font-gothic text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] truncate w-full text-center",
          isAbyssal && "gradient-vice-text",
        )}
        style={isAbyssal ? undefined : { color: rarityTierCaptionColor(rarity) }}
      >
        {rarityDisplayLabel(rarity)}
      </span>
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
          <p className="text-center text-[10px] sm:text-xs uppercase tracking-[0.35em] text-muted-foreground/80 mb-5">
            Common → Abyssal
          </p>
          <div className="grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-6 sm:gap-x-3 max-w-3xl mx-auto px-1">
            {COMPANION_RARITIES.map((rarity) => (
              <TierLadderMiniCard key={rarity} rarity={rarity} />
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {PATHS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.07] bg-card/80 backdrop-blur-md p-6 shadow-lg shadow-black/20 hover:border-primary/40 transition-all duration-300 hover:glow-pink hover:shadow-[0_12px_40px_rgba(255,45,123,0.08)] ring-1 ring-white/[0.03]"
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
