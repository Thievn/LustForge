export const LOVENSE_CARD_W = 1200;
export const LOVENSE_CARD_H = 675;
export const LOVENSE_CARD_ASPECT = LOVENSE_CARD_W / LOVENSE_CARD_H;

export const LOVENSE_NEON = "#FF2D7B";
export const LOVENSE_BG_START = "#0a0610";
export const LOVENSE_BG_MID = "#140818";
export const LOVENSE_BG_END = "#0a0610";

export const LOVENSE_CARD_BG = `linear-gradient(135deg, ${LOVENSE_BG_START} 0%, ${LOVENSE_BG_MID} 45%, ${LOVENSE_BG_END} 100%)`;

export const LOVENSE_GLOW_STYLE = {
  background:
    "radial-gradient(ellipse 55% 70% at 72% 35%, rgba(255,45,123,0.35), transparent 70%)",
} as const;
