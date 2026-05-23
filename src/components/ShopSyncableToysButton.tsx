import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type ShopSyncableToysButtonProps = {
  /** Full-width row style for mobile sheet menu */
  variant?: "nav" | "menu";
  onClick?: () => void;
  className?: string;
};

/**
 * Premium navbar CTA → /toys affiliate shop. Pink/magenta neon glow, sync pulse icon.
 */
export function ShopSyncableToysButton({
  variant = "nav",
  onClick,
  className,
}: ShopSyncableToysButtonProps) {
  const isMenu = variant === "menu";

  return (
    <Link
      to="/toys"
      onClick={onClick}
      aria-label="Shop syncable toys for Lovense chat sync"
      className={cn(
        "group relative touch-manipulation overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.04] active:scale-[0.98]",
        "animate-toys-cta-glow",
        "hover:!shadow-[0_0_28px_rgba(255,45,123,0.5),0_0_52px_rgba(255,45,123,0.22),0_0_64px_rgba(168,85,247,0.14)]",
        isMenu
          ? "flex min-h-12 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
          : "hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 min-h-10 text-xs font-semibold tracking-wide",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,45,123,0.2) 0%, rgba(120,60,160,0.14) 50%, rgba(255,45,123,0.1) 100%)",
        border: "1px solid rgba(255, 45, 123, 0.5)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-r from-[#FF2D7B]/0 via-white/[0.06] to-[#FF2D7B]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-lg",
          "border border-[#FF2D7B]/45 bg-[#FF2D7B]/18",
          "shadow-[0_0_12px_rgba(255,45,123,0.4)]",
          "group-hover:shadow-[0_0_20px_rgba(255,45,123,0.65)] transition-shadow duration-300",
          isMenu ? "h-8 w-8" : "h-7 w-7",
        )}
      >
        <Activity
          className={cn(
            "text-[#FF2D7B] drop-shadow-[0_0_8px_rgba(255,45,123,0.85)]",
            isMenu ? "h-4 w-4" : "h-3.5 w-3.5",
          )}
          strokeWidth={2.25}
        />
      </span>

      <span className="relative text-white/95 group-hover:text-white transition-colors duration-300">
        {isMenu ? (
          "Shop Syncable Toys"
        ) : (
          <>
            <span className="hidden lg:inline">Shop Syncable Toys</span>
            <span className="lg:hidden">Sync Toys</span>
          </>
        )}
      </span>
    </Link>
  );
}
