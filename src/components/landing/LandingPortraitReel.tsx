import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCompanions } from "@/hooks/useCompanions";
import { galleryStaticPortraitUrl } from "@/lib/companionMedia";
import { buildLandingExamples, shuffleLanding, type LandingExample } from "@/lib/landingExamples";
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";

const DRIFT_MS = 3400;

function wrapOffset(index: number, active: number, count: number): number {
  if (count <= 0) return 0;
  let delta = index - active;
  const half = count / 2;
  if (delta > half) delta -= count;
  if (delta < -half) delta += count;
  return delta;
}

export function LandingPortraitReel() {
  const reduced = useReducedMotion();
  const { data: dbList } = useCompanions();
  const built = useMemo(() => {
    const remote = (dbList ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      src: galleryStaticPortraitUrl(row, row.id) ?? null,
      rarity: row.rarity,
      isNexusHybrid: row.is_nexus_hybrid,
    }));
    return buildLandingExamples(LANDING_LOCAL_PORTRAITS, remote);
  }, [dbList]);

  const deckKey = built
    .map((card) => card.id)
    .sort()
    .join("|");
  const orderRef = useRef<LandingExample[] | null>(null);
  if (!orderRef.current || orderRef.current.map((card) => card.id).sort().join("|") !== deckKey) {
    orderRef.current = shuffleLanding(built);
  } else {
    const byId = new Map(built.map((card) => [card.id, card]));
    orderRef.current = orderRef.current.map((card) => byId.get(card.id) ?? card);
  }

  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const deck = orderRef.current.filter((card) => !broken.has(card.id));
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [wide, setWide] = useState(false);
  const suppressClick = useRef(false);
  const pointerStart = useRef<number | null>(null);
  const hovering = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (active >= deck.length) setActive(0);
  }, [active, deck.length]);

  useEffect(() => {
    if (paused || reduced || deck.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % deck.length);
    }, DRIFT_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduced, deck.length, deckKey]);

  const step = wide ? 248 : 164;
  const count = deck.length;

  const go = (direction: number) => {
    if (count <= 1) return;
    setActive((current) => (current + direction + count) % count);
  };

  return (
    <section className="px-4 pb-4 pt-8 sm:px-6 sm:pt-12" aria-labelledby="landing-examples-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="landing-examples-heading" className="text-center font-gothic text-2xl text-foreground sm:text-3xl">
          A few already waiting
        </h2>

        <div
          className="relative mx-auto mt-8 h-[300px] max-w-5xl sm:h-[420px]"
          onMouseEnter={() => {
            hovering.current = true;
            setPaused(true);
          }}
          onMouseLeave={() => {
            hovering.current = false;
            setPaused(false);
          }}
          onPointerDown={(event) => {
            pointerStart.current = event.clientX;
            suppressClick.current = false;
            setPaused(true);
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current;
            pointerStart.current = null;
            if (start != null) {
              const delta = event.clientX - start;
              if (delta > 48) {
                suppressClick.current = true;
                go(-1);
              } else if (delta < -48) {
                suppressClick.current = true;
                go(1);
              }
            }
            if (event.pointerType !== "mouse") hovering.current = false;
            if (!hovering.current) {
              window.setTimeout(() => {
                if (!hovering.current) setPaused(false);
              }, 1200);
            }
          }}
          onPointerCancel={() => {
            pointerStart.current = null;
            if (!hovering.current) setPaused(false);
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            {deck.map((card, index) => {
              const offset = wrapOffset(index, active, count);
              const distance = Math.abs(offset);
              const hidden = distance > 2;
              return (
                <motion.div
                  key={card.id}
                  className={`absolute left-1/2 top-1/2 w-[11rem] sm:w-[15rem] ${hidden ? "pointer-events-none" : ""}`}
                  style={{ zIndex: 20 - distance }}
                  initial={false}
                  animate={{
                    x: `calc(-50% + ${offset * step}px)`,
                    y: "-50%",
                    scale: distance === 0 ? 1 : distance === 1 ? 0.84 : 0.7,
                    opacity: hidden ? 0 : distance === 2 ? 0.72 : 1,
                  }}
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 }}
                >
                  <Link
                    to={`/companions/${card.id}`}
                    tabIndex={hidden ? -1 : 0}
                    aria-hidden={hidden || undefined}
                    onClick={(event) => {
                      if (suppressClick.current) {
                        event.preventDefault();
                        suppressClick.current = false;
                      }
                    }}
                    className="group relative block overflow-hidden rounded-[1.4rem] bg-card text-left shadow-[0_18px_40px_rgba(40,10,24,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 dark:shadow-[0_22px_50px_rgba(0,0,0,0.45)]"
                  >
                    <span className="relative block aspect-[3/4] bg-muted">
                      <img
                        src={card.src}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        onError={() =>
                          setBroken((prev) => {
                            const next = new Set(prev);
                            next.add(card.id);
                            return next;
                          })
                        }
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/15" />
                      {distance <= 1 ? (
                        <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                          <span
                            className={`block truncate font-gothic text-white ${distance === 0 ? "text-2xl" : "text-lg"}`}
                          >
                            {card.name}
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous person"
                onClick={() => go(-1)}
                className="absolute left-0 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-card sm:left-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next person"
                onClick={() => go(1)}
                className="absolute right-0 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-card sm:right-2"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
