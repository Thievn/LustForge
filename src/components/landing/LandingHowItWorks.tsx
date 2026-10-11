import { Sparkles, MessageCircleHeart, Phone } from "lucide-react";
import { DAILY_FREE_CHAT_MESSAGES } from "@/lib/forgeEconomy";
import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

const STEPS = [
  {
    icon: Sparkles,
    step: "01",
    title: "Create",
    summary: "Open Companion Forge and make them yours.",
    detail:
      "Describe a look, pick Personalities, and choose a theme — Gothic Seduction, Anime Temptation, Dark Fantasy, and others. Preview the portrait, then keep the companion you want to talk to. Or start from someone already in Discover.",
  },
  {
    icon: MessageCircleHeart,
    step: "02",
    title: "Talk",
    summary: "Text, pictures, and a thread that stays.",
    detail: `You get ${DAILY_FREE_CHAT_MESSAGES} free texts a day. The conversation is saved to your account, so you can leave and pick it up in Chat History. Ask for a Moment when you want a still in the chat.`,
  },
  {
    icon: Phone,
    step: "03",
    title: "Get closer",
    summary: "Their voice. A toy, only if you want one.",
    detail:
      "Switch on Live Voice, or open a full-screen Live Call. If you connect a Lovense toy, Toy Control can follow the scene. A safe word — or the emergency stop — ends it immediately.",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="how-it-works-heading"
          eyebrow="How it works"
          title={
            <>
              Three steps, then it&apos;s <span className="gradient-vice-text">just you two</span>
            </>
          }
          lede="Create them, talk, and get closer only as far as you want. Every piece below is already in the app."
        />
        <ol className="relative mt-10 grid gap-4 lg:mt-14 lg:grid-cols-3">
          <span
            className="pointer-events-none absolute left-[16%] right-[16%] top-14 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block"
            aria-hidden
          />
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal
                key={step.step}
                as="li"
                delay={index * 0.08}
                className="group relative h-full rounded-[1.6rem] border border-border bg-card/90 p-6 shadow-[0_16px_40px_rgba(80,30,50,0.06)] transition-[transform,border-color,box-shadow] hover:border-primary/45 hover:shadow-[0_18px_44px_hsl(var(--primary)/0.12)] motion-safe:hover:-translate-y-1 motion-reduce:transform-none dark:shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform motion-safe:group-hover:scale-105 motion-reduce:transform-none">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-gothic text-3xl text-primary/70">{step.step}</span>
                </div>
                <h3 className="mt-5 font-gothic text-2xl text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm font-medium text-foreground/90">{step.summary}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              </Reveal>
            );
          })}
        </ol>
        <p className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              trackLandingCta("how");
              scrollToLandingId("waitlist");
            }}
            className="text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Join the waitlist
          </button>
        </p>
      </div>
    </section>
  );
}
