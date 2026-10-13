export type DateScene = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  setting: string;
  tone: string;
  imageHint: string;
  gradient: string;
};

const RAW: Array<[string, string, string, string, string, string, string]> = [
  ["her-apartment", "Her apartment", "Home", "home,night", "her apartment after dark, one lamp, the city quiet", "close and unhurried", "in her apartment at night"],
  ["her-bedroom", "Her bedroom", "Home", "bed,night", "her bedroom, linen, a low lamp", "soft", "in her bedroom"],
  ["her-kitchen", "Late kitchen", "Home", "kitchen", "her kitchen after midnight", "domestic and flirty", "in a dim kitchen"],
  ["her-bath", "The bath", "Home", "bath,steam", "a candlelit bath, mirror fogged", "slow", "in a steamy bathroom"],
  ["her-balcony", "The balcony", "Home", "night,lights", "a small balcony with string lights", "private", "on a balcony at night"],
  ["corner-bar", "Corner bar", "Night out", "bar,drink", "a dim corner bar, one drink between you", "teasing", "in a dim bar"],
  ["hotel-bar", "Hotel bar", "Night out", "hotel,bar", "a hotel bar with low chairs", "polished", "in a hotel bar"],
  ["jazz-room", "Jazz room", "Night out", "music", "a small jazz room, brass and shadow", "slow", "in a jazz club"],
  ["rooftop-bar", "Rooftop bar", "Night out", "rooftop", "a rooftop bar at blue hour", "wind and want", "on a rooftop bar"],
  ["speakeasy", "Speakeasy", "Night out", "hidden", "a hidden bar behind a plain door", "secret", "in a speakeasy"],
  ["night-club", "The edge of the club", "Night out", "dance", "the quieter edge of a night club", "bass, then her voice", "at the edge of a night club"],
  ["diner", "All-night diner", "Night out", "diner", "a neon diner booth at 2am", "honest", "in a late diner booth"],
  ["hotel-room", "Hotel room", "Away", "hotel", "a hotel room, heavy curtains, one lamp", "no schedule", "in a hotel room"],
  ["penthouse", "Penthouse", "Away", "glass,city", "a penthouse, glass, the city underneath", "high and private", "in a penthouse at night"],
  ["cabin", "The cabin", "Away", "fire,woods", "a cabin, a fire, no signal", "unplugged", "in a wood cabin"],
  ["train", "Night train", "Away", "travel", "a private train cabin at night", "the world moving", "in a night train cabin"],
  ["seaside-inn", "Seaside inn", "Away", "sea", "a seaside inn with the window open", "salt air", "in a seaside room"],
  ["empty-beach", "Empty beach", "Outside", "beach,sun", "an empty beach at golden hour", "warm", "on an empty beach"],
  ["night-pool", "Night pool", "Outside", "pool", "a private pool after dark", "wet skin", "at a private pool at night"],
  ["rain-street", "Rain on the street", "Outside", "rain", "a rain-slick street, her coat open", "charged", "on a rainy street at night"],
  ["rooftop", "Just the roof", "Outside", "rooftop", "the roof of her building, no bar, just sky", "honest", "on a rooftop at dusk"],
  ["park-night", "The park after close", "Outside", "park", "a city park after the gates should be shut", "quiet dare", "in a park at night"],
  ["botanical", "Night garden", "Outside", "garden", "a private garden, path lights", "green and close", "in a garden at night"],
  ["pier", "The pier", "Outside", "water", "a wooden pier, water under the boards", "wind", "on a pier at night"],
  ["photo-studio", "The studio", "Rooms", "camera", "a photo studio, softbox, dark backdrop", "she knows the lens", "in a photo studio"],
  ["dressing-room", "Dressing room", "Rooms", "mirror", "a velvet dressing room, bulbs around the mirror", "watched", "in a dressing room"],
  ["library", "After hours", "Rooms", "books", "a library after hours, one green lamp", "whispers ignored", "in a library after hours"],
  ["office", "After the office", "Rooms", "desk", "an office after everyone left", "the door is locked", "in an empty office at night"],
  ["gallery", "Closed gallery", "Rooms", "art", "an art gallery after close", "heels on stone", "in a closed art gallery"],
  ["cinema", "Empty cinema", "Rooms", "screen", "an empty cinema, the film still running", "back row", "in an empty cinema"],
  ["car", "Parked car", "Close quarters", "car", "a parked car, dashboard glow", "the engine is off", "in a parked car at night"],
  ["elevator", "The elevator", "Close quarters", "elevator", "a slow elevator between floors", "too close on purpose", "in a slow elevator"],
  ["stairwell", "The stairwell", "Close quarters", "stairs", "a quiet stairwell, concrete and echo", "stolen minute", "in a stairwell"],
  ["fitting", "The fitting room", "Close quarters", "curtain", "a fitting room, the curtain not quite closed", "try this", "in a fitting room"],
  ["sauna", "The sauna", "Heat", "heat", "a private sauna, wood and steam", "nowhere to hide the look", "in a private sauna"],
  ["onsen", "Private bathhouse", "Heat", "steam", "a private bathhouse, stone and steam", "slow heat", "in a private bath"],
  ["fireplace", "By the fire", "Heat", "fire", "a rug in front of a fire", "the rest of the house can wait", "in front of a fireplace"],
  ["sunroom", "Sunroom", "Day", "sun", "a sunroom in late afternoon", "lazy and golden", "in a sunroom"],
  ["bookstore", "The bookstore", "Day", "books", "a narrow bookstore aisle", "she reads the line out loud", "in a bookstore aisle"],
  ["market", "Evening market", "Day", "city", "an evening street market, lights coming on", "her hand finding yours", "at an evening market"],
  ["vineyard", "The vineyard", "Day", "wine", "a vineyard row at sunset", "a glass, then none", "in a vineyard at sunset"],
  ["boat", "The boat", "Water", "boat", "a small boat after the shore is far", "just the water", "on a small boat at dusk"],
];

export const DATE_SCENES: DateScene[] = RAW.map(([id, title, category, tags, setting, tone, imageHint]) => ({
  id,
  title,
  category,
  tags: tags.split(","),
  setting,
  tone,
  imageHint,
  gradient: "from-[#2a1020] via-[#120810] to-[#1a1030]",
}));

export function searchScenes(query: string, category = "All"): DateScene[] {
  const q = query.trim().toLowerCase();
  return DATE_SCENES.filter((scene) => {
    if (category !== "All" && scene.category !== category) return false;
    if (!q) return true;
    return [scene.title, scene.category, scene.setting, scene.tags.join(" ")].join(" ").toLowerCase().includes(q);
  });
}
