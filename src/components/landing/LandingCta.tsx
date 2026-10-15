import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { cn } from "@/lib/utils";

const primary =
  "lf-gloss-btn inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-[transform,box-shadow] motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1c45e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1620] sm:w-auto";

export function LandingCta({
  location,
  children,
  className,
}: {
  location: string;
  children: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        trackLandingCta(location);
        scrollToLandingId("waitlist");
      }}
      className={cn(primary, className)}
    >
      {children}
    </button>
  );
}

/** One path while LustForge is in beta: join the waitlist. */
export function LandingActions({
  location,
  align = "center",
  showButton = true,
}: {
  location: string;
  align?: "center" | "start";
  showButton?: boolean;
}) {
  const start = align === "start";
  return (
    <div className={cn("flex flex-col gap-3", start ? "items-stretch sm:items-center lg:items-start" : "items-center")}>
      <p className={cn("text-sm leading-relaxed text-[#B8A9BC]", start ? "text-center lg:text-left" : "text-center")}>
        Join the waitlist to get your beta access.
      </p>
      {showButton ? (
        <LandingCta location={location} className={start ? "lg:w-auto" : undefined}>
          Join the waitlist
        </LandingCta>
      ) : null}
    </div>
  );
}
