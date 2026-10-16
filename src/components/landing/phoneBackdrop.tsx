export type PhoneTone = {
  color: string;
  ink: string;
  muted: string;
  glass: string;
  line: string;
};

/** Landing mockups use one fixed screen. In-app phone skins live in `src/lib/phone/skin.ts`. */
export const LANDING_PHONE_BACKGROUND = "#1B1620";

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

export const LANDING_PHONE_TONE: PhoneTone = toneFor(LANDING_PHONE_BACKGROUND);

export function usePhoneBackdrop(): PhoneTone {
  return LANDING_PHONE_TONE;
}
