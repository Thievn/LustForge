import { Link } from "react-router-dom";
import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { cn } from "@/lib/utils";

const primary =
  "lf-gloss-btn inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-[transform,box-shadow] motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1c45e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1620] sm:w-auto";

const outline =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#f1c45e]/40 bg-white/[0.04] px-5 text-sm font-semibold text-[#F4EEF2] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-[transform,border-color,background-color] hover:border-[#f1c45e]/70 hover:bg-white/[0.07] motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1c45e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1620] sm:w-auto";

export function LandingCta({
  location,
  children,
  tone = "primary",
  className,
}: {
  location: string;
  children: string;
  tone?: "primary" | "outline";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        trackLandingCta(location);
        scrollToLandingId("waitlist");
      }}
      className={cn(tone === "primary" ? primary : outline, className)}
    >
      {children}
    </button>
  );
}

export function LandingAccountLink({
  location,
  className,
  onClick,
}: {
  location: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to="/auth?mode=signup"
      onClick={() => {
        trackLandingCta(location);
        onClick?.();
      }}
      className={cn(primary, className)}
    >
      Create your free account
    </Link>
  );
}

/** Free account first. The waitlist is the option for what's still on the way. */
export function LandingActions({
  location,
  align = "center",
}: {
  location: string;
  align?: "center" | "start";
}) {
  const start = align === "start";
  return (
    <div className={cn("flex flex-col gap-3", start ? "items-stretch sm:items-center lg:items-start" : "items-center")}>
      <p className={cn("text-sm leading-relaxed text-[#B8A9BC]", start ? "text-center lg:text-left" : "text-center")}>
        Make your free account and meet her.
      </p>
      <div className={cn("flex flex-col gap-2.5 sm:flex-row sm:flex-wrap", start ? "sm:justify-center lg:justify-start" : "sm:justify-center")}>
        <LandingAccountLink location={`${location}_account`} />
        <LandingCta location={`${location}_waitlist`} tone="outline">
          Join the waitlist
        </LandingCta>
      </div>
      <p className={cn("text-xs leading-relaxed text-[#B8A9BC]", start ? "text-center lg:text-left" : "text-center")}>
        The waitlist is for what&apos;s coming soon.
      </p>
    </div>
  );
}
