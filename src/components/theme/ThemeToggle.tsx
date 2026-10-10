import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

/** One control. Light shows a moon (click for dark). Dark shows a sun (click for light). */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = useTheme();
  const toDark = mode === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toDark ? "Switch to dark" : "Switch to light"}
      title={toDark ? "Dark" : "Light"}
      className={cn(
        "group relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 touch-manipulation",
        toDark
          ? "border-primary/30 bg-gradient-to-b from-white to-primary/10 text-primary shadow-[0_6px_18px_rgba(176,42,90,0.16)] hover:border-primary/50 hover:shadow-[0_8px_22px_rgba(176,42,90,0.24)]"
          : "border-amber-200/35 bg-gradient-to-b from-amber-200/20 to-fuchsia-950/40 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.28)] hover:border-amber-100/50 hover:text-amber-50",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full opacity-70",
          toDark
            ? "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_55%)]"
            : "bg-[radial-gradient(circle_at_35%_30%,rgba(255,214,120,0.55),transparent_58%)]",
        )}
        aria-hidden
      />
      {toDark ? (
        <Moon className="relative h-[1.15rem] w-[1.15rem] fill-primary/15" strokeWidth={1.75} />
      ) : (
        <Sun className="relative h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
      )}
    </button>
  );
}
