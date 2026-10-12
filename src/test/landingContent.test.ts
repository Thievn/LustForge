import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FORGE_COIN_PACKS } from "@/data/forgeCoinPacks";
import { CREDIT_PACKS, PLANS } from "@/lib/phone/pricing";
import { LANDING_FAQ } from "@/data/landingFaq";
import { LANDING_TESTIMONIAL_LABEL, LANDING_TESTIMONIALS } from "@/data/landingTestimonials";

describe("landing content", () => {
  it("keeps Forge Coin packs aligned with the BuyCredits edge function", () => {
    const source = readFileSync(resolve(process.cwd(), "supabase/functions/nowpayments-fc/index.ts"), "utf8");
    expect(FORGE_COIN_PACKS.length).toBeGreaterThan(0);
    for (const pack of FORGE_COIN_PACKS) {
      expect(source).toContain(`id: "${pack.id}"`);
      expect(source).toContain(`usd: ${pack.usd}`);
      expect(source).toContain(`fc: ${pack.fc}`);
      expect(source).toContain(`name: "${pack.name}"`);
      expect(source).toContain(`badge: "${pack.badge}"`);
    }
  });

  it("labels sample impressions and uses plain first-name last-initial names", () => {
    expect(LANDING_TESTIMONIAL_LABEL).toBe("Early beta impressions (sample)");
    expect(LANDING_TESTIMONIALS.length).toBeGreaterThanOrEqual(4);
    expect(LANDING_TESTIMONIALS.length).toBeLessThanOrEqual(6);
    for (const item of LANDING_TESTIMONIALS) {
      expect(item.name).toMatch(/^[A-Z][a-z]+ [A-Z]\.$/);
      expect(item.quote.length).toBeGreaterThan(40);
    }
  });

  it("previews launch plans in flirty copy and keeps the sample label nearby", () => {
    const pricing = readFileSync(resolve(process.cwd(), "src/components/landing/LandingPricing.tsx"), "utf8");
    const story = readFileSync(resolve(process.cwd(), "src/components/landing/LandingStory.tsx"), "utf8");
    const hero = readFileSync(resolve(process.cwd(), "src/components/landing/LandingHero.tsx"), "utf8");
    const blob = `${pricing}\n${story}\n${hero}`;
    expect(pricing).toMatch(/At launch/);
    expect(pricing).toContain("PLANS");
    expect(pricing).toContain("CREDIT_PACKS");
    expect(PLANS.map((plan) => plan.price)).toEqual(["$14.99", "$24.99", "$39.99"]);
    expect(CREDIT_PACKS.map((pack) => pack.price)).toEqual(["$4.99", "$9.99", "$19.99"]);
    expect(blob).not.toMatch(/\bseamless\b|\bleverage\b|unlock the power/i);
    expect(blob).toMatch(/18/);
    expect(blob).toMatch(/21/);
  });

  it("answers the basic product questions without invented user counts", () => {
    const blob = LANDING_FAQ.map((item) => `${item.question} ${item.answer}`).join("\n");
    expect(blob).toMatch(/AI companion/);
    expect(blob).toMatch(/18/);
    expect(blob).toMatch(/Forge Coins/);
    expect(blob).not.toMatch(/\b\d{2,}\s+(users|testers|members)\b/i);
  });
});
