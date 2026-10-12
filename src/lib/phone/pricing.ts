/** Display and local limit constants. No checkout. */

export type PlanId = "free" | "ember" | "blaze" | "inferno";

export type PlanCard = {
  id: Exclude<PlanId, "free">;
  name: string;
  price: string;
  companions: string;
  texts: string;
  pictures: string;
  extras: string[];
};

export type CreditPack = {
  id: "spark" | "flame" | "inferno_pack";
  name: string;
  price: string;
  credits: number;
  note: string;
};

export const PLANS: PlanCard[] = [
  {
    id: "ember",
    name: "Ember",
    price: "$14.99",
    companions: "1 companion",
    texts: "1,500 texts / 30 days",
    pictures: "50 pictures",
    extras: ["Preset scenarios", "Morning and night notes"],
  },
  {
    id: "blaze",
    name: "Blaze",
    price: "$24.99",
    companions: "2 companions",
    texts: "2,500 texts / 30 days",
    pictures: "120 pictures",
    extras: ["Auto-generated scenarios", "+10% credits on packs"],
  },
  {
    id: "inferno",
    name: "Inferno",
    price: "$39.99",
    companions: "3 companions + Lab Advanced",
    texts: "4,000 texts / 30 days",
    pictures: "250 pictures",
    extras: ["Custom scenarios", "+20% credits on packs"],
  },
];

export const CREDIT_PACKS: CreditPack[] = [
  { id: "spark", name: "Spark", price: "$4.99", credits: 250, note: "Starter pack" },
  { id: "flame", name: "Flame", price: "$9.99", credits: 550, note: "Includes a 10% bonus" },
  { id: "inferno_pack", name: "Inferno", price: "$19.99", credits: 1200, note: "Includes a 20% bonus" },
];

export const CREDIT_COSTS = {
  voicePerMinute: 25,
  extraPicture: 10,
  hundredTexts: 75,
  extraSlot: 300,
} as const;

export const FREE_TIER = {
  companions: 1,
  textsPerDay: 10,
  pictures: "blurred",
} as const;

export function planAllowsClearPictures(plan: string | null | undefined): boolean {
  return plan === "ember" || plan === "blaze" || plan === "inferno";
}
