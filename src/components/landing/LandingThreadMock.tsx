import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BatteryFull, Signal, Wifi } from "lucide-react";
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";

type Beat = { kind: "typing" } | { kind: "them"; text: string } | { kind: "you"; text: string } | { kind: "photo" };

const IVY = LANDING_LOCAL_PORTRAITS["lilith-vesper"];

const SCRIPT: Beat[] = [
  { kind: "typing" },
  { kind: "them", text: "Don't tell me you're still at that desk." },
  { kind: "you", text: "I left." },
  { kind: "typing" },
  { kind: "photo" },
  { kind: "them", text: "Come find me. I'll keep the light on." },
];

function beatWait(beat: Beat | undefined, resting: boolean): number {
  if (resting) return 1700;
  if (!beat || beat.kind === "typing") return 980;
  if (beat.kind === "photo") return 2100;
  return 1550;
}

export function LandingThreadMock() {
  const reduced = useReducedMotion();
  const [cursor, setCursor] = useState(reduced ? SCRIPT.length : 1);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const resting = cursor >= SCRIPT.length;
    const current = cursor > 0 ? SCRIPT[cursor - 1] : undefined;
    const wait = beatWait(current, resting);
    const timer = window.setTimeout(() => {
      if (resting) {
        setCycle((value) => value + 1);
        setCursor(1);
        return;
      }
      setCursor(cursor + 1);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [cursor, reduced]);

  const visible = reduced ? SCRIPT.filter((beat) => beat.kind !== "typing") : SCRIPT.slice(0, cursor);

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[320px]"
      aria-hidden
      animate={reduced ? undefined : { y: [0, -7, 0] }}
      transition={reduced ? undefined : { duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="absolute -left-[3px] top-[6.5rem] h-7 w-[3px] rounded-l-sm bg-zinc-700" />
      <span className="absolute -left-[3px] top-[8.7rem] h-11 w-[3px] rounded-l-sm bg-zinc-700" />
      <span className="absolute -right-[3px] top-[7.4rem] h-16 w-[3px] rounded-r-sm bg-zinc-600" />

      <div className="rounded-[2.7rem] border border-zinc-700/90 bg-zinc-950 p-[11px] shadow-[0_30px_70px_rgba(40,10,24,0.28)] ring-1 ring-white/10 dark:shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="relative flex h-[560px] flex-col overflow-hidden rounded-[2.15rem] bg-[#100c12] text-white">
          <div className="relative z-10 flex items-center justify-between px-5 pb-1 pt-3 text-[11px] font-medium tracking-wide text-white/90">
            <span>9:41</span>
            <span className="inline-flex items-center gap-1">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="pointer-events-none absolute left-1/2 top-2.5 z-20 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

          <div className="mt-1 flex items-center gap-2.5 border-b border-white/10 px-4 pb-3">
            <img src={IVY} alt="" className="h-9 w-9 rounded-full object-cover object-top ring-1 ring-white/15" />
            <span className="min-w-0">
              <span className="block font-gothic text-[15px] leading-none text-white">Ivy</span>
              <span className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/55">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                here
              </span>
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-end gap-2.5 px-3.5 py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={cycle}
                className="flex flex-col justify-end gap-2.5"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <AnimatePresence initial={false}>
                  {visible.map((beat, index) => (
                    <motion.div
                      key={`${cycle}-${index}-${beat.kind}`}
                      initial={reduced ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className={beat.kind === "you" ? "ml-10 self-end" : "mr-8 self-start"}
                    >
                      {beat.kind === "typing" ? (
                        <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white/10 px-3 py-2.5">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/80" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/80 [animation-delay:140ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/80 [animation-delay:280ms]" />
                        </span>
                      ) : null}
                      {beat.kind === "them" ? (
                        <span className="inline-block max-w-[15rem] rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-[13px] leading-snug text-white">
                          {beat.text}
                        </span>
                      ) : null}
                      {beat.kind === "you" ? (
                        <span className="inline-block rounded-2xl rounded-br-md bg-primary px-3 py-2 text-[13px] leading-snug text-primary-foreground">
                          {beat.text}
                        </span>
                      ) : null}
                      {beat.kind === "photo" ? (
                        <span className="block w-36 overflow-hidden rounded-2xl rounded-bl-md bg-white/10 ring-1 ring-white/10">
                          <img src={IVY} alt="" className="h-44 w-full object-cover object-top" />
                        </span>
                      ) : null}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center pb-2.5 pt-1">
            <span className="h-1 w-28 rounded-full bg-white/45" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
