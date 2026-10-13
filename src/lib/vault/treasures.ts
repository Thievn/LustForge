import { POSE_SET } from "../../../supabase/functions/_shared/studioPoseIds";
import type { VaultRarity } from "../../../supabase/functions/_shared/vaultDraw";

export type { VaultRarity };
export type VaultCategory = "lingerie" | "swim" | "night" | "costume" | "accessory" | "scene" | "pose" | "hair" | "mood";
export type TreasureSlot = "outfit" | "accessory" | "scene" | "pose" | "hair" | "mood";

export type TreasureSeed = {
  id: string;
  name: string;
  kind: VaultCategory;
  slot: TreasureSlot;
  rarity: VaultRarity;
  weight: number;
  neutral: string;
  poseId?: string;
  blurb: string;
  isNew: boolean;
};

export const SLOT_OF: Record<VaultCategory, TreasureSlot> = {
  lingerie: "outfit",
  swim: "outfit",
  night: "outfit",
  costume: "outfit",
  accessory: "accessory",
  scene: "scene",
  pose: "pose",
  hair: "hair",
  mood: "mood",
};

export const VAULT_CATEGORIES: Array<{ id: VaultCategory; label: string }> = [
  { id: "lingerie", label: "Lingerie" },
  { id: "swim", label: "Swim & Summer" },
  { id: "night", label: "Night Out" },
  { id: "costume", label: "Roleplay Costumes" },
  { id: "accessory", label: "Accessories" },
  { id: "scene", label: "Scenes & Places" },
  { id: "pose", label: "Poses" },
  { id: "hair", label: "Hair & Makeup" },
  { id: "mood", label: "Moods & Lighting" },
];

export const CATEGORY_REWARDS: Record<VaultCategory, { title: string; badge: string }> = {
  lingerie: { title: "Keeper of her drawer", badge: "Lace key" },
  swim: { title: "Salt still on her", badge: "Tide" },
  night: { title: "She dressed for you", badge: "After dark" },
  costume: { title: "Every part she plays", badge: "Mask" },
  accessory: { title: "The small things", badge: "Clasp" },
  scene: { title: "Places she takes you", badge: "Key" },
  pose: { title: "She knows the angle", badge: "Frame" },
  hair: { title: "How she woke", badge: "Comb" },
  mood: { title: "The light she keeps", badge: "Flame" },
};

export const RARITY_SPLIT: Record<VaultRarity, number> = {
  silk: 63,
  satin: 43,
  velvet: 18,
  forbidden: 16,
  obsession: 10,
};

export const CATEGORY_SPLIT: Record<VaultCategory, Record<VaultRarity, number>> = {
  lingerie: { silk: 12, satin: 10, velvet: 4, forbidden: 4, obsession: 2 },
  swim: { silk: 8, satin: 6, velvet: 2, forbidden: 2, obsession: 1 },
  night: { silk: 7, satin: 5, velvet: 2, forbidden: 2, obsession: 1 },
  costume: { silk: 6, satin: 5, velvet: 2, forbidden: 2, obsession: 1 },
  accessory: { silk: 8, satin: 4, velvet: 1, forbidden: 1, obsession: 1 },
  scene: { silk: 6, satin: 4, velvet: 2, forbidden: 1, obsession: 1 },
  pose: { silk: 6, satin: 4, velvet: 2, forbidden: 2, obsession: 1 },
  hair: { silk: 5, satin: 3, velvet: 2, forbidden: 1, obsession: 1 },
  mood: { silk: 5, satin: 2, velvet: 1, forbidden: 1, obsession: 1 },
};

function row(
  id: string,
  name: string,
  kind: VaultCategory,
  rarity: VaultRarity,
  neutral: string,
  blurb: string,
  poseId?: string,
): TreasureSeed {
  return {
    id,
    name,
    kind,
    slot: SLOT_OF[kind],
    rarity,
    weight: 1,
    neutral,
    blurb,
    poseId,
    isNew: rarity === "obsession",
  };
}

