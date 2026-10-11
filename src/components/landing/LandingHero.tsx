import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { LandingThreadMock } from "@/components/landing/LandingThreadMock";

const primaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.28)] transition-[transform,background-color,box-shadow] hover:bg-primary/90 hover:shadow-[0_14px_36px_hsl(var(--primary)/0.38)] motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const secondaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card/80 px-5 text-sm font-semibold text-foreground backdrop-blur-sm transition-[transform,border-color,background-color] hover:border-primary/40 hover:bg-card motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function LandingHero() {
  const join = () => {
    trackLandingCta("hero");
    scrollToLandingId("waitlist");
  };

  const how = () => {
    trackLandingCta("hero_how");
    scrollToLandingId("how-it-works");
  };

  return (
    <header className="relative mx-auto grid max-w-6xl items-center gap-3 px-4 pb-2 pt-[max(4.35rem,calc(3.45rem+env(safe-area-inset-top)))] sm:gap-8 sm:px-6 sm:pb-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pb-16 lg:pt-[max(6.75rem,calc(5.4rem+env(safe-area-inset-top)))]">
      <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">AI companion app · Adults 18+</p>
        <h1 className="mt-2.5 font-gothic text-[1.65rem] leading-[1.08] text-foreground min-[390px]:text-[1.85rem] sm:mt-4 sm:text-5xl lg:text-[3.4rem]">
          Create an AI companion who <span className="gradient-vice-text">wants you back</span>.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-muted-foreground sm:mt-5 sm:max-w-lg sm:text-base lg:mx-0 lg:text-lg">
          LustForge is an adults-only AI companion app. Design someone fictional — the face, the attitude, the way they talk when it&apos;s late — then actually talk. Texts, pictures, and their voice.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:mt-7 lg:justify-start">
          <button type="button" onClick={join} className={primaryCta}>
            Join the waitlist
          </button>
          <button type="button" onClick={how} className={secondaryCta}>
            See how it works
          </button>
        </div>
        <p className="mt-3 hidden text-[11px] leading-relaxed text-muted-foreground/80 sm:block sm:text-xs">
          Fictional characters. No account needed to join the list.
        </p>
      </div>
      <div className="mx-auto w-full max-w-[16.75rem] sm:max-w-[19.5rem] lg:max-w-[20.5rem] lg:justify-self-end">
        <LandingThreadMock />
      </div>
    </header>
  );
}
