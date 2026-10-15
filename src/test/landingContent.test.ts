import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FORGE_COIN_PACKS } from "@/data/forgeCoinPacks";
import { CREDIT_PACKS, PLANS } from "@/lib/phone/pricing";
import { LANDING_FAQ } from "@/data/landingFaq";
import { LANDING_EXAMPLE_TEXTS } from "@/data/landingExampleTexts";
import { LANDING_TESTIMONIALS } from "@/data/landingTestimonials";

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

  it("hides testimonials until real quotes exist and does not disclaim the product as fake samples", () => {
    expect(LANDING_TESTIMONIALS).toEqual([]);
    const testimonials = readFileSync(resolve(process.cwd(), "src/components/landing/LandingTestimonials.tsx"), "utf8");
    expect(testimonials).toContain("LANDING_TESTIMONIALS.length === 0");
    expect(testimonials).toContain("return null");
    expect(LANDING_EXAMPLE_TEXTS.length).toBeGreaterThanOrEqual(3);
    const examples = readFileSync(resolve(process.cwd(), "src/components/landing/LandingExampleTexts.tsx"), "utf8");
    const features = readFileSync(resolve(process.cwd(), "src/components/landing/LandingFeatures.tsx"), "utf8");
    const phones = readFileSync(resolve(process.cwd(), "src/components/landing/LandingPhones.tsx"), "utf8");
    const page = `${examples}\n${features}\n${phones}`;
    expect(page).not.toMatch(/not quotes from customers|just samples|not created from users|character style/i);
    expect(page).not.toMatch(/Maya R\.|Jordan P\.|Elena V\./);
    expect(page).not.toMatch(/\bGPU\b/);
    expect(features).toMatch(/Coming soon/);
    expect(features).toMatch(/Voice calls/);
    expect(features).toMatch(/Grok Enhance/);
    expect(features).toMatch(/Velvet Vault/);
    expect(phones).toMatch(/backgroundColor/);
    expect(phones).not.toMatch(/absolute inset-0 h-full w-full object-cover/);
  });

  it("keeps plan prices in app data and off the public landing page", () => {
    expect(PLANS.map((plan) => plan.price)).toEqual(["$14.99", "$24.99", "$39.99"]);
    expect(CREDIT_PACKS.map((pack) => pack.price)).toEqual(["$4.99", "$9.99", "$19.99"]);
    const pricing = readFileSync(resolve(process.cwd(), "src/components/landing/LandingPricing.tsx"), "utf8");
    const story = readFileSync(resolve(process.cwd(), "src/components/landing/LandingStory.tsx"), "utf8");
    const hero = readFileSync(resolve(process.cwd(), "src/components/landing/LandingHero.tsx"), "utf8");
    const faq = readFileSync(resolve(process.cwd(), "src/data/landingFaq.ts"), "utf8");
    const waitlist = readFileSync(resolve(process.cwd(), "src/components/WaitlistSection.tsx"), "utf8");
    const blob = `${pricing}\n${story}\n${hero}\n${faq}\n${waitlist}`;
    expect(pricing).toMatch(/credits available/i);
    expect(pricing).toMatch(/add more credits later/i);
    expect(pricing).toMatch(/waitlist/i);
    expect(pricing).not.toContain("PLANS");
    expect(pricing).not.toContain("CREDIT_PACKS");
    expect(blob).not.toMatch(/\$\s?\d/);
    expect(blob).not.toMatch(/\+\s?\d+\s?%/);
    expect(blob).not.toMatch(/\b\d[\d,]*\s+credits\b/i);
    expect(blob).not.toMatch(/\bseamless\b|\bleverage\b|unlock the power/i);
    expect(blob).toMatch(/18/);
    expect(blob).toMatch(/21/);
  });

  it("answers the basic product questions without invented user counts or public prices", () => {
    const blob = LANDING_FAQ.map((item) => `${item.question} ${item.answer}`).join("\n");
    expect(blob).toMatch(/AI companion/);
    expect(blob).toMatch(/18/);
    expect(blob).toMatch(/credits are available/i);
    expect(blob).toMatch(/add more credits later/i);
    expect(blob).not.toMatch(/\$\s?\d/);
    expect(blob).not.toMatch(/\+\s?\d+\s?%/);
    expect(blob).not.toMatch(/\b\d[\d,]*\s+(credits|FC)\b/i);
    expect(blob).not.toMatch(/\b\d{2,}\s+(users|testers|members)\b/i);
  });
});
