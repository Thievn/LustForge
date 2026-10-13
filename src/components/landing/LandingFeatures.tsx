import { ComingSoon } from "@/components/shell/ComingSoon";
import { History, ImageIcon, Orbit, Phone, Shield, Sparkles, Waves } from "lucide-react";
import {
  CHAT_IMAGE_LEWD_FC,
  DAILY_FREE_CHAT_MESSAGES,
  FORGE_CREATE_COMPANION_FC,
  FORGE_PREVIEW_FC,
  LIVE_VOICE_FC_PER_MINUTE,
  NEXUS_MERGE_FC,
} from "@/lib/forgeEconomy";
import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Companion Forge",
    body: `Describe the face, the Personalities, and a theme, then preview the portrait for ${FORGE_PREVIEW_FC} FC. Finalizing a companion is ${FORGE_CREATE_COMPANION_FC} FC. The card you keep is the person you talk to.`,
    className: "lg:col-span-2",
  },
  {
    icon: History,
    title: "Chat that continues",
    body: `${DAILY_FREE_CHAT_MESSAGES} free texts a day, saved to your account. Leave mid-sentence and Chat History is still there when you come back.`,
    className: "lg:col-span-2",
  },
  {
    icon: ImageIcon,
    title: "Moments",
    body: `Ask for a Moment and they send a still into the thread — ${CHAT_IMAGE_LEWD_FC} FC — matched to the companion you made, not a random face.`,
    className: "lg:col-span-1",
  },
  {
    icon: Phone,
    title: "Live Voice & Live Call",
    body: `Hear them in chat, or open a full-screen Live Call. Both are ${LIVE_VOICE_FC_PER_MINUTE} FC per started minute. You pick the voice.`,
    className: "lg:col-span-1",
  },
  {
    icon: Waves,
    title: "Toy Control",
    body: "Optional Lovense sync. When a toy is linked, chat can move with the scene. Nothing here requires one.",
    className: "lg:col-span-2",
  },
  {
    icon: Shield,
    title: "Safe word",
    body: "Set it in Preferences. Say it, or tap the emergency stop, and the scene and any toy control stop.",
    className: "lg:col-span-2",
  },
  {
    icon: Orbit,
    title: "The Nexus",
    body: `Bring two companions together and meet who they become. A merge is ${NEXUS_MERGE_FC} FC.`,
    className: "lg:col-span-2",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="features-heading"
          eyebrow="In the app"
          title={
            <>
              What you actually <span className="gradient-vice-text">get</span>
            </>
          }
          lede="Not a mood board. These are the pieces you use after you're in — forge, chat, pictures, voice, and an optional toy."
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal
                key={feature.title}
                as="li"
                delay={index * 0.05}
                className={cn(
                  "group flex h-full flex-col rounded-[1.4rem] border border-border bg-card/85 p-5 transition-[transform,border-color,box-shadow] hover:border-primary/40 hover:shadow-[0_16px_40px_hsl(var(--primary)/0.1)] motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none",
                  feature.className,
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform motion-safe:group-hover:rotate-3 motion-reduce:transform-none">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-gothic text-xl text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </Reveal>
            );
          })}
        </ul>
        <div className="mt-12">
          <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Later</p>
          <div className="mt-4">
            <ComingSoon />
          </div>
        </div>
        <p className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              trackLandingCta("features");
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
