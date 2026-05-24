import { useEffect, useMemo, useState } from "react";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DAILY_FREE_CHAT_MESSAGES } from "@/lib/forgeEconomy";
import { formatCountdown, msUntilNextEasternChatQuotaReset } from "@/lib/chatDailyQuota";
import { cn } from "@/lib/utils";

type Props = {
  remainingFree: number;
  nextLineFc: number;
  className?: string;
};

/** Compact dashboard pill — free lines + reset timer; details in tooltip. */
export function DashboardChatQuotaChip({ remainingFree, nextLineFc, className }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const resetLabel = useMemo(() => formatCountdown(msUntilNextEasternChatQuotaReset()), [tick]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex justify-center", className)}>
        <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/[0.08] bg-black/35 px-3 py-1.5 text-[11px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-white/85">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="font-semibold text-primary tabular-nums">{remainingFree}</span>
              <span className="text-white/50"> / {DAILY_FREE_CHAT_MESSAGES}</span>
              <span className="hidden sm:inline"> free chat lines today</span>
              <span className="sm:hidden"> free today</span>
            </span>
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" aria-hidden />
          <span className="tabular-nums text-white/45">
            Resets <span className="text-cyan-200/80">{resetLabel}</span>
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/35 transition-colors hover:bg-white/10 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="How daily free chat lines work"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="max-w-[16rem] border-white/10 bg-popover/95 px-3 py-2.5 text-xs leading-relaxed">
              <p>
                Classic text uses a shared daily pool that resets at <span className="text-cyan-200/90">3 AM Eastern</span>.
                {nextLineFc > 0 ? (
                  <>
                    {" "}
                    After it runs out, each line costs <span className="font-semibold text-amber-200/95">{nextLineFc} FC</span>.
                  </>
                ) : null}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
