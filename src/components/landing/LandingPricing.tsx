import { Check } from "lucide-react";
import { FORGE_COIN_FEATURED_PACK_ID, FORGE_COIN_PACKS } from "@/data/forgeCoinPacks";
import {
  CHAT_IMAGE_LEWD_FC,
  CHAT_MESSAGE_FC_AFTER_DAILY_FREE,
  DAILY_FREE_CHAT_MESSAGES,
  FORGE_CREATE_COMPANION_FC,
  FORGE_PREVIEW_FC,
  LIVE_VOICE_FC_PER_MINUTE,
  NEXUS_MERGE_FC,
} from "@/lib/forgeEconomy";
import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

const SPEND = [
  `${DAILY_FREE_CHAT_MESSAGES} free texts a day, then ${CHAT_MESSAGE_FC_AFTER_DAILY_FREE} FC each`,
  `Portrait preview ${FORGE_PREVIEW_FC} FC · create a companion ${FORGE_CREATE_COMPANION_FC} FC`,
  `Moment still ${CHAT_IMAGE_LEWD_FC} FC`,
  `Live Voice or Live Call ${LIVE_VOICE_FC_PER_MINUTE} FC per started minute`,
  `Nexus merge ${NEXUS_MERGE_FC} FC`,
] as const;

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="pricing-heading"
          eyebrow="Pricing"
          title={
            <>
              Forge Coins, when you want <span className="gradient-vice-text">more</span>
            </>
          }
          lede={`Text starts free — ${DAILY_FREE_CHAT_MESSAGES} messages a day, resetting at 3:00 a.m. Eastern. Forge Coins pay for creating someone, Moments, live voice, and the Nexus. Same packs as the credit store. Card or crypto. Not a subscription.`}
        />

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FORGE_COIN_PACKS.map((pack, index) => {
            const featured = pack.id === FORGE_COIN_FEATURED_PACK_ID;
            return (
              <Reveal
                key={pack.id}
                as="li"
                delay={index * 0.06}
                className={cn(
                  "relative flex h-full flex-col rounded-[1.4rem] border bg-card/90 p-5 transition-[transform,border-color,box-shadow] motion-safe:hover:-translate-y-1 motion-reduce:transform-none",
                  featured
                    ? "border-primary/55 shadow-[0_18px_44px_hsl(var(--primary)/0.16)]"
                    : "border-border hover:border-primary/35",
                )}
              >
                  {pack.badge ? (
                    <span
                      className={cn(
                        "absolute -top-2.5 right-4 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        pack.badge === "Best Value"
                          ? "border-amber-300/40 bg-amber-400/15 text-amber-700 dark:text-amber-200"
                          : "border-primary/40 bg-primary text-primary-foreground",
                      )}
                    >
                      {pack.badge}
                    </span>
                  ) : null}
                  <p className="text-[11px] uppercase tracking-[0.22em] text-primary/90">{pack.name}</p>
                  <p className="mt-2 font-gothic text-4xl text-foreground">
                    ${pack.usd}
                    <span className="ml-1 font-sans text-sm font-medium text-muted-foreground">USD</span>
                  </p>
                  <p className="mt-2 text-sm text-foreground/90">{pack.fc.toLocaleString()} FC</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pack.description}</p>
                </Reveal>
            );
          })}
        </ul>

        <Reveal className="mt-6">
          <div className="rounded-[1.4rem] border border-border bg-card/70 px-5 py-5 sm:px-6">
            <h3 className="font-gothic text-lg text-foreground">What a few coins cover</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {SPEND.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Pack names are flavor. The FC amount is what you receive after payment confirms. You can buy them once you&apos;re in.
            </p>
          </div>
        </Reveal>

        <p className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              trackLandingCta("pricing");
              scrollToLandingId("waitlist");
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.22)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Join the waitlist
          </button>
        </p>
      </div>
    </section>
  );
}
