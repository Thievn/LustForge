import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Clapperboard,
  Gamepad2,
  Gem,
  Gift,
  Heart,
  ImageIcon,
  Lock,
  MessageCircle,
  Mic,
  Orbit,
  PersonStanding,
  Phone,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  Video,
  WandSparkles,
} from "lucide-react";
import { LandingActions } from "@/components/landing/LandingCta";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

type Feature = {
  icon: LucideIcon;
  title: string;
  body?: string;
  soon?: boolean;
};

const CURRENT: Feature[] = [
  { icon: MessageCircle, title: "Companion chat", body: "A thread that is still there when you come back." },
  { icon: ImageIcon, title: "In-chat pictures", body: "Ask for a picture. It shows up in the chat." },
  { icon: Lock, title: "Private photo reactions", body: "Send a photo. Her reply stays between you." },
  { icon: Sparkles, title: "Gallery and editor", body: "Save the pictures, then refine them with Grok Enhance." },
  { icon: Gem, title: "Velvet Vault", body: "Treasures to dress her in." },
  { icon: PersonStanding, title: "Poses", body: "How she stands, sits, or looks back." },
  { icon: Clapperboard, title: "Scenarios", body: "Start from a scene, or write the one you want." },
  { icon: WandSparkles, title: "Create someone", body: "A look, a personality, and a name." },
  { icon: Smartphone, title: "On your home screen", body: "Open LustForge like an app." },
  { icon: Sun, title: "Morning and night notes", body: "She can write first, at the times you choose." },
  { icon: Users, title: "Group chat", body: "More than one of them, in the same conversation." },
  { icon: Heart, title: "Memories and dates", body: "Keep what matters. Stay in the scene you pick." },
  { icon: Gamepad2, title: "Optional toys", body: "A toy if you want one. The chat is enough on its own." },
  { icon: Shield, title: "Safe word", body: "One word, or the stop button, ends the scene." },
  { icon: Bell, title: "Discreet alerts", body: "Her name, or only LustForge." },
];

const SOON: Feature[] = [
  { icon: Phone, title: "Voice calls", body: "Talk with her out loud.", soon: true },
  { icon: Video, title: "Video clips", body: "Short clips in the chat.", soon: true },
  { icon: Mic, title: "Voice notes", body: "A message you can hear when you are away.", soon: true },
  { icon: Sparkles, title: "Challenges", body: "Little dares between you and her.", soon: true },
  { icon: Gift, title: "Gift shop", body: "Something to send when words are not enough.", soon: true },
  { icon: ImageIcon, title: "Creator showcase", body: "The faces you want close.", soon: true },
  { icon: Orbit, title: "The Nexus", soon: true },
];

function Tile({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  return (
    <Reveal
      as="li"
      delay={Math.min(index * 0.03, 0.24)}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
        feature.soon
          ? "border border-dashed border-white/15 bg-white/[0.03]"
          : "border border-[#f1c45e]/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,111,176,0.22),rgba(224,40,127,0.08))] text-[#ff8ac4] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {feature.soon ? (
          <span className="rounded-full border border-[#f1c45e]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f1c45e]">
            Coming soon
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[#F4EEF2]">{feature.title}</h3>
      {feature.body ? <p className="mt-1 text-xs leading-relaxed text-[#B8A9BC]">{feature.body}</p> : null}
    </Reveal>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-28 px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="features-heading"
          eyebrow="With her"
          title="What you can do together"
          lede="Talk, pictures, and someone you make yourself."
        />
        <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {CURRENT.map((feature, index) => (
            <Tile key={feature.title} feature={feature} index={index} />
          ))}
        </ul>
        <h3 className="mb-3 mt-10 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-[#f1c45e]">Coming soon</h3>
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          {SOON.map((feature, index) => (
            <Tile key={feature.title} feature={feature} index={index} />
          ))}
        </ul>
        <div className="mx-auto mt-10 max-w-xl">
          <LandingActions location="features" />
        </div>
      </div>
    </section>
  );
}
