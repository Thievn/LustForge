import { cn } from "@/lib/utils";
import { FORGE_BADGE_CARD_ONLY, FORGE_BADGE_LOCKS_IN_MOMENTS } from "@/lib/chatMomentsBrand";

export type ForgeMomentsBadgeKind = "locks" | "cardOnly";

export function ForgeMomentsBadge({ kind, className }: { kind: ForgeMomentsBadgeKind; className?: string }) {
  const locks = kind === "locks";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] font-sans",
        locks
          ? "border-[hsl(170_100%_42%)]/45 bg-[hsl(170_100%_42%)]/12 text-[hsl(170_100%_72%)]"
          : "border-[#D6336C]/35 bg-[#D6336C]/10 text-[#F57AA3]",
        className,
      )}
    >
      {locks ? FORGE_BADGE_LOCKS_IN_MOMENTS : FORGE_BADGE_CARD_ONLY}
    </span>
  );
}
