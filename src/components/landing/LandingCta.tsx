import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { cn } from "@/lib/utils";

const primary =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.28)] transition-[transform,background-color,box-shadow] hover:bg-primary/90 hover:shadow-[0_14px_36px_hsl(var(--primary)/0.38)] motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const secondary =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card/80 px-5 text-sm font-semibold text-foreground backdrop-blur-sm transition-[transform,border-color,background-color] hover:border-primary/40 hover:bg-card motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function LandingCta({
  location,
  children,
  tone = "primary",
  className,
}: {
  location: string;
  children: string;
  tone?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        trackLandingCta(location);
        scrollToLandingId("waitlist");
      }}
      className={cn(tone === "primary" ? primary : secondary, className)}
    >
      {children}
    </button>
  );
}
