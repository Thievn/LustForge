import type { ReactNode } from "react";
import { AppIconTile } from "@/components/phone/AppIcon";
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";
import { usePhoneBackdrop } from "@/components/landing/phoneBackdrop";
import { cn } from "@/lib/utils";

const IVY = LANDING_LOCAL_PORTRAITS["lilith-vesper"];
const MIRA = LANDING_LOCAL_PORTRAITS["kira-lux"];
const SLOANE = LANDING_LOCAL_PORTRAITS["lena-frost"];
const NOOR = LANDING_LOCAL_PORTRAITS["zara-eclipse"];
const COLE = LANDING_LOCAL_PORTRAITS["kaelen-veyra"];
const REN = LANDING_LOCAL_PORTRAITS["jaxson-voss"];
const EVAN = LANDING_LOCAL_PORTRAITS["tyler-kane"];

function Portrait({ src, className }: { src: string; className?: string }) {
  return <img src={src} alt="" className={cn("object-cover object-[center_18%]", className)} />;
}

export function LandingPhone({
  children,
  label,
  float = false,
  className,
}: {
  children: ReactNode;
  label: string;
  float?: boolean;
  className?: string;
}) {
  const tone = usePhoneBackdrop();
  return (
    <div className={cn("mx-auto w-full max-w-[280px]", float && "lf-float", className)}>
      <div
        className="rounded-[2rem] border border-[#f1c45e]/35 bg-[linear-gradient(180deg,#3a2c38_0%,#120e16_100%)] p-[9px] shadow-[0_28px_70px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.28)]"
        role="img"
        aria-label={label}
      >
        <div className="overflow-hidden rounded-[1.55rem]" style={{ backgroundColor: tone.color, color: tone.ink }}>
          <div className="flex items-center justify-between px-4 pb-1 pt-3 text-[10px]" style={{ color: tone.muted }}>
            <span>9:41</span>
            <span className="h-4 w-14 rounded-full bg-black/70" />
            <span>5G</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LockPhone() {
  const tone = usePhoneBackdrop();
  return (
    <LandingPhone label="Ivy's home screen on a solid color background" float>
      <div className="px-4 pb-5 pt-2">
        <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "#f1c45e" }}>
          LustForge
        </p>
        <p className="mt-1 font-gothic text-[1.65rem] leading-none">Good evening</p>
        <div
          className="mt-4 rounded-2xl border p-3 backdrop-blur-md"
          style={{ backgroundColor: tone.glass, borderColor: tone.line }}
        >
          <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "#f1c45e" }}>
            She is online
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <Portrait src={IVY} className="h-11 w-11 rounded-xl ring-1 ring-[#f1c45e]/50" />
            <div>
              <p className="font-gothic text-lg leading-none">Ivy</p>
              <p className="text-[11px]" style={{ color: tone.muted }}>
                Morning note set for 7:02.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-y-3">
          <AppIconTile compact name="messages" label="Messages" labelClassName="text-current" />
          <AppIconTile compact name="lab" label="Create" labelClassName="text-current" />
          <AppIconTile compact name="gallery" label="Gallery" labelClassName="text-current" />
          <AppIconTile compact name="calls" label="Calls" labelClassName="text-current" />
        </div>
        <div className="mt-4 flex justify-center gap-3">
          <Portrait src={REN} className="h-9 w-9 rounded-full ring-1 ring-white/30" />
          <Portrait src={EVAN} className="h-9 w-9 rounded-full ring-1 ring-white/30" />
          <Portrait src={NOOR} className="h-9 w-9 rounded-full ring-1 ring-white/30" />
        </div>
      </div>
    </LandingPhone>
  );
}

