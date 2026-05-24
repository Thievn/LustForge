import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Hammer, Orbit, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NEON_PINK = "#FF2D7B";
const NEON_TEAL = "hsl(170 100% 50%)";

type Props = {
  onCreate: () => void;
  onOpenNexus: () => void;
  className?: string;
};

function ActionIconBadge({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "forge" | "nexus";
}) {
  const isForge = variant === "forge";
  return (
    <span
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105",
        isForge
          ? "bg-white/15 ring-white/25 shadow-[0_0_22px_rgba(255,45,123,0.45)]"
          : "bg-teal-400/10 ring-teal-300/30 shadow-[0_0_22px_rgba(0,255,200,0.25)]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br to-transparent",
          isForge ? "from-white/25" : "from-teal-200/20",
        )}
      />
      {children}
      {isForge ? (
        <Sparkles className="pointer-events-none absolute -right-0.5 -top-0.5 h-3 w-3 text-white/70" aria-hidden />
      ) : (
        <span
          className="pointer-events-none absolute inset-0 rounded-xl border border-teal-300/20"
          aria-hidden
        />
      )}
    </span>
  );
}

/** Premium primary CTAs on the dashboard home tab. */
export function DashboardHeroActions({ onCreate, onOpenNexus, className }: Props) {
  return (
    <div className={cn("flex w-full justify-center", className)}>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={onCreate}
          className="group relative overflow-hidden rounded-2xl p-[1px] text-left shadow-[0_12px_40px_rgba(255,45,123,0.22)] transition-shadow hover:shadow-[0_16px_48px_rgba(255,45,123,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            background: `linear-gradient(135deg, ${NEON_PINK}, hsl(280 55% 42%), hsl(330 90% 48%))`,
          }}
        >
          <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.18)_50%,transparent_60%)] bg-[length:200%_100%] animate-[shimmer_2.8s_ease-in-out_infinite]" />
          <span className="relative flex min-h-[4.25rem] items-center gap-4 rounded-[calc(1rem-1px)] bg-gradient-to-br from-[#3a1230]/90 via-[#1a0a18]/95 to-black/90 px-5 py-4">
            <ActionIconBadge variant="forge">
              <Hammer className="relative h-5 w-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
            </ActionIconBadge>
            <span className="min-w-0 flex-1">
              <span className="block font-gothic text-base sm:text-lg font-semibold tracking-wide text-white">
                Create Companion
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-white/55">
                Forge a new card into your vault
              </span>
            </span>
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={onOpenNexus}
          className="group relative overflow-hidden rounded-2xl p-[1px] text-left shadow-[0_12px_40px_rgba(0,255,200,0.08)] transition-shadow hover:shadow-[0_16px_48px_rgba(0,255,200,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            background: `linear-gradient(135deg, ${NEON_TEAL}, hsl(200 80% 45%), hsl(280 50% 40%))`,
          }}
        >
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,200,0.12),transparent_55%)] opacity-80" />
          <span className="relative flex min-h-[4.25rem] items-center gap-4 rounded-[calc(1rem-1px)] bg-gradient-to-br from-teal-950/80 via-[#0a1418]/95 to-black/95 px-5 py-4">
            <ActionIconBadge variant="nexus">
              <Orbit className="relative h-5 w-5 text-teal-200 drop-shadow-[0_0_10px_rgba(0,255,200,0.45)]" />
            </ActionIconBadge>
            <span className="min-w-0 flex-1">
              <span className="block font-gothic text-base sm:text-lg font-semibold tracking-wide text-teal-50">
                The Nexus
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-teal-100/45">
                Merge two forges into a hybrid
              </span>
            </span>
          </span>
        </motion.button>
      </div>
    </div>
  );
}
