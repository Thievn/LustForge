/** Lab creator controls, ages starting at 21. */

export const CREATOR_STYLES = [
  { id: "photoreal", label: "Photoreal", prefix: "Ultra-realistic photograph, natural skin texture, 85mm lens, sharp focus." },
  { id: "cinematic", label: "Cinematic", prefix: "Cinematic film still, anamorphic lens, dramatic color grading, shallow depth of field." },
  { id: "boudoir", label: "Boudoir Photo", prefix: "Intimate boudoir photography, soft window light, warm tones, tasteful sensual mood." },
  { id: "semireal", label: "Semi-Real", prefix: "Semi-realistic digital painting, stylized shading, solid adult anatomy." },
  { id: "pixar", label: "Pixar Hybrid", prefix: "Stylized 3D animated feature look for a fictional adult, soft global illumination." },
  { id: "render3d", label: "3D Render", prefix: "High-end 3D character render, physically based materials, studio lighting." },
  { id: "anime", label: "Anime", prefix: "anime style, cel shading, vibrant colors, fictional adult" },
  { id: "manga", label: "Manga", prefix: "monochrome manga, screentone, ink lineart, greyscale, fictional adult" },
  { id: "ecchi", label: "Ecchi Anime", prefix: "ecchi anime style, glossy skin, seductive, detailed shading, fictional adult" },
  { id: "comic", label: "Western Comic", prefix: "Western comic book art, bold ink outlines, halftone shading." },
  { id: "oil", label: "Oil Painting", prefix: "Classical oil painting on canvas, visible brushstrokes, chiaroscuro." },
  { id: "watercolor", label: "Watercolor", prefix: "Delicate watercolor illustration, soft bleeding pigments, paper texture." },
  { id: "cyberpunk", label: "Cyberpunk", prefix: "Neon magenta and cyan lighting, rain-slick city, holographic details." },
  { id: "darkfantasy", label: "Dark Fantasy", prefix: "Dark fantasy art, gothic atmosphere, moody candlelight, ornate details." },
  { id: "pinup", label: "Pin-Up", prefix: "Vintage pin-up illustration, glossy airbrushed style, retro palette." },
  { id: "noir", label: "Noir", prefix: "Black and white film noir photograph, hard shadows, smoky high contrast." },
  { id: "vaporwave", label: "Vaporwave", prefix: "Pastel pink and teal gradients, retro glow, chrome accents." },
  { id: "sketch", label: "Sketch", prefix: "Pencil sketch on textured paper, expressive graphite linework." },
  { id: "goth", label: "Goth Editorial", prefix: "Dark fashion editorial photograph, rose and plum tones, dramatic rim light." },
] as const;

export const CREATOR_FIELDS = {
  gender: ["Woman", "Man", "Androgynous", "Trans woman", "Trans man", "Non-binary femme", "Non-binary masc"],
  age: ["Early 20s", "Mid 20s", "Late 20s", "30s", "40s", "50s+"],
  ethnicity: ["Any", "East Asian", "South Asian", "Southeast Asian", "Black", "Latina/Latino", "Middle Eastern", "White / European", "Mixed", "Pacific Islander", "Indigenous"],
  skin: ["Porcelain", "Fair", "Olive", "Golden tan", "Bronze", "Brown", "Deep ebony", "Freckled fair"],
  body: ["Petite (adult)", "Slim", "Athletic", "Toned", "Curvy", "Hourglass", "Thick", "Voluptuous", "Muscular", "Plus-size", "Dad bod"],
  height: ["Short", "Average", "Tall", "Statuesque"],
  hairColor: ["Black", "Brunette", "Chestnut", "Blonde", "Platinum", "Ginger", "Copper red", "Silver", "Pastel pink", "Lilac", "Electric blue", "Emerald", "Two-tone"],
  hairStyle: ["Straight", "Wavy", "Curly", "Coily", "Braids", "Ponytail", "Space buns", "Messy bun", "Bob", "Pixie", "Undercut", "Shaved", "Bangs", "Wolf cut"],
  hairLength: ["Buzzed", "Short", "Shoulder", "Long", "Very long"],
  eyes: ["Brown", "Hazel", "Green", "Blue", "Grey", "Amber", "Violet", "Heterochromia"],
  freckles: ["None", "Light", "Heavy"],
  makeup: ["Natural", "Glam", "Smoky eye", "Goth (dark lips)", "Winged liner", "Glossy lips", "Red lipstick", "None"],
  outfit: ["Lingerie set", "Silk robe", "Oversized hoodie", "Crop top + jeans", "Little black dress", "Corset + skirt", "Office wear", "Gym wear", "Bikini", "Kimono", "Leather jacket", "Towel", "Suit"],
  expression: ["Smile", "Smirk", "Seductive gaze", "Pout", "Laughing", "Shy blush", "Serious", "Biting lip", "Wink"],
  camera: ["Close-up portrait", "Half body", "Full body", "Low angle", "High angle", "POV", "Selfie angle", "From behind"],
  lighting: ["Soft daylight", "Golden hour", "Neon glow", "Candlelight", "Moody low-key", "Studio softbox", "Rim light", "Moonlight"],
  aspect: ["Portrait 832×1216", "Square 1024×1024", "Landscape 1216×832"],
} as const;

