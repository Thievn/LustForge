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
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";

const VISIBLE = 4;
const ROTATE_MS = 4200;

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

  const deckKey = deck.map((card) => card.id).sort().join("|");
  const orderRef = useRef<LandingExample[] | null>(null);
  if (!orderRef.current || orderRef.current.map((card) => card.id).sort().join("|") !== deckKey) {
    orderRef.current = shuffleLanding(deck);
  } else {
    const byId = new Map(deck.map((card) => [card.id, card]));
    orderRef.current = orderRef.current.map((card) => byId.get(card.id) ?? card);
  }
  const stableDeck = orderRef.current;
  const deckRef = useRef(stableDeck);
  deckRef.current = stableDeck;
  const cursorRef = useRef(VISIBLE);
  const [slots, setSlots] = useState<LandingExample[]>(() => initialReelSlots(stableDeck, VISIBLE));
  const [turn, setTurn] = useState(0);
  const [paused, setPaused] = useState(false);
  const [broken, setBroken] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const nextDeck = deckRef.current;
    cursorRef.current = Math.min(VISIBLE, nextDeck.length);
    setSlots(initialReelSlots(nextDeck, VISIBLE));
    setTurn(0);
  }, [deckKey]);

  useEffect(() => {
    if (paused || deckRef.current.length <= 1 || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setTurn((current) => current + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [deckKey, paused]);

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
          <h2 id="landing-examples-heading" className="font-gothic text-2xl text-foreground sm:text-3xl">
            People you can meet
          </h2>
        </div>

        <ul
          className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slots.map((card) =>
            broken.has(card.id) ? null : (
              <li key={card.id} className="min-w-0">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                  >
                    <Link
                      to={`/companions/${card.id}`}
                      className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[0_16px_40px_rgba(80,30,50,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                    >
                      <span className="relative block aspect-[3/4] bg-muted">
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
                        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
                        <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                          <span className="block truncate font-gothic text-lg text-white sm:text-xl">{card.name}</span>
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
