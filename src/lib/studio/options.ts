export const STUDIO_STYLES = [
  { id: "photoreal", label: "Photoreal" },
  { id: "cinematic", label: "Cinematic" },
  { id: "boudoir", label: "Boudoir" },
  { id: "semireal", label: "Semi-real" },
  { id: "anime", label: "Anime" },
  { id: "goth", label: "Goth" },
  { id: "fantasy", label: "Fantasy" },
] as const;

export const STUDIO_SCENES = [
  { id: "portrait", label: "Portrait", text: "close portrait, shallow depth of field" },
  { id: "bedroom", label: "Bedroom", text: "in a dim bedroom, warm lamp light" },
  { id: "neon", label: "Neon", text: "neon city night, pink and violet rim light" },
  { id: "rain", label: "Rain", text: "by a rain-streaked window at night" },
  { id: "studio", label: "Studio", text: "photography studio, softbox lighting" },
  { id: "rooftop", label: "Rooftop", text: "on a rooftop at dusk" },
  { id: "couch", label: "Couch", text: "lounging on a velvet couch" },
  { id: "mirror", label: "Mirror", text: "mirror portrait in an elegant room" },
] as const;

export type StudioStyleId = (typeof STUDIO_STYLES)[number]["id"];
