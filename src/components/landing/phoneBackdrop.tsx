import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const PHONE_COLORS = [
  { id: "wine", label: "Wine", value: "#1B1620" },
  { id: "rose", label: "Rose", value: "#4A1830" },
  { id: "magenta", label: "Magenta", value: "#2C1024" },
  { id: "plum", label: "Plum", value: "#23182E" },
  { id: "gold", label: "Gold", value: "#2A2116" },
  { id: "ink", label: "Ink", value: "#0C0A10" },
] as const;

export type PhoneTone = {
  color: string;
  ink: string;
  muted: string;
  glass: string;
  line: string;
};

function toneFor(color: string): PhoneTone {
  const raw = color.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((part) => part + part).join("") : raw.padEnd(6, "0").slice(0, 6);
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
  if (light) {
    return {
      color,
      ink: "#1B1620",
      muted: "rgba(27,22,32,0.62)",
      glass: "rgba(27,22,32,0.06)",
      line: "rgba(27,22,32,0.14)",
    };
  }
  return {
    color,
    ink: "#F7F1F4",
    muted: "rgba(247,241,244,0.7)",
    glass: "rgba(255,255,255,0.1)",
    line: "rgba(255,255,255,0.16)",
  };
}

type PhoneBackdropValue = PhoneTone & {
  setColor: (value: string) => void;
};

const PhoneBackdropContext = createContext<PhoneBackdropValue | null>(null);

export function LandingPhoneProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<string>(PHONE_COLORS[0].value);
  const value = useMemo(() => ({ ...toneFor(color), setColor }), [color]);
  return <PhoneBackdropContext.Provider value={value}>{children}</PhoneBackdropContext.Provider>;
}

export function usePhoneBackdrop(): PhoneBackdropValue {
  const value = useContext(PhoneBackdropContext);
  if (!value) {
    return { ...toneFor(PHONE_COLORS[0].value), setColor: () => {} };
  }
  return value;
}

export function PhoneColorPicker({ className }: { className?: string }) {
  const { color, setColor } = usePhoneBackdrop();
  return (
    <fieldset className={className}>
      <legend className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#f1c45e]">Phone background</legend>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PHONE_COLORS.map((swatch) => {
          const selected = color.toLowerCase() === swatch.value.toLowerCase();
          return (
            <button
              key={swatch.id}
              type="button"
              aria-label={swatch.label}
              aria-pressed={selected}
              onClick={() => setColor(swatch.value)}
              className="h-9 w-9 rounded-full border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1c45e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B1620] motion-safe:hover:scale-105 motion-reduce:transform-none"
              style={{
                backgroundColor: swatch.value,
                borderColor: selected ? "#f1c45e" : "rgba(255,255,255,0.2)",
                boxShadow: selected ? "0 0 0 2px rgba(241,196,94,0.35)" : "inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            />
          );
        })}
        <label className="relative h-9 w-9 overflow-hidden rounded-full border border-[#f1c45e]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
          <span className="sr-only">Custom background color</span>
          <input
            type="color"
            value={color}
            aria-label="Custom background color"
            onChange={(event) => setColor(event.target.value)}
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>
    </fieldset>
  );
}
