import { motion } from "framer-motion";
import { Loader2, Square, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CompanionVibrationPatternRow } from "@/hooks/useCompanionVibrationPatterns";
import { payloadToLovenseCommand } from "@/lib/vibrationPatternPayload";

type Props = {
  patterns: CompanionVibrationPatternRow[];
  disabled?: boolean;
  sendingId: string | null;
  /** Pattern currently running (toggle off with second tap). */
  activePatternId?: string | null;
  onTrigger: (row: CompanionVibrationPatternRow) => void;
  /** profile = larger cards; chat = compact chips in panel */
  variant?: "profile" | "chat";
  className?: string;
};

export function VibrationPatternButtons({
  patterns,
  disabled,
  sendingId,
  activePatternId = null,
  onTrigger,
  variant = "profile",
  className,
}: Props) {
  if (!patterns.length) return null;

  const isChat = variant === "chat";

  const handleTap = (row: CompanionVibrationPatternRow, cmd: ReturnType<typeof payloadToLovenseCommand>) => {
    if (disabled) {
      toast.message("Link a Lovense toy in Preferences to feel signature moves.");
      return;
    }
    if (!cmd) {
      toast.error("Pattern data is missing for this move — try another pattern or contact support.");
      return;
    }
    if (sendingId === row.id) return;
    onTrigger(row);
  };

  return (
    <div
      className={cn(
        isChat ? "flex flex-wrap gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-3",
        className,
      )}
    >
      {patterns.map((row, i) => {
        const cmd = payloadToLovenseCommand(row.vibration_pattern_pool?.payload);
        const busy = sendingId === row.id;
        const isSig = row.is_abyssal_signature;
        const isLive = activePatternId === row.id;
        const blocked = disabled || !cmd;

        return (
          <motion.button
            key={row.id}
            type="button"
            disabled={busy}
            aria-pressed={isLive}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={blocked || busy ? undefined : { scale: 1.02 }}
            whileTap={blocked || busy ? undefined : { scale: 0.98 }}
            onClick={() => handleTap(row, cmd)}
            title={
              !cmd
                ? "Invalid pattern payload — tap for details"
                : disabled
                  ? "Connect a Lovense toy first"
                  : isLive
                    ? "Tap to stop"
                    : "Tap to start — tap again to stop"
            }
            className={cn(
              "group relative overflow-hidden rounded-2xl border text-left transition-all duration-300",
              isChat ? "px-3 py-2.5 text-xs" : "px-4 py-3.5 text-sm",
              blocked
                ? "border-white/[0.06] bg-white/[0.02] text-muted-foreground/60 cursor-pointer hover:border-white/10"
                : isLive
                  ? "border-[#E0457B]/55 bg-[#E0457B]/[0.14] text-white shadow-[0_0_32px_rgba(0,255,212,0.22)] ring-1 ring-[#E0457B]/40"
                  : isSig
                    ? "border-[#D6336C]/45 bg-gradient-to-br from-[#D6336C]/[0.12] via-fuchsia-950/30 to-[#E0457B]/[0.08] text-white shadow-[0_0_28px_rgba(214,51,108,0.18)] hover:border-[#D6336C]/65 hover:shadow-[0_0_36px_rgba(214,51,108,0.28)]"
                    : "border-white/[0.1] bg-gradient-to-br from-black/50 to-black/30 text-foreground/95 hover:border-primary/40 hover:bg-primary/[0.08] hover:shadow-[0_0_24px_rgba(214,51,108,0.12)]",
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                !blocked &&
                  !isLive &&
                  "bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(214,51,108,0.22),transparent_55%)]",
              )}
            />
            <span className="relative flex items-center gap-2 min-w-0">
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
              ) : isLive ? (
                <Square className="h-3.5 w-3.5 shrink-0 text-[#E0457B]" />
              ) : (
                <Zap
                  className={cn(
                    "shrink-0",
                    isChat ? "h-3.5 w-3.5" : "h-4 w-4",
                    isSig ? "text-[#D6336C]" : "text-primary/90",
                  )}
                />
              )}
              <span
                className={cn(
                  "font-semibold tracking-tight truncate",
                  isSig && !isLive && "font-gothic bg-gradient-to-r from-white via-[#ffc8e8] to-[#E0457B] bg-clip-text text-transparent",
                )}
              >
                {row.display_name}
              </span>
              {isLive ? (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-[#E0457B]/90 shrink-0">
                  On
                </span>
              ) : null}
            </span>
            {isSig && !isChat ? (
              <span className="relative mt-1 block text-[10px] uppercase tracking-[0.2em] text-[#D6336C]/80">
                Signature
              </span>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}
