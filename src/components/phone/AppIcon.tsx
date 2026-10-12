import type { ReactNode } from "react";

type IconName = "messages" | "lab" | "gallery" | "calls" | "plans" | "settings" | "toys";

const GLAZE =
  "pointer-events-none absolute inset-0 rounded-[1.15rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.55),transparent_42%,rgba(255,255,255,0.08)_70%,transparent)]";

export function AppIconTile({
  name,
  label,
  compact = false,
  labelClassName = "text-foreground",
}: {
  name: IconName;
  label: string;
  compact?: boolean;
  labelClassName?: string;
}) {
  return (
    <span className={compact ? "flex flex-col items-center gap-1" : "flex flex-col items-center gap-2"}>
      <span
        className={
          compact
            ? "relative grid h-10 w-10 place-items-center overflow-hidden rounded-[0.8rem] shadow-[0_8px_16px_rgba(80,10,40,0.28),inset_0_1px_0_rgba(255,255,255,0.45)]"
            : "relative grid h-[3.35rem] w-[3.35rem] place-items-center overflow-hidden rounded-[1.15rem] shadow-[0_10px_22px_rgba(80,10,40,0.28),inset_0_1px_0_rgba(255,255,255,0.45)]"
        }
        style={{ background: fills[name] }}
      >
        <span className={compact ? "pointer-events-none absolute inset-0 rounded-[0.8rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.55),transparent_42%,rgba(255,255,255,0.08)_70%,transparent)]" : GLAZE} />
        <svg viewBox="0 0 48 48" className={compact ? "relative h-6 w-6 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]" : "relative h-8 w-8 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"} aria-hidden>
          {glyphs[name]}
        </svg>
      </span>
      <span className={compact ? `text-[9px] font-medium tracking-wide ${labelClassName}` : `text-[11px] font-medium tracking-wide ${labelClassName}`}>{label}</span>
    </span>
  );
}

const fills: Record<IconName, string> = {
  messages: "linear-gradient(145deg,#ff4d8d 0%,#c026d3 55%,#7c3aed 100%)",
  lab: "linear-gradient(145deg,#fb7185 0%,#7c3aed 48%,#312e81 100%)",
  gallery: "linear-gradient(145deg,#f9a8d4 0%,#db2777 45%,#4c1d95 100%)",
  calls: "linear-gradient(145deg,#5eead4 0%,#0f766e 40%,#4c1d95 100%)",
  plans: "linear-gradient(145deg,#fde68a 0%,#f43f5e 42%,#6d28d9 100%)",
  settings: "linear-gradient(145deg,#7c3aed 0%,#4c1d95 48%,#1e1b4b 100%)",
  toys: "linear-gradient(145deg,#fda4af 0%,#e11d48 40%,#581c87 100%)",
};

const glyphs: Record<IconName, ReactNode> = {
  messages: (
    <>
      <path d="M10 16c0-3 3-6 8-6h12c5 0 8 3 8 6v8c0 3-3 6-8 6h-6l-6 6v-6h-2c-5 0-8-3-8-6v-8z" fill="white" fillOpacity="0.95" />
      <circle cx="18" cy="20" r="1.4" fill="#7c3aed" />
      <circle cx="24" cy="20" r="1.4" fill="#7c3aed" />
      <circle cx="30" cy="20" r="1.4" fill="#7c3aed" />
    </>
  ),
  lab: (
    <>
      <path d="M18 8h12v6l7 16a8 8 0 0 1-7 10H18a8 8 0 0 1-7-10l7-16V8z" fill="white" />
      <path d="M16 22h16l2 5H14l2-5z" fill="#c026d3" fillOpacity="0.85" />
      <circle cx="24" cy="31" r="2" fill="#fff" />
    </>
  ),
  gallery: (
    <>
      <rect x="8" y="12" width="32" height="24" rx="4" fill="white" />
      <path d="M8 28l8-7 6 5 5-4 13 10v4a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-8z" fill="#db2777" />
      <circle cx="18" cy="19" r="2.2" fill="#f9a8d4" />
    </>
  ),
  calls: (
    <>
      <path
        d="M16 10c2 4 2 6 0 8-2 2 1 6 5 8 4 2 8 1 10-1 2-2 4-2 8 0l2 2c2 3-1 8-6 10-8 3-18-5-22-12-3-6 0-10 3-12l0-3z"
        fill="white"
      />
    </>
  ),
  plans: (
    <>
      <path d="M24 8l3 8h8l-6.5 5 2.5 8L24 24l-7 5 2.5-8L13 16h8l3-8z" fill="white" />
      <path d="M12 36h24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  settings: (
    <path
      fill="white"
      d="M22 6h4l.6 4.2 3.6 1.5 3.2-2.8 2.8 2.8-2.8 3.2 1.5 3.6L40 22v4l-4.2.6-1.5 3.6 2.8 3.2-2.8 2.8-3.2-2.8-3.6 1.5L26 40h-4l-.6-4.2-3.6-1.5-3.2 2.8-2.8-2.8 2.8-3.2-1.5-3.6L8 26v-4l4.2-.6 1.5-3.6-2.8-3.2 2.8-2.8 3.2 2.8 3.6-1.5L22 6zm2 12a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"
    />
  ),
  toys: (
    <>
      <rect x="20" y="8" width="8" height="6" rx="2" fill="white" />
      <path d="M14 16h20a6 6 0 0 1 6 6v8a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8v-8a6 6 0 0 1 6-6z" fill="white" />
      <circle cx="19" cy="26" r="2" fill="#e11d48" />
      <circle cx="29" cy="26" r="2" fill="#e11d48" />
    </>
  ),
};
