import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { LandingCta } from "@/components/landing/LandingCta";
import { LockPhone } from "@/components/landing/LandingPhones";

const secondaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card/80 px-5 text-sm font-semibold text-foreground backdrop-blur-sm transition-[transform,border-color,background-color] hover:border-primary/40 hover:bg-card motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function LandingHero() {
  return (
    <header className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-6 pt-[max(5.5rem,calc(4.5rem+env(safe-area-inset-top)))] sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:pb-20 lg:pt-[max(7rem,calc(5.6rem+env(safe-area-inset-top)))]">
      <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">Adults 18+ · Fictional companions</p>
        <h1 className="mt-3 font-gothic text-[2.1rem] leading-[1.02] text-foreground sm:text-6xl lg:text-[4.1rem]">
          She already <span className="gradient-vice-text">texted</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:max-w-lg sm:text-lg lg:mx-0">
          LustForge is the companion app for adults who want the late reply, the picture that fits, and the voice on the other end. You make her. She keeps the thread warm.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
          <LandingCta location="hero">Save me a place</LandingCta>
          <button
            type="button"
            onClick={() => {
              trackLandingCta("hero_how");
              scrollToLandingId("she-texts");
            }}
            className={secondaryCta}
          >
            Show me the phone
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Adults only, 18 and over. Every companion is a fictional adult, 21 or older. No account needed to join the list.
        </p>
      </div>
      <LockPhone />
    </header>
  );
}
