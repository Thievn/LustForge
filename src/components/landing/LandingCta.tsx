import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { cn } from "@/lib/utils";

const primary =
  "lf-gloss-btn inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-[transform,box-shadow] motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1c45e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1620]";

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
