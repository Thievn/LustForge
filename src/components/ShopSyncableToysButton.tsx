import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type ShopSyncableToysButtonProps = {
  /** nav = desktop guest header; menu = mobile sheet row; promo = Account / Settings card */
  variant?: "nav" | "menu" | "promo";
  onClick?: () => void;
  className?: string;
};

const glowStyle = {
  background:
    "linear-gradient(135deg, rgba(214,51,108,0.2) 0%, rgba(120,60,160,0.14) 50%, rgba(214,51,108,0.1) 100%)",
  border: "1px solid rgba(214, 51, 108, 0.5)",
} as const;

/**
 * Premium CTA → /toys affiliate shop. Pink/magenta neon glow, sync pulse icon.
 */
export function ShopSyncableToysButton({
  variant = "nav",
  onClick,
  className,
}: ShopSyncableToysButtonProps) {
  const isMenu = variant === "menu";
  const isPromo = variant === "promo";

  return (
    <Link
      to="/toys"
      onClick={onClick}
      aria-label="Shop syncable toys for Lovense chat sync"
      className={cn(
        "group relative touch-manipulation overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] active:scale-[0.98]",
        "animate-toys-cta-glow",
        "hover:!shadow-[0_0_28px_rgba(214,51,108,0.5),0_0_52px_rgba(214,51,108,0.22),0_0_64px_rgba(168,85,247,0.14)]",
        isPromo
          ? "flex w-full flex-col gap-2 rounded-2xl px-4 py-4 text-left sm:flex-row sm:items-center sm:gap-4"
          : isMenu
            ? "flex min-h-12 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
            : "hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 min-h-10 text-xs font-semibold tracking-wide",
        className,
      )}
      style={glowStyle}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-r from-[#D6336C]/0 via-white/[0.06] to-[#D6336C]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-lg",
          "border border-[#D6336C]/45 bg-[#D6336C]/18",
          "shadow-[0_0_12px_rgba(214,51,108,0.4)]",
          "group-hover:shadow-[0_0_20px_rgba(214,51,108,0.65)] transition-shadow duration-300",
          isPromo ? "h-11 w-11" : isMenu ? "h-8 w-8" : "h-7 w-7",
        )}
      >
        <Activity
          className={cn(
            "text-[#D6336C] drop-shadow-[0_0_8px_rgba(214,51,108,0.85)]",
            isPromo ? "h-5 w-5" : isMenu ? "h-4 w-4" : "h-3.5 w-3.5",
          )}
          strokeWidth={2.25}
        />
      </span>

      <span className={cn("relative min-w-0", isPromo && "flex-1")}>
        <span className="block text-white/95 group-hover:text-white transition-colors duration-300 font-semibold">
          {isMenu || isPromo ? (
            "Shop Syncable Toys"
          ) : (
            <>
              <span className="hidden lg:inline">Shop Syncable Toys</span>
              <span className="lg:hidden">Sync Toys</span>
            </>
          )}
        </span>
        {isPromo ? (
          <span className="mt-1 block text-xs text-white/70 group-hover:text-white/85 transition-colors">
            Lovense-compatible hardware · syncs with chat, profiles, and live sessions
          </span>
        ) : null}
      </span>
    </Link>
  );
}