export type CreatorLook = {
  style: string;
  gender: string;
  age: string;
  ethnicity: string;
  skin: string;
  body: string;
  height: string;
  hairColor: string;
  hairStyle: string;
  hairLength: string;
  eyes: string;
  freckles: string;
  makeup: string;
  outfit: string;
  expression: string;
  camera: string;
  lighting: string;
  aspect: string;
  custom: string;
};

export const CREATOR_DEFAULTS: CreatorLook = {
  style: "photoreal",
  gender: "Woman",
  age: "Mid 20s",
  ethnicity: "Any",
  skin: "Fair",
  body: "Curvy",
  height: "Average",
  hairColor: "Copper red",
  hairStyle: "Wavy",
  hairLength: "Long",
  eyes: "Green",
  freckles: "Light",
  makeup: "Winged liner",
  outfit: "Lingerie set",
  expression: "Smirk",
  camera: "Half body",
  lighting: "Candlelight",
  aspect: "Portrait 832×1216",
  custom: "",
};

export function creatorDims(aspect: string): { width: number; height: number } {
  if (aspect.startsWith("Square")) return { width: 1024, height: 1024 };
  if (aspect.startsWith("Landscape")) return { width: 1216, height: 832 };
  return { width: 832, height: 1216 };
}

function kept(value: string | undefined) {
  return value && value !== "None" && value !== "Any" ? value : "";
}

export function buildCreatorPrompt(look: CreatorLook, scene: string): string {
  const style = CREATOR_STYLES.find((item) => item.id === look.style) ?? CREATOR_STYLES[0];
  const who = [look.age, kept(look.ethnicity), look.gender.toLowerCase()].filter(Boolean).join(" ");
  const anime = /anime|manga|ecchi/.test(look.style);
  if (anime) {
    const tag = /man|masc/.test(look.gender.toLowerCase()) ? "1boy, solo, adult man, 21+" : "1girl, solo, adult woman, 21+, mature";
    return [style.prefix, tag, look.age.toLowerCase(), `${look.body.toLowerCase()} body`, `${look.hairLength} ${look.hairStyle} ${look.hairColor} hair`.toLowerCase(), `${look.eyes.toLowerCase()} eyes`, look.outfit.toLowerCase(), look.expression.toLowerCase(), scene, look.custom]
      .filter(Boolean)
      .join(", ");
  }
  return [
    style.prefix,
    `A ${who} (adult, 21+), ${look.height.toLowerCase()} height, ${look.body.toLowerCase()} build, ${look.skin.toLowerCase()} skin.`,
    `${look.hairLength} ${look.hairStyle} ${look.hairColor} hair, ${look.eyes} eyes, ${look.freckles.toLowerCase()} freckles, ${look.makeup.toLowerCase()} makeup.`.replace(/\s+/g, " "),
    `Wearing ${look.outfit.toLowerCase()}.`,
    `${look.expression.toLowerCase()} expression.`,
    scene ? `Setting: ${scene}.` : "",
    `${look.camera.toLowerCase()}, ${look.lighting.toLowerCase()} lighting.`,
    look.custom,
  ]
    .filter(Boolean)
    .join(" ");
}
