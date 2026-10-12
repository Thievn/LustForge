import type { ReactNode } from "react";
import { AppIconTile } from "@/components/phone/AppIcon";
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";
import { cn } from "@/lib/utils";

const IVY = LANDING_LOCAL_PORTRAITS["lilith-vesper"];
const TILES = [
  LANDING_LOCAL_PORTRAITS["kira-lux"],
  LANDING_LOCAL_PORTRAITS["zara-eclipse"],
  LANDING_LOCAL_PORTRAITS["lena-frost"],
  LANDING_LOCAL_PORTRAITS["kaelen-veyra"],
  LANDING_LOCAL_PORTRAITS["tyler-kane"],
  LANDING_LOCAL_PORTRAITS["jaxson-voss"],
];

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
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.8rem] border border-white/15 bg-[#120910] text-white shadow-[0_30px_80px_hsl(var(--primary)/0.22)]",
        float && "lf-float",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[10px] text-white/70">
        <span>9:41</span>
        <span className="h-4 w-16 rounded-full bg-black/50" />
        <span>5G</span>
      </div>
      {children}
    </div>
  );
}

export function LockPhone() {
  return (
    <LandingPhone label="Lock screen with Ivy's text" float>
      <div className="relative h-[460px]">
        <img src={IVY} alt="" className="lf-kenburns absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/80" />
        <div className="relative px-5 pt-6">
          <p className="text-center text-xs text-white/80">Monday, October 12</p>
          <p className="mt-1 text-center font-gothic text-5xl text-white">9:41</p>
          <div className="mt-8 rounded-[1.2rem] border border-white/25 bg-white/15 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <img src={IVY} alt="" className="h-9 w-9 rounded-xl object-cover ring-2 ring-white/70" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">Ivy</p>
                  <time className="text-[10px] text-white/75">now</time>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-white/90">Don't tell me you're still at that desk.</p>
              </div>
            </div>
          </div>
        </div>
        <p className="absolute inset-x-0 bottom-5 text-center text-[10px] uppercase tracking-[0.2em] text-white/80">Tap to open her thread</p>
      </div>
    </LandingPhone>
  );
}

export function HomePhone() {
  return (
    <LandingPhone label="Phone home with Ivy's wallpaper and app icons">
      <div className="relative min-h-[540px] pb-4">
        <img src={IVY} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#120910]/75 to-[#120910]" />
        <div className="relative px-4 pt-2">
          <p className="text-[9px] uppercase tracking-[0.22em] text-[#ff4d8d]">LustForge</p>
          <p className="font-gothic text-2xl">Good evening</p>
          <div className="mt-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
            <p className="text-[9px] uppercase tracking-[0.18em] text-[#ff8ab3]">She is online</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="lf-presence relative h-11 w-11 overflow-hidden rounded-xl">
                <img src={IVY} alt="" className="h-full w-full object-cover" />
              </span>
              <div>
                <p className="font-gothic text-lg leading-none">Ivy</p>
                <p className="text-[11px] text-white/75">Morning text set for 7:02.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-y-3">
            <AppIconTile compact name="messages" label="Messages" labelClassName="text-white" />
            <AppIconTile compact name="lab" label="Lab" labelClassName="text-white" />
            <AppIconTile compact name="gallery" label="Gallery" labelClassName="text-white" />
            <AppIconTile compact name="calls" label="Calls" labelClassName="text-white" />
            <AppIconTile compact name="plans" label="Plans" labelClassName="text-white" />
            <AppIconTile compact name="settings" label="Settings" labelClassName="text-white" />
            <AppIconTile compact name="toys" label="Toys" labelClassName="text-white" />
          </div>
        </div>
      </div>
    </LandingPhone>
  );
}

