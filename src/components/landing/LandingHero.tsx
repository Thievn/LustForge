import { cn } from "@/lib/utils";
import { FlameMark } from "@/components/landing/FlameMark";
import { LandingActions } from "@/components/landing/LandingCta";
import { LockPhone } from "@/components/landing/LandingPhones";
import { PhoneColorPicker } from "@/components/landing/phoneBackdrop";
import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";

const secondaryCta =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/15 bg-transparent px-5 text-sm font-medium text-[#B8A9BC] transition-colors hover:border-white/30 hover:text-[#F4EEF2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1c45e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1620] sm:w-auto";

export function LandingHero() {
  return (
    <header className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-8 pt-[max(5.75rem,calc(4.75rem+env(safe-area-inset-top)))] sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:pb-16 lg:pt-[max(7.25rem,calc(5.75rem+env(safe-area-inset-top)))]">
      <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#f1c45e]/35 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#f1c45e] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <FlameMark className="h-5 w-5 rounded-md" />
          Adults 18+
        </p>
        <h1 className="mt-4 font-gothic text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.03em] text-[#F4EEF2] sm:text-6xl lg:text-[4.15rem]">
          Private companions,{" "}
          <span className="lf-gradient-text">kept close.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#B8A9BC] sm:max-w-lg sm:text-lg lg:mx-0">
          LustForge is a companion app for adults. Create someone fictional, talk with them, and ask for pictures that stay in your gallery.
        </p>
        <div className="mt-6">
          <LandingActions location="hero" align="start" />
        </div>
        <button
          type="button"
          onClick={() => {
            trackLandingCta("hero_phones");
            scrollToLandingId("on-your-phone");
          }}
          className={cn(secondaryCta, "mt-3")}
        >
          See it on a phone
        </button>
        <p className="mt-4 text-xs leading-relaxed text-[#B8A9BC]">
          You must be 18 or older. Companions are fictional and 21 or older.
        </p>
      </div>
      <div className="mx-auto w-full max-w-[320px] lg:max-w-none">
        <PhoneColorPicker className="mb-4 text-center lg:text-left" />
        <LockPhone />
      </div>
    </header>
  );
}
