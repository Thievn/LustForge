import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Beat =
  | { kind: "typing" }
  | { kind: "them"; text: string }
  | { kind: "you"; text: string }
  | { kind: "photo" }
  | { kind: "pulse"; text: string };

const SCRIPT: Beat[] = [
  { kind: "typing" },
  { kind: "them", text: "You up?" },
  { kind: "you", text: "Been waiting on you." },
  { kind: "typing" },
  { kind: "photo" },
  { kind: "pulse", text: "Feel that?" },
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LandingThreadMock() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const beat = SCRIPT[step] ?? SCRIPT[0];
    const wait = beat.kind === "typing" ? 1100 : beat.kind === "photo" ? 2200 : 1600;
    const timer = window.setTimeout(() => {
      setStep((current) => (current + 1) % SCRIPT.length);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [step]);

  const visible = prefersReducedMotion() ? SCRIPT.filter((beat) => beat.kind !== "typing") : SCRIPT.slice(0, step + 1);

  return (
    <div className="mx-auto w-full max-w-[280px]" aria-hidden>
      <div className="rounded-[2rem] border border-border bg-card p-3 shadow-[0_24px_60px_rgba(80,30,50,0.12)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-3 flex items-center gap-2 px-2 pt-1">
          <span className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary" />
          <span className="min-w-0">
            <span className="block font-gothic text-sm text-foreground">Ivy</span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-primary/80">texting</span>
          </span>
        </div>
        <div className="flex min-h-[280px] flex-col justify-end gap-2 rounded-[1.4rem] bg-muted/70 px-3 py-4">
          <AnimatePresence initial={false}>
            {visible.map((beat, index) => (
              <motion.div
                key={`${index}-${beat.kind}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className={
                  beat.kind === "you"
                    ? "ml-8 self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "mr-8 self-start"
                }
              >
                {beat.kind === "typing" ? (
                  <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
                  </span>
                ) : null}
                {beat.kind === "them" ? (
                  <span className="inline-block rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2 text-sm text-foreground">
                    {beat.text}
                  </span>
                ) : null}
                {beat.kind === "you" ? beat.text : null}
                {beat.kind === "photo" ? (
                  <span className="block overflow-hidden rounded-2xl rounded-bl-md border border-border bg-card">
                    <span className="block h-28 w-36 bg-gradient-to-br from-primary/70 via-secondary to-accent/80" />
                    <span className="block px-3 py-1.5 text-[11px] text-muted-foreground">sent a picture</span>
                  </span>
                ) : null}
                {beat.kind === "pulse" ? (
                  <span className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                    {beat.text}
                  </span>
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
