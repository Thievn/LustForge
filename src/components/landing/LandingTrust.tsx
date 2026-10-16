import { Link } from "react-router-dom";
import { BadgeCheck, Bell, Shield, UserRound } from "lucide-react";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

const BADGES = [
  {
    icon: BadgeCheck,
    title: "18+ only",
    body: "An age gate sits in front of the app. Companions are fictional AI, not real people.",
  },
  {
    icon: Shield,
    title: "Safe word",
    body: "Set in Preferences. It stops the scene and Toy Control, same as the emergency stop in chat.",
  },
  {
    icon: UserRound,
    title: "Your account",
    body: "Chats stay on your account so the thread can continue. We don't sell personal data.",
  },
  {
    icon: Bell,
    title: "Discreet",
    body: "A notification can show her name, or only the word LustForge.",
  },
] as const;

export function LandingTrust() {
  return (
    <section id="trust" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="trust-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="trust-heading"
          eyebrow="Before you join"
          title={
            <>
              Private on purpose, <span className="gradient-vice-text">adult on purpose</span>
            </>
          }
          lede="A short version of the rules. The policies are the full version."
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <Reveal key={badge.title} as="li" delay={index * 0.06} className="h-full rounded-[1.4rem] border border-border bg-card/80 p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-gothic text-lg text-foreground">{badge.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{badge.body}</p>
              </Reveal>
            );
          })}
        </ul>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/privacy-policy" className="text-foreground/90 underline-offset-4 hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link to="/terms-of-service" className="text-foreground/90 underline-offset-4 hover:underline">
            Terms
          </Link>
          {" · "}
          <Link to="/18-plus-disclaimer" className="text-foreground/90 underline-offset-4 hover:underline">
            18+ disclaimer
          </Link>
        </p>
      </div>
    </section>
  );
}