export const TREASURES: TreasureSeed[] = [
  row("ling-black-set", "Black lace set", "lingerie", "silk", "a black lace bra, a matching thong, and sheer black stockings on a fictional adult", "The set she reaches for when the evening starts."),
  row("ling-ivory", "Ivory balconette", "lingerie", "silk", "an ivory balconette bra and a high-cut lace brief on a fictional adult", "Soft color. She is not soft about it."),
  row("ling-red-thong", "Red thong", "lingerie", "silk", "a red satin thong and a simple matching bra on a fictional adult", "A small piece of red. She knows the effect."),
  row("ling-wine", "Wine underwire", "lingerie", "silk", "a wine-colored underwire bra with thin straps and a matching brief on a fictional adult", "Deep color against skin."),
  row("ling-white", "White lace set", "lingerie", "silk", "a white lace bra and thong on a fictional adult", "Clean white. Not innocent."),
  row("ling-rose", "Rose bralette", "lingerie", "silk", "a dusty-rose lace bralette and matching boyshort on a fictional adult", "The color of a held breath."),
  row("ling-navy", "Navy balconette", "lingerie", "silk", "a navy balconette bra and a simple thong on a fictional adult", "Quiet cut. Loud result."),
  row("ling-blush", "Blush brief", "lingerie", "silk", "a blush-pink bra and a soft brief on a fictional adult", "She wears it under a dress you will not see."),
  row("ling-midnight", "Midnight set", "lingerie", "silk", "a midnight-blue lace bra and thong on a fictional adult", "Dark enough to disappear. Not on her."),
  row("ling-nude", "Nude underwire", "lingerie", "silk", "a nude underwire bra and a seamless thong on a fictional adult", "Meant to vanish under clothes. It does not vanish on her."),
  row("ling-cherry", "Cherry balconette", "lingerie", "silk", "a cherry-red balconette bra and a matching thong on a fictional adult", "She saves it for nights with a plan."),
  row("ling-dove", "Dove grey set", "lingerie", "silk", "a dove-grey lace bra and high-cut brief on a fictional adult", "Pale lace, warm skin."),
  row("ling-garter", "Garter and seams", "lingerie", "satin", "a black garter belt clipped to seamed stockings, with a thong, on a fictional adult", "The clips sit exactly where she wants your eyes."),
  row("ling-plum", "Plum teddy", "lingerie", "satin", "a plum lace teddy with a low back on a fictional adult", "One piece. An easy yes."),
  row("ling-slip", "Satin slip", "lingerie", "satin", "a short champagne satin slip worn as lingerie on a fictional adult", "It moves when she does."),
  row("ling-leopard", "Leopard trim", "lingerie", "satin", "a black lingerie set with a narrow leopard-print trim on a fictional adult", "A little wild. Still tailored."),
  row("ling-red-garter", "Red garter set", "lingerie", "satin", "a red bra, a thong, and a red garter belt on a fictional adult", "She dresses like the night already agreed."),
  row("ling-high-leg", "High-leg lace", "lingerie", "satin", "a high-leg black lace bodysuit on a fictional adult", "Long lines. Very little left to guess."),
  row("ling-bralette", "Lace bralette set", "lingerie", "satin", "a black lace bralette set with a matching thong on a fictional adult", "Soft cups. A hard look."),
  row("ling-babydoll", "Sheer babydoll", "lingerie", "satin", "a sheer black babydoll over a thong on a fictional adult", "The hem barely behaves."),
  row("ling-cage", "Strappy cage bra", "lingerie", "satin", "a strappy cage bra and a thong on a fictional adult", "Lines, and the skin between them."),
  row("ling-cami", "Silk camisole", "lingerie", "satin", "a short black silk camisole and a thong on a fictional adult", "Sleepwear she is not wearing to sleep."),
  row("ling-emerald", "Emerald bodysuit", "lingerie", "velvet", "an emerald satin bodysuit with a deep neckline on a fictional adult", "The color she wears when she wants to be looked at."),
  row("ling-chain", "Gold chain hips", "lingerie", "velvet", "a black lingerie set with a fine gold chain resting on the hips of a fictional adult", "The chain moves when she walks."),
  row("ling-corset", "Waspie corset", "lingerie", "velvet", "a black waspie corset over a thong and stockings on a fictional adult", "Cinched, then left that way."),
  row("ling-mesh", "Mesh bodysuit", "lingerie", "velvet", "a sheer black mesh bodysuit on a fictional adult", "You can see the shape of her through it."),
  row("ling-cutout", "Hip cutouts", "lingerie", "forbidden", "a black bodysuit with hip cutouts on a fictional adult", "Skin where the fabric refuses to be."),
  row("ling-harness", "Strap harness", "lingerie", "forbidden", "a black strap harness worn over bare skin on a fictional adult", "Lines. Nothing else required."),
  row("ling-suspenders", "Corset and suspenders", "lingerie", "forbidden", "a black corset with suspenders clipped to stockings on a fictional adult", "She fastens the last clip slowly."),
  row("ling-crotchless", "Crotchless lace", "lingerie", "forbidden", "a crotchless black lace set on a fictional adult", "She does not pretend this is subtle."),
  row("ling-ruby", "Midnight Ruby", "lingerie", "obsession", "a jeweled black bodystocking with ruby-colored stones on a fictional adult", "The piece she does not lend. Not even to the mirror."),
  row("ling-second", "Diamond Second Skin", "lingerie", "obsession", "a sheer second-skin bodysuit traced with tiny clear stones on a fictional adult", "Almost nothing. Then the stones catch."),

  row("swim-black", "Black bikini", "swim", "silk", "a simple black two-piece bikini on a fictional adult", "Classic. It still stops a room."),
  row("swim-olive", "Olive one-piece", "swim", "silk", "an olive one-piece with a low back on a fictional adult", "Sporty until she turns."),
  row("swim-high", "High-cut black", "swim", "silk", "a high-cut black swimsuit on a fictional adult", "Long leg. Short patience."),
  row("swim-teal", "Teal string", "swim", "silk", "a teal string bikini on a fictional adult", "The ties are the whole conversation."),
  row("swim-print", "Dark tropical", "swim", "silk", "a dark tropical-print bikini on a fictional adult", "A vacation, even if you never leave."),
  row("swim-navy", "Navy sport", "swim", "silk", "a navy sporty two-piece on a fictional adult", "She swam. Then she stayed."),
  row("swim-rust", "Rust triangle", "swim", "silk", "a rust-colored triangle bikini on a fictional adult", "Warm color, bare shoulders."),
  row("swim-tank", "Cream tankini", "swim", "silk", "a cream tankini with a high leg on a fictional adult", "Covered, until the wind moves it."),
  row("swim-red", "Red bandeau", "swim", "satin", "a red bandeau bikini on a fictional adult", "She ties it like she means it."),
  row("swim-crochet", "Open crochet", "swim", "satin", "a cream crochet cover-up worn open over a bikini on a fictional adult", "The cover-up is not covering much."),
  row("swim-sarong", "Wet sarong", "swim", "satin", "a sheer sarong clinging over a bikini on a fictional adult", "The water did half the work."),
  row("swim-ivory", "Ivory plunge", "swim", "satin", "an ivory one-piece with a plunging front on a fictional adult", "Old glamour, new intentions."),
  row("swim-white", "White string", "swim", "satin", "a white string bikini on a fictional adult", "Sun, water, and very little fabric."),
  row("swim-ring", "Gold ring bikini", "swim", "satin", "a black bikini joined by a small gold ring at the center on a fictional adult", "One ring. All the attention."),
  row("swim-micro", "Micro black", "swim", "velvet", "a minimal black bikini on a fictional adult", "Barely a swimsuit. Entirely a decision."),
  row("swim-mono", "Cutout monokini", "swim", "velvet", "a black monokini with side cutouts on a fictional adult", "One piece, and still not enough fabric."),
  row("swim-gold", "Gold string", "swim", "forbidden", "a barely-there gold string bikini on a fictional adult", "Ties at the hips. Nothing else to negotiate."),
  row("swim-bare", "Barely-there white", "swim", "forbidden", "a minimal white string bikini on a fictional adult", "The ties are doing all the work."),
  row("swim-blackwater", "Blackwater String", "swim", "obsession", "a black string bikini with a wet sheen on a fictional adult", "She walks out of the water and does not reach for a towel."),

  row("night-bodycon", "Black bodycon", "night", "silk", "a black bodycon mini dress on a fictional adult", "It learns her shape and keeps it."),
  row("night-slip", "Slip dress", "night", "silk", "a short black slip dress on a fictional adult", "One layer. She knows."),
  row("night-cami", "Satin cami dress", "night", "silk", "a short satin cami dress on a fictional adult", "Club light likes this fabric."),
  row("night-lbd", "Little black dress", "night", "silk", "a fitted little black dress on a fictional adult", "The dress that ends the argument about what to wear."),
  row("night-wrap", "Wine wrap", "night", "silk", "a wine-colored wrap dress tied at the waist on a fictional adult", "The knot is a suggestion."),
  row("night-column", "Column gown", "night", "silk", "a floor-length black column dress with a thigh slit on a fictional adult", "She takes the stairs slowly."),
  row("night-blazer", "Blazer dress", "night", "silk", "a black blazer dress and nothing under it on a fictional adult", "The buttons stop where she decides."),
  row("night-backless", "Backless dress", "night", "satin", "a backless black mini dress on a fictional adult", "You see the whole decision from behind."),
  row("night-sequin", "Sequin mini", "night", "satin", "a short black sequin dress on a fictional adult", "She catches every light on purpose."),
  row("night-column-silk", "Silk column", "night", "satin", "a bias-cut silk column dress on a fictional adult", "It pours when she walks."),
  row("night-shoulder", "One shoulder", "night", "satin", "a one-shoulder black mini dress on a fictional adult", "One bare shoulder is the whole point."),
  row("night-slit", "Thigh slit", "night", "satin", "a black dress with a high thigh slit on a fictional adult", "The slit opens when she sits."),
  row("night-leather", "Leather mini", "night", "velvet", "a black leather mini dress on a fictional adult", "It creaks when she crosses her legs."),
  row("night-cutout-dress", "Cutout bodycon", "night", "velvet", "a black bodycon with waist cutouts on a fictional adult", "Skin at the waist. Eyes follow."),
  row("night-latex", "Latex dress", "night", "forbidden", "a glossy black latex mini dress on a fictional adult", "It shines like she planned the light."),
  row("night-sheer", "Sheer gown", "night", "forbidden", "a sheer black evening gown over a thong on a fictional adult", "Formal, and not modest."),
  row("night-oil", "Oil-Slick Backless", "night", "obsession", "a backless oil-black mini dress with a liquid shine on a fictional adult", "She turns, and the room forgets the music."),

  row("cos-nurse", "Night nurse", "costume", "silk", "a short white nurse costume on a fictional adult", "The shift she invents for you."),
  row("cos-maid", "French maid", "costume", "silk", "a short black maid costume with a white apron on a fictional adult", "She curtsies once. Then she does not."),
  row("cos-teacher", "After class", "costume", "silk", "a pencil skirt, a tucked blouse, and glasses on a fictional adult", "The lesson is over. She is not."),
  row("cos-bunny", "Bunny", "costume", "silk", "a black bunny costume with ears and a bow tie on a fictional adult", "Ears, a cuff, and a look."),
  row("cos-cop", "Off duty", "costume", "silk", "a cropped cop costume and a toy badge on a fictional adult", "She is not here to write a ticket."),
  row("cos-angel", "Fallen angel", "costume", "silk", "a white slip and small feathered wings on a fictional adult", "The halo did not survive the night."),
  row("cos-devil", "Little devil", "costume", "satin", "a red devil costume with small horns on a fictional adult", "She brings the pitchfork as a joke. Mostly."),
  row("cos-cheer", "Sideline", "costume", "satin", "a short cheer costume on a fictional adult", "The chant is private."),
  row("cos-secretary", "After five", "costume", "satin", "a tight secretary blouse and a pencil skirt on a fictional adult", "The office is empty. She is not."),
  row("cos-pilot", "Red-eye", "costume", "satin", "a cropped pilot costume with a cap on a fictional adult", "The seatbelt sign is off."),
  row("cos-kitten", "Kitten", "costume", "satin", "a black kitten costume with ears and a tail on a fictional adult", "She only answers to the name you pick."),
  row("cos-domme", "Dominatrix", "costume", "velvet", "a black dominatrix corset, gloves, and boots on a fictional adult", "She points. You understand."),
  row("cos-thief", "Cat burglar", "costume", "velvet", "a sleek black cat-burglar catsuit on a fictional adult", "She came in through the window she told you about."),
  row("cos-mistress", "Leather mistress", "costume", "forbidden", "a leather mistress harness and boots on a fictional adult", "The room gets quieter when she enters."),
  row("cos-bride", "Veil bride", "costume", "forbidden", "a sheer bridal veil, a garter, and lingerie on a fictional adult", "The ceremony was a rumor. This is the night."),
  row("cos-succubus", "Succubus Queen", "costume", "obsession", "a succubus queen costume, dark horns, a jeweled harness, and a short cape on a fictional adult", "She does not knock. She arrives."),

  row("acc-choker", "Velvet choker", "accessory", "silk", "a narrow black velvet choker on a fictional adult", "It sits where a kiss would."),
  row("acc-hoops", "Gold hoops", "accessory", "silk", "small gold hoop earrings on a fictional adult", "A flash when she turns her head."),
  row("acc-anklet", "Fine anklet", "accessory", "silk", "a fine gold anklet on a fictional adult", "You notice it when her legs cross."),
  row("acc-ears", "Cat ears", "accessory", "silk", "a slim black cat-ear headband on a fictional adult", "She wears them like they were always hers."),
  row("acc-fishnet", "Fishnets", "accessory", "silk", "black fishnet stockings on a fictional adult", "The pattern is the invitation."),
  row("acc-glitter", "Body glitter", "accessory", "silk", "a dusting of body glitter on the collarbones of a fictional adult", "You find it on your hands later."),
  row("acc-watch", "Slim watch", "accessory", "silk", "a slim gold watch on a fictional adult", "She is not in a hurry. The watch knows."),
  row("acc-garter", "Garter band", "accessory", "silk", "a single black lace garter on one thigh of a fictional adult", "One band. You know which thigh."),
  row("acc-boots", "Thigh-high boots", "accessory", "satin", "black thigh-high boots on a fictional adult", "You hear her in the hall."),
  row("acc-heels", "Barely-there heels", "accessory", "satin", "black barely-there heels on a fictional adult", "You hear her before you see the dress."),
  row("acc-pearls", "Pearl drops", "accessory", "satin", "pearl drop earrings on a fictional adult", "Quiet jewelry. She is not quiet."),
  row("acc-waist", "Waist chain", "accessory", "satin", "a delicate gold waist chain on a fictional adult", "It moves when she breathes."),
  row("acc-gloves", "Opera gloves", "accessory", "velvet", "long black opera gloves on a fictional adult", "Bare shoulders. Covered arms. Unfair."),
  row("acc-leash", "Leash collar", "accessory", "forbidden", "a slim collar with a short leash resting in her hand, on a fictional adult", "She holds the end. She decides who takes it."),
  row("acc-ruby", "Ruby Heart Collar", "accessory", "obsession", "a black collar with a ruby heart at the throat of a fictional adult", "It sits like a promise she expects you to keep."),

  row("sc-apartment", "Her apartment", "scene", "silk", "in her apartment at night, one warm lamp, the city quiet outside", "The place that already knows you."),
  row("sc-bedroom", "Her bedroom", "scene", "silk", "in her bedroom, low lamp, linen, the door half closed", "The room she texts you from."),
  row("sc-kitchen", "Late kitchen", "scene", "silk", "in a dim kitchen after midnight, one light over the counter", "Wine, a counter, no audience."),
  row("sc-beach", "Empty beach", "scene", "silk", "on an empty beach at golden hour", "The water is loud. She is not."),
  row("sc-balcony", "String-light balcony", "scene", "silk", "on a small balcony with string lights at night", "The neighbors cannot see her face."),
  row("sc-studio", "Softbox studio", "scene", "silk", "in a photo studio with a softbox and a dark backdrop", "She knows the camera is on."),
  row("sc-bath", "Candle bath", "scene", "satin", "in a candlelit bathroom, steam on the mirror", "She left the door unlocked."),
  row("sc-roof", "Dusk rooftop", "scene", "satin", "on a rooftop at dusk as the city lights come on", "Wind, height, and her."),
  row("sc-rain", "Rain window", "scene", "satin", "beside a rain-streaked window at night", "The city blurs. She does not."),
  row("sc-pool", "Night pool", "scene", "satin", "at the edge of a private pool at night", "Water on her skin. Lights under it."),
  row("sc-hotel", "Hotel lamp", "scene", "velvet", "in a hotel room with heavy curtains and one lamp", "A key. A night. No small talk required."),
  row("sc-mirror", "Dressing-room mirror", "scene", "velvet", "in a dressing room with bulbs around the mirror", "She watches you watch her."),
  row("sc-booth", "Private booth", "scene", "forbidden", "in a private club booth, low light, the curtain half drawn", "The room outside can wait."),
  row("sc-penthouse", "Her Penthouse at Midnight", "scene", "obsession", "in her penthouse at midnight, floor-to-ceiling glass, the city far below", "The city is the backdrop. She is the point."),

  row("pose-hips", "Weight on one hip", "pose", "silk", "standing with weight on one hip, a hand resting there, fictional adult", "The pose that starts the evening.", "stand_hips"),
  row("pose-hair", "Hand in her hair", "pose", "silk", "standing, one hand in her hair, fictional adult", "She does this when she wants you closer.", "stand_hair"),
  row("pose-couch", "Across the couch", "pose", "silk", "lounging across a couch, fictional adult", "She made room. Then she took it back.", "couch_lounge"),
  row("pose-selfie", "Bed selfie", "pose", "silk", "a high selfie angle from the bed, fictional adult", "The photo she sends before you ask.", "selfie_bed"),
  row("pose-stomach", "On her stomach", "pose", "silk", "lying on her stomach, chin on her hands, fictional adult", "She kicks one foot and waits.", "bed_stomach"),
  row("pose-wave", "Soft wave", "pose", "silk", "standing and lifting one hand in a small wave, fictional adult", "She sees you before you see her.", "out_wave"),
  row("pose-bed", "On her back", "pose", "satin", "lying on her back on a bed, one knee bent, fictional adult", "The sheet is a suggestion.", "bed_lie_back"),
  row("pose-wall", "Against the wall", "pose", "satin", "back against a wall, chin lifted, fictional adult", "Nowhere to step but toward her.", "wall_back"),
  row("pose-shower", "Under the water", "pose", "satin", "in a shower, hands in wet hair, fictional adult", "Steam, tile, and her.", "shower_hair"),
  row("pose-lip", "Finger on her lip", "pose", "satin", "a finger resting on her lower lip, fictional adult", "She is deciding whether to say it.", "t_finger_lip"),
  row("pose-squat", "Eyes up", "pose", "velvet", "a slow squat, eyes lifted, fictional adult", "She holds it. You do not.", "squat"),
  row("pose-chair", "The chair", "pose", "velvet", "seated in a chair, knees apart, fictional adult", "She points at the space in front of her.", "sit_chair_spread"),
  row("pose-fours", "Look back", "pose", "forbidden", "on hands and knees, looking back over a shoulder, fictional adult", "She wants to see your face.", "fours_lookback"),
  row("pose-arch", "Long arch", "pose", "forbidden", "a long floor stretch, back arched, fictional adult", "She calls it a stretch. You both know.", "yoga_cobra"),
  row("pose-tease", "The Tease", "pose", "obsession", "looking back over her shoulder with a hand on her hip, fictional adult", "She gives you the glance and waits to see if you deserve the rest.", "t_lookback_hip"),

  row("hair-waves", "Loose waves", "hair", "silk", "loose waves of hair over one shoulder of a fictional adult", "She shook it out and left it."),
  row("hair-bun", "Low bun", "hair", "silk", "a low loose bun with a few strands free on a fictional adult", "Put up, then undone on purpose."),
  row("hair-pony", "Sleek ponytail", "hair", "silk", "a sleek high ponytail on a fictional adult", "Clean, and a little severe."),
  row("hair-curls", "Soft curls", "hair", "silk", "soft curls framing the face of a fictional adult", "They move when she laughs."),
  row("hair-bare", "Bare-face glow", "hair", "silk", "clean skin with a soft glow and simple hair on a fictional adult", "No armor. Just her."),
  row("hair-wet", "Wet hair", "hair", "satin", "wet hair slicked back from the face of a fictional adult", "She did not dry it. She came to find you."),
  row("hair-smoky", "Smoky eye", "hair", "satin", "a smoky eye and brushed brows on a fictional adult", "The look she does when the night has a plan."),
  row("hair-lips", "Red lips", "hair", "satin", "a precise red lip on a fictional adult", "She checks it once. It does not need her."),
  row("hair-updo", "Messy updo", "hair", "velvet", "a messy updo with loose pieces at the neck of a fictional adult", "Pinned, then pulled at."),
  row("hair-glass", "Glassy skin", "hair", "velvet", "glassy highlighted skin and a sleek middle part on a fictional adult", "Light sits on her like jewelry."),
  row("hair-smear", "Smeared lipstick", "hair", "forbidden", "a slightly smeared red lip on a fictional adult", "She has already been kissed. She wants the next one."),
  row("hair-rain", "Rain-Dark Waves", "hair", "obsession", "rain-dark wet waves and a smoked eye on a fictional adult", "She came in from the weather and did not fix a thing."),

  row("mood-lamp", "Soft lamp", "mood", "silk", "warm lamp light, low and close, on a fictional adult", "The room agrees with her."),
  row("mood-day", "Window daylight", "mood", "silk", "soft daylight from a window on a fictional adult", "Honest light. She still looks like a secret."),
  row("mood-practical", "Warm practical", "mood", "silk", "a single warm practical light on a fictional adult", "One bulb. Enough."),
  row("mood-studio", "Clean studio", "mood", "silk", "even studio light on a dark backdrop, fictional adult", "Nothing to hide behind but the pose."),
  row("mood-sheet", "Morning sheet", "mood", "silk", "pale morning light through linen on a fictional adult", "The day can start without you. She would rather it did not."),
  row("mood-gold", "Golden hour", "mood", "satin", "golden-hour sunlight on skin, fictional adult", "The hour that flatters everyone. It still picks her."),
  row("mood-candle", "Candlelight", "mood", "satin", "candlelight and a little shadow on a fictional adult", "The flames do the flirting."),
  row("mood-neon", "Neon glow", "mood", "velvet", "neon rim light in pink and violet on a fictional adult", "The sign outside writes on her skin."),
  row("mood-rain", "Rain on glass", "mood", "forbidden", "rain on glass, cool light, and a warm lamp on a fictional adult", "The weather stays outside. She does not."),
  row("mood-pulse", "Pulse Dark", "mood", "obsession", "a dark room with a slow iridescent pulse of light on a fictional adult", "The light keeps time with her. So do you."),
];