export function ChatPhone() {
  const tone = usePhoneBackdrop();
  return (
    <LandingPhone label="Chat with Mira, including a picture in the thread and a private photo">
      <div className="flex h-[430px] flex-col">
        <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: tone.line }}>
          <Portrait src={MIRA} className="h-8 w-8 rounded-xl" />
          <div>
            <p className="text-sm font-semibold">Mira</p>
            <p className="text-[10px]" style={{ color: "#f1c45e" }}>
              online
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 py-3">
          <p
            className="max-w-[86%] rounded-2xl rounded-bl-md border px-3 py-2 text-[12px] leading-snug"
            style={{ backgroundColor: tone.glass, borderColor: tone.line }}
          >
            Don't tell me you're still at that desk.
          </p>
          <p className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-[linear-gradient(180deg,#ff6fb0,#c2185b)] px-3 py-2 text-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            I left.
          </p>
          <div
            className="max-w-[70%] overflow-hidden rounded-2xl border"
            style={{ borderColor: tone.line, backgroundColor: tone.glass }}
          >
            <Portrait src={MIRA} className="h-28 w-full" />
            <p className="px-2 py-1 text-[10px]" style={{ color: tone.muted }}>
              Picture in the chat
            </p>
          </div>
          <p
            className="w-fit rounded-2xl border px-3 py-2 text-[11px]"
            style={{ backgroundColor: tone.glass, borderColor: tone.line, color: tone.muted }}
          >
            Private photo
          </p>
        </div>
        <div className="mx-3 mb-3 rounded-2xl border px-3 py-2 text-[11px]" style={{ borderColor: tone.line, color: tone.muted }}>
          Message Mira
        </div>
      </div>
    </LandingPhone>
  );
}

export function EditorPhone() {
  const tone = usePhoneBackdrop();
  return (
    <LandingPhone label="Gallery editor for Sloane with Grok Enhance and a pose">
      <div className="flex h-[430px] flex-col px-3 py-3">
        <p className="font-gothic text-2xl">Gallery</p>
        <p className="text-[11px]" style={{ color: tone.muted }}>
          Sloane · saved on your account
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border" style={{ borderColor: tone.line }}>
          <Portrait src={SLOANE} className="h-40 w-full" />
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: "#f1c45e", color: "#f1c45e" }}>
            Pose · look back
          </span>
          <span className="rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: tone.line, color: tone.muted }}>
            Outfit
          </span>
        </div>
        <p className="mt-auto rounded-2xl bg-[linear-gradient(180deg,#ff6fb0,#c2185b)] py-2.5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          Grok Enhance
        </p>
      </div>
    </LandingPhone>
  );
}

export function CreatorPhone() {
  const tone = usePhoneBackdrop();
  const steps = ["Look", "Personality", "Pose", "Name"];
  return (
    <LandingPhone label="Creator wizard naming Noor">
      <div className="flex h-[430px] flex-col px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#f1c45e" }}>
          Create · step 4 of 4
        </p>
        <p className="mt-1 font-gothic text-2xl">Name her</p>
        <div className="mt-3 flex gap-1">
          {steps.map((step) => (
            <span key={step} className="h-1 flex-1 rounded-full bg-[linear-gradient(90deg,#ff6fb0,#e0287f)]" />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: tone.line, backgroundColor: tone.glass }}>
          <Portrait src={NOOR} className="h-16 w-14 rounded-xl" />
          <div>
            <p className="font-gothic text-xl leading-none">Noor</p>
            <p className="mt-1 text-[11px]" style={{ color: tone.muted }}>
              Direct, warm, 24
            </p>
          </div>
        </div>
        <p className="mt-auto rounded-2xl bg-[linear-gradient(180deg,#f1c45e,#b57a2a)] py-2.5 text-center text-sm font-semibold text-[#1B1620] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          Keep Noor
        </p>
      </div>
    </LandingPhone>
  );
}

export function VaultPhone() {
  const tone = usePhoneBackdrop();
  return (
    <LandingPhone label="Velvet Vault card for Cole">
      <div className="flex h-[430px] flex-col px-3 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#f1c45e" }}>
          Velvet Vault
        </p>
        <p className="mt-1 font-gothic text-2xl">A treasure for Cole</p>
        <div className="mt-3 overflow-hidden rounded-2xl border" style={{ borderColor: "#f1c45e55", backgroundColor: tone.glass }}>
          <Portrait src={COLE} className="h-36 w-full" />
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold">Night silk</p>
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#f1c45e" }}>
              Velvet
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Lingerie", "Pose", "Hair"].map((chip) => (
            <span key={chip} className="rounded-full border px-2.5 py-1 text-[11px]" style={{ borderColor: tone.line, color: tone.muted }}>
              {chip}
            </span>
          ))}
        </div>
        <p className="mt-auto rounded-2xl border border-[#f1c45e]/50 py-2.5 text-center text-sm font-semibold" style={{ color: "#f1c45e" }}>
          Unveil a treasure
        </p>
      </div>
    </LandingPhone>
  );
}
