import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BatteryFull, RotateCcw, Signal, Wifi } from "lucide-react";
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";

const IVY = LANDING_LOCAL_PORTRAITS["lilith-vesper"];

type Shown = { kind: "them"; text: string } | { kind: "you"; text: string } | { kind: "photo" };

const OPENING: Shown = { kind: "them", text: "Don't tell me you're still at that desk." };

const REPLIES = [
  {
    id: "left",
    label: "I left.",
    you: "I left.",
    follow: [
      { kind: "photo" as const },
      { kind: "them" as const, text: "Come find me. I'll keep the light on." },
    ],
  },
  {
    id: "stay",
    label: "Five more minutes.",
    you: "Five more minutes.",
    follow: [{ kind: "them" as const, text: "Then I'll stay right here. Don't get too comfortable without me." }],
  },
];

/**
 * Scripted phone demo. No network, no model — two replies, then a replay.
 * The screen height stays short on small phones so the hero can show it.
 */
export function LandingThreadMock() {
  const reduced = useReducedMotion();
  const [lines, setLines] = useState<Shown[]>([OPENING]);
  const [awaiting, setAwaiting] = useState(true);
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const timers = useRef<number[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, typing, awaiting, done]);

  const reset = () => {
    clearTimers();
    setLines([OPENING]);
    setAwaiting(true);
    setTyping(false);
    setDone(false);
  };

  const choose = (replyId: string) => {
    const reply = REPLIES.find((item) => item.id === replyId);
    if (!reply || !awaiting) return;
    clearTimers();
    setAwaiting(false);
    setLines((current) => [...current, { kind: "you", text: reply.you }]);

    const appendFollow = () => {
      setTyping(false);
      setLines((current) => [...current, ...reply.follow]);
      setDone(true);
    };

    if (reduced) {
      appendFollow();
      return;
    }

    setTyping(true);
    const id = window.setTimeout(appendFollow, reply.follow.some((line) => line.kind === "photo") ? 700 : 850);
    timers.current.push(id);
  };

  return (
    <div className="relative mx-auto w-full">
      <span className="absolute -left-[3px] top-[5.6rem] h-7 w-[3px] rounded-l-sm bg-zinc-700 sm:top-[6.5rem]" />
      <span className="absolute -left-[3px] top-[7.6rem] h-11 w-[3px] rounded-l-sm bg-zinc-700 sm:top-[8.7rem]" />
      <span className="absolute -right-[3px] top-[6.4rem] h-14 w-[3px] rounded-r-sm bg-zinc-600 sm:top-[7.4rem] sm:h-16" />

      <div
        className="rounded-[2.2rem] border border-zinc-700/90 bg-zinc-950 p-[9px] shadow-[0_30px_70px_rgba(40,10,24,0.28)] ring-1 ring-white/10 sm:rounded-[2.7rem] sm:p-[11px] dark:shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        role="region"
        aria-label="Sample chat with Ivy, a fictional companion. Scripted demo, not a live conversation."
      >
        <div className="relative flex h-[max(17rem,min(24rem,calc(100svh-23.5rem)))] flex-col overflow-hidden rounded-[1.75rem] bg-[#100c12] text-white sm:rounded-[2.15rem] lg:h-[34rem]">
          <div className="relative z-10 h-9 shrink-0 sm:h-12">
            <span className="pointer-events-none absolute left-1/2 top-2 z-0 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10 sm:top-2.5 sm:h-[22px] sm:w-[84px]" />
            <div className="relative z-10 flex h-9 items-center justify-between px-4 text-[10px] font-medium tracking-wide text-white/90 sm:h-12 sm:px-5 sm:text-[11px]">
              <span>9:41</span>
              <span className="inline-flex items-center gap-1">
                <Signal className="h-3 w-3" aria-hidden />
                <Wifi className="h-3 w-3" aria-hidden />
                <BatteryFull className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          </div>

          <div className="mt-0.5 flex shrink-0 items-center gap-2.5 border-b border-white/10 px-3.5 pb-2.5 sm:px-4 sm:pb-3">
            <img src={IVY} alt="" className="h-8 w-8 rounded-full object-cover object-top ring-1 ring-white/15 sm:h-9 sm:w-9" />
            <span className="min-w-0">
              <span className="block font-gothic text-sm leading-none text-white sm:text-[15px]">Ivy</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-white/55">Sample chat</span>
            </span>
          </div>

          <div ref={scroller} className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-y-auto px-3 py-3 sm:gap-2.5 sm:px-3.5 sm:py-4" aria-live="polite">
            <AnimatePresence initial={false}>
              {lines.map((line, index) => (
                <motion.div
                  key={`${line.kind}-${index}`}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.28 }}
                  className={line.kind === "you" ? "max-w-[78%] self-end" : "max-w-[84%] self-start"}
                >
                  {line.kind === "them" ? (
                    <span className="inline-block rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-[12px] leading-snug text-white sm:text-[13px]">
                      {line.text}
                    </span>
                  ) : null}
                  {line.kind === "you" ? (
                    <span className="inline-block rounded-2xl rounded-br-md bg-primary px-3 py-2 text-[12px] leading-snug text-primary-foreground sm:text-[13px]">
                      {line.text}
                    </span>
                  ) : null}
                  {line.kind === "photo" ? (
                    <span className="block w-[6.5rem] overflow-hidden rounded-2xl rounded-bl-md bg-white/10 ring-1 ring-white/10 sm:w-36">
                      <img src={IVY} alt="Ivy, sample portrait" className="h-28 w-full object-cover object-top sm:h-40" />
                    </span>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
            {typing ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-white/10 px-3 py-2.5">
                <span className="sr-only">Ivy is typing</span>
                <span className="h-1.5 w-1.5 rounded-full bg-white/80 motion-safe:animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/80 motion-safe:animate-pulse motion-safe:[animation-delay:140ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/80 motion-safe:animate-pulse motion-safe:[animation-delay:280ms]" />
              </span>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-white/10 px-3 py-2.5 sm:px-3.5 sm:py-3">
            {awaiting ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Your turn</p>
                <div className="flex flex-wrap gap-1.5">
                  {REPLIES.map((reply) => (
                    <button
                      key={reply.id}
                      type="button"
                      onClick={() => choose(reply.id)}
                      className="min-h-9 rounded-full border border-white/15 bg-white/10 px-3 text-[12px] font-medium text-white transition-colors hover:border-primary/50 hover:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {done ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-9 items-center gap-1.5 text-[12px] font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Replay sample
              </button>
            ) : null}
            {!awaiting && !done ? <p className="text-[11px] text-white/40">Ivy is writing…</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