export function assertTreasureCatalog(): void {
  if (TREASURES.length !== 150) throw new Error(`expected 150 treasures, got ${TREASURES.length}`);
  const counts: Record<VaultRarity, number> = { silk: 0, satin: 0, velvet: 0, forbidden: 0, obsession: 0 };
  const byCategory = {} as Record<VaultCategory, Record<VaultRarity, number>>;
  const ids = new Set<string>();
  const obsessionCategories = new Set<VaultCategory>();
  for (const item of TREASURES) {
    if (ids.has(item.id)) throw new Error(`duplicate ${item.id}`);
    ids.add(item.id);
    counts[item.rarity] += 1;
    if (item.slot !== SLOT_OF[item.kind]) throw new Error(`${item.id} slot`);
    if (!item.name.trim() || !item.blurb.trim() || item.neutral.trim().length < 12) throw new Error(`${item.id} is incomplete`);
    if (/\b(anime|photoreal|cel shading|3d render|octane)\b/i.test(item.neutral)) throw new Error(`${item.id} is not style-neutral`);
    if (item.kind === "pose") {
      if (!item.poseId || !POSE_SET.has(item.poseId)) throw new Error(`${item.id} pose ${item.poseId}`);
    } else if (item.poseId) {
      throw new Error(`${item.id} should not carry a skeleton`);
    }
    if (item.rarity === "obsession") obsessionCategories.add(item.kind);
    const bucket = (byCategory[item.kind] ??= { silk: 0, satin: 0, velvet: 0, forbidden: 0, obsession: 0 });
    bucket[item.rarity] += 1;
  }
  (Object.keys(RARITY_SPLIT) as VaultRarity[]).forEach((rarity) => {
    if (counts[rarity] !== RARITY_SPLIT[rarity]) throw new Error(`${rarity} expected ${RARITY_SPLIT[rarity]}, got ${counts[rarity]}`);
  });
  (Object.keys(CATEGORY_SPLIT) as VaultCategory[]).forEach((category) => {
    const got = byCategory[category];
    (Object.keys(CATEGORY_SPLIT[category]) as VaultRarity[]).forEach((rarity) => {
      if (got?.[rarity] !== CATEGORY_SPLIT[category][rarity]) {
        throw new Error(`${category} ${rarity} expected ${CATEGORY_SPLIT[category][rarity]}, got ${got?.[rarity] ?? 0}`);
      }
    });
  });
  if (obsessionCategories.size !== 9) throw new Error("obsession must touch every category");
}
