/**
 * Presentational pricing for the in-app plans page.
 * 1 Ember = $0.01. These figures are display-only.
 * Do not copy them into Forge Coin packs, nowpayments, or wallet charges.
 */

export const SPOILING_PAYMENTS_LIVE = false;

export const SPOILING_COPY = {
  header: "Choose how you want to be spoiled.",
  subline: "Start free. Upgrade whenever she makes you want more.",
  welcome: "Your account is open.",
  yearlyNote: "two months free",
  embersTitle: "What your Embers do",
  packsTitle: "Ember packs",
  reassurance: "Cancel anytime. If a picture can't be made, your Embers come right back.",
  changeAnytime: "You can change this anytime",
  continueFree: "Continue free",
  comingSoon: "Coming soon",
  monthly: "Monthly",
  yearly: "Yearly",
} as const;

export const LAB_LINE = "the Lustforge Lab for deeper customizing";

export type SpoilingPlanId = "free" | "spark" | "forge" | "inferno";

export type SpoilingPlan = {
  id: SpoilingPlanId;
  name: string;
  price: string;
  perMonth: boolean;
  tagline: string;
  inherits: string | null;
  features: readonly string[];
  button: string;
  badge: string | null;
  highlighted: boolean;
};

export const SPOILING_PLANS: readonly SpoilingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    perMonth: false,
    tagline: "Get to know her",
    inherits: null,
    features: [
      "25 messages a day",
      "50 Embers to start, once",
      "basic companions",
      "locked pictures and Vault cards stay visible so you can see what's waiting",
    ],
    button: "Keep it free",
    badge: null,
    highlighted: false,
  },
  {
    id: "spark",
    name: "Spark",
    price: "$14.99",
    perMonth: true,
    tagline: "Stay a while",
    inherits: "Everything in Free, plus:",
    features: [
      "300 messages a day",
      "all standard companions",
      "300 Embers every month",
      "pictures, edits and Enhance with your Embers",
      "voice calls with Embers",
    ],
    button: "Choose Spark",
    badge: null,
    highlighted: false,
  },
  {
    id: "forge",
    name: "Forge",
    price: "$29.99",
    perMonth: true,
    tagline: "Make her yours",
    inherits: "Everything in Spark, plus:",
    features: [
      LAB_LINE,
      "900 Embers every month",
      "priority queue so her pictures arrive first",
      "longer memory",
      "10% off every action",
    ],
    button: "Choose Forge",
    badge: "Most loved",
    highlighted: true,
  },
  {
    id: "inferno",
    name: "Inferno",
    price: "$59.99",
    perMonth: true,
    tagline: "No limits on desire",
    inherits: "Everything in Forge, plus:",
    features: [
      "2,200 Embers every month",
      "premium companions included",
      "early access to new drops",
      "20% off every action",
    ],
    button: "Choose Inferno",
    badge: null,
    highlighted: false,
  },
];

export const HIGHLIGHTED_PLAN_ID: SpoilingPlanId = "forge";

export type EmberAction = {
  id: string;
  label: string;
  amount: string;
  suffix: string | null;
};

export const EMBER_ACTIONS: readonly EmberAction[] = [
  { id: "picture", label: "Picture", amount: "10", suffix: null },
  { id: "edit", label: "Edit", amount: "12", suffix: null },
  { id: "enhance", label: "Enhance", amount: "4", suffix: null },
  { id: "voice", label: "Voice", amount: "44", suffix: "per minute" },
  { id: "companion", label: "Create a companion", amount: "150", suffix: null },
];

export type EmberPack = {
  id: string;
  price: string;
  embers: string;
  bonus: string | null;
  badge: string | null;
};

export const EMBER_PACKS: readonly EmberPack[] = [
  { id: "500", price: "$4.99", embers: "500", bonus: null, badge: null },
  { id: "1100", price: "$9.99", embers: "1,100", bonus: "+10%", badge: null },
  { id: "3000", price: "$24.99", embers: "3,000", bonus: "+20%", badge: "Best value" },
  { id: "6500", price: "$49.99", embers: "6,500", bonus: "+30%", badge: null },
];

/** Paid plan and pack buttons stay closed until a real subscription checkout exists. */
export function spoilingCheckoutHref(_id: string): string | null {
  if (!SPOILING_PAYMENTS_LIVE) return null;
  return null;
}

export function plansThatNameTheLab(): SpoilingPlanId[] {
  return SPOILING_PLANS.filter((plan) => plan.features.some((line) => /lab/i.test(line))).map((plan) => plan.id);
}
