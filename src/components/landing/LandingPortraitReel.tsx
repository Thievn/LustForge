import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCompanions } from "@/hooks/useCompanions";
import { galleryStaticPortraitUrl } from "@/lib/companionMedia";
import {
  advanceReelSlot,
  buildLandingExamples,
  initialReelSlots,
  shuffleLanding,
  type LandingExample,
} from "@/lib/landingExamples";
import { RARITY_NEON, rarityDisplayLabel } from "@/lib/companionRarity";
import type { CompanionRarity } from "@/lib/companionRarity";
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const VISIBLE = 6;
const ROTATE_MS = 4200;

function sealColor(rarity: CompanionRarity): string {
  if (rarity === "common") return RARITY_NEON.common.core;
  return RARITY_NEON[rarity].from;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LandingPortraitReel() {
  const { data: dbList } = useCompanions();
  const deck = useMemo(() => {
    const remote = (dbList ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      src: galleryStaticPortraitUrl(row, row.id) ?? null,
      rarity: row.rarity,
      isNexusHybrid: row.is_nexus_hybrid,
    }));
    return shuffleLanding(buildLandingExamples(LANDING_LOCAL_PORTRAITS, remote));
  }, [dbList]);

  const deckKey = deck.map((card) => card.id).join("|");
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const cursorRef = useRef(VISIBLE);
  const [slots, setSlots] = useState<LandingExample[]>(() => initialReelSlots(deck, VISIBLE));
  const [turn, setTurn] = useState(0);
  const [selected, setSelected] = useState<LandingExample | null>(null);
  const [broken, setBroken] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const nextDeck = deckRef.current;
    cursorRef.current = Math.min(VISIBLE, nextDeck.length);
    setSlots(initialReelSlots(nextDeck, VISIBLE));
    setTurn(0);
  }, [deckKey]);

  useEffect(() => {
    if (deckRef.current.length <= 1 || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setTurn((current) => current + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [deckKey]);

  useEffect(() => {
    const currentDeck = deckRef.current;
    if (turn === 0 || currentDeck.length <= 1) return;
    setSlots((current) => {
      const slotIndex = (turn - 1) % Math.max(current.length, 1);
      const next = advanceReelSlot(currentDeck, current, slotIndex, cursorRef.current);
      cursorRef.current = next.cursor;
      return next.slots;
    });
  }, [turn]);

  return (
    <section className="px-4 pb-6 sm:px-6" aria-labelledby="landing-examples-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <p className="font-gothic text-[11px] uppercase tracking-[0.28em] text-[#E7B7C6]/90">Examples</p>
          <h2 id="landing-examples-heading" className="mt-2 font-gothic text-2xl text-foreground sm:text-3xl">
            Companions people have made
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            A few faces from the app, in a new order each visit. They stay here as examples.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {slots.map((card, index) =>
            broken.has(card.id) ? null : (
              <li key={index} className="min-w-0">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.button
                    key={card.id}
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: "easeInOut" }}
                    onClick={() => setSelected(card)}
                    className="group relative block w-full overflow-hidden rounded-2xl bg-black text-left shadow-[0_16px_40px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B7C6]/70"
                    style={{ boxShadow: `inset 0 0 0 1px ${sealColor(card.rarity)}55` }}
                  >
                    <span className="relative block aspect-[3/4] bg-black">
                      <img
                        src={card.src}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        onError={() =>
                          setBroken((prev) => {
                            const next = new Set(prev);
                            next.add(card.id);
                            return next;
                          })
                        }
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/10" />
                      <span
                        className="absolute right-2.5 top-2.5 rounded-full border border-white/15 bg-black/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: sealColor(card.rarity) }}
                      >
                        {rarityDisplayLabel(card.rarity)}
                      </span>
                      <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                        <span className="block truncate font-gothic text-sm text-white sm:text-base">{card.name}</span>
                        <span className="mt-1 line-clamp-2 block text-[11px] leading-snug text-white/70 sm:text-xs">
                          {card.tagline}
                        </span>
                      </span>
                    </span>
                  </motion.button>
                </AnimatePresence>
              </li>
            ),
          )}
        </ul>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent
          className={cn(
            "max-w-md gap-0 overflow-hidden border-white/10 bg-[#0a0a0c] p-0 text-foreground sm:rounded-2xl",
          )}
        >
          {selected ? (
            <>
              <div className="relative aspect-[3/4] max-h-[58vh] bg-black">
                <img src={selected.src} alt="" className="h-full w-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/20" />
              </div>
              <div className="space-y-4 px-5 pb-5 pt-1">
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: sealColor(selected.rarity) }}
                  >
                    {rarityDisplayLabel(selected.rarity)}
                  </p>
                  <DialogTitle className="mt-1 font-gothic text-2xl text-white">{selected.name}</DialogTitle>
                  <DialogDescription className="mt-2 text-sm leading-relaxed text-white/70">
                    {selected.tagline} This portrait is an example. Creating your own starts a private companion, and this one is not added to your account.
                  </DialogDescription>
                </div>
                <Link
                  to="/auth"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#C73B6A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#d4527e]"
                >
                  Create your own
                </Link>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