export function ChatPhone() {
  return (
    <LandingPhone label="Chat thread with typing dots and a photo on the way">
      <div className="flex h-[460px] flex-col bg-[#140910]">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <img src={IVY} alt="" className="h-8 w-8 rounded-xl object-cover" />
          <div>
            <p className="text-sm font-semibold">Ivy</p>
            <p className="text-[10px] text-[#5eead4]">online</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 py-3">
          <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/10 px-3 py-2 text-[12px] leading-snug">
            Don't tell me you're still at that desk.
          </p>
          <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#ff2d7b] px-3 py-2 text-[12px] text-white">I left.</p>
          <div className="max-w-[85%] rounded-2xl border border-dashed border-[#ff2d7b]/40 bg-[#ff2d7b]/10 p-2">
            <div className="h-24 rounded-xl bg-[radial-gradient(circle_at_40%_30%,#ff4d8d,#4c1d95_70%)] opacity-80" />
            <p className="mt-1 text-center text-[10px] text-[#ff8ab3]">Ivy is sending a photo…</p>
          </div>
          <div className="flex w-fit items-center gap-1 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
            <span className="lf-dot h-1.5 w-1.5 rounded-full bg-white" />
            <span className="lf-dot h-1.5 w-1.5 rounded-full bg-white" />
            <span className="lf-dot h-1.5 w-1.5 rounded-full bg-white" />
          </div>
        </div>
        <div className="mx-3 mb-3 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] text-white/45">Message Ivy</div>
      </div>
    </LandingPhone>
  );
}

const LAB_STEPS = ["Look", "Voice", "Attitude", "Style", "Name"];
const STYLES = ["Photo", "Paint", "Ink", "Neon"];

export function LabPhone() {
  return (
    <LandingPhone label="Lab create flow on style">
      <div className="flex h-[460px] flex-col bg-[#140910] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#ff8ab3]">Lab · step 4 of 5</p>
        <p className="mt-1 font-gothic text-2xl">How should she look?</p>
        <div className="mt-3 flex gap-1">
          {LAB_STEPS.map((step, index) => (
            <span key={step} className={index <= 3 ? "h-1 flex-1 rounded-full bg-[#ff2d7b]" : "h-1 flex-1 rounded-full bg-white/15"} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {STYLES.map((style) => (
            <div
              key={style}
              className={
                style === "Neon"
                  ? "rounded-2xl border border-[#ff2d7b] bg-[#ff2d7b]/15 px-3 py-4 text-sm"
                  : "rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-white/80"
              }
            >
              {style}
              {style === "Neon" ? <p className="text-[10px] text-[#ff8ab3]">picked</p> : null}
            </div>
          ))}
        </div>
        <p className="mt-auto rounded-2xl bg-[#ff2d7b] py-2.5 text-center text-sm font-semibold">Next: name her</p>
      </div>
    </LandingPhone>
  );
}

export function CallPhone() {
  return (
    <LandingPhone label="Live call with Ivy">
      <div className="relative flex h-[460px] flex-col items-center justify-between py-8">
        <img src={IVY} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#1a0a14]/70 to-black" />
        <div className="relative text-center">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#5eead4]">Live call</p>
          <p className="mt-1 font-gothic text-3xl">Ivy</p>
          <p className="text-sm text-white/80">00:42</p>
        </div>
        <span className="lf-presence relative h-28 w-28 overflow-hidden rounded-[1.6rem] ring-2 ring-white/70">
          <img src={IVY} alt="" className="h-full w-full object-cover" />
        </span>
        <div className="relative flex gap-3">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">Mute</span>
          <span className="rounded-full bg-[#ff2d7b] px-4 py-2 text-xs font-semibold">End</span>
        </div>
      </div>
    </LandingPhone>
  );
}

export function GalleryPhone() {
  return (
    <LandingPhone label="Private gallery of saved pictures">
      <div className="h-[460px] bg-[#140910] px-3 py-3">
        <p className="font-gothic text-2xl">Gallery</p>
        <p className="text-[11px] text-white/70">Ivy · saved on your account</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {TILES.map((src) => (
            <img key={src} src={src} alt="" className="aspect-[3/4] w-full rounded-lg object-cover" />
          ))}
        </div>
      </div>
    </LandingPhone>
  );
}
