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
    expect(features).toMatch(/The Nexus/);
    expect(features).not.toMatch(/Bring two companions/);
    expect(phones).toMatch(/backgroundColor/);
    expect(phones).not.toMatch(/absolute inset-0 h-full w-full object-cover/);
  });

  it("keeps plan prices in app data and off the public landing page", () => {
    expect(PLANS.map((plan) => plan.price)).toEqual(["$14.99", "$24.99", "$39.99"]);
    expect(CREDIT_PACKS.map((pack) => pack.price)).toEqual(["$4.99", "$9.99", "$19.99"]);
    const files = [
      "src/pages/Index.tsx",
      "src/components/landing/LandingHero.tsx",
      "src/components/landing/LandingStory.tsx",
      "src/components/landing/LandingFeatures.tsx",
      "src/components/landing/LandingExampleTexts.tsx",
      "src/components/landing/LandingFaq.tsx",
      "src/components/landing/LandingFooter.tsx",
      "src/components/landing/LandingTrust.tsx",
      "src/components/landing/LandingCta.tsx",
      "src/data/landingFaq.ts",
      "src/data/landingExampleTexts.ts",
      "src/components/WaitlistSection.tsx",
    ];
    const blob = files.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    expect(blob).not.toMatch(/\$\s?\d/);
    expect(blob).not.toMatch(/\+\s?\d+\s?%/);
    expect(blob).not.toMatch(/credit|payment|\bpay\b|charge|embers|forge coin/i);
    expect(blob).toMatch(/Leave your email\. We&apos;ll write when it&apos;s your turn\./);
    expect(blob).not.toMatch(/Adults 18\+ only/);
    expect(blob).toMatch(/Join the waitlist to get your beta access/);
    expect(blob).toMatch(/Join the waitlist/);
    expect(blob).not.toMatch(/beta key|your key|have a key/i);
    expect(blob).not.toMatch(/free account/i);
    expect(blob).not.toMatch(/unlock/i);
    expect(blob).not.toMatch(/Create your free account/);
    expect(blob).not.toMatch(/Make your free account/);
    expect(blob).toMatch(/coming soon/i);
    for (const file of [
      "src/components/landing/LandingHero.tsx",
      "src/components/landing/LandingFeatures.tsx",
      "src/components/WaitlistSection.tsx",
    ]) {
      expect(readFileSync(resolve(process.cwd(), file), "utf8")).toContain("LandingActions");
    }
    const nav = readFileSync(resolve(process.cwd(), "src/components/Navbar.tsx"), "utf8");
    expect(nav).toMatch(/Sign in/);
    expect(nav).toMatch(/Join the waitlist/);
    expect(nav).not.toMatch(/Create your free account/);
    expect(nav).not.toMatch(/\bkey\b/i);
    expect(blob).not.toMatch(/\bseamless\b|\bleverage\b|unlock the power/i);
    expect(blob).toMatch(/18/);
    expect(blob).toMatch(/Adults only, 18 and over/);
    expect(blob).not.toMatch(/\b21\b|21 or older/);
    expect(blob).not.toMatch(/fictional/i);
    const hero = readFileSync(resolve(process.cwd(), "src/components/landing/LandingHero.tsx"), "utf8");
    expect(hero).toMatch(/Private companions/);
    expect(hero).toMatch(/Someone who answers late, stays with you, and sends the picture you asked for/);
    expect(hero).not.toMatch(/Adults 18\+/);
    const footer = readFileSync(resolve(process.cwd(), "src/components/landing/LandingFooter.tsx"), "utf8");
    expect(footer).toMatch(/Terms/);
    expect(footer).toMatch(/Privacy/);
    expect(footer).toMatch(/>\s*Contact\s*</);
    expect(footer).toMatch(/mailto:support@lustforge\.app/);
    expect(footer).toMatch(/LustForge/);
    expect(footer).not.toMatch(/18\+ disclaimer|Join the waitlist/);
  });

  it("uses plain 18+ legal pages with no age-21 wording or vendor names", () => {
    const files = [
      "src/pages/TermsOfService.tsx",
      "src/pages/PrivacyPolicy.tsx",
      "src/pages/EighteenPlusDisclaimer.tsx",
    ];
    const blob = files.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    expect(blob).toMatch(/Adults only, 18 and over/);
    expect(blob).toMatch(/support@lustforge\.app/);
    expect(blob).toMatch(/Eligibility/);
    expect(blob).toMatch(/Acceptable use/);
    expect(blob).toMatch(/User content/);
    expect(blob).toMatch(/AI-generated content/);
    expect(blob).toMatch(/Payments and subscriptions/);
    expect(blob).toMatch(/Intellectual property/);
    expect(blob).toMatch(/Limitation of liability/);
    expect(blob).toMatch(/Governing law/);
    expect(blob).toMatch(/Data we collect/);
    expect(blob).toMatch(/How we use information/);
    expect(blob).toMatch(/Cookies/);
    expect(blob).toMatch(/Third-party processors/);
    expect(blob).toMatch(/Retention/);
    expect(blob).toMatch(/Security/);
    expect(blob).toMatch(/Your rights/);
    expect(blob).toMatch(/Children/);
    expect(blob).toMatch(/Adult content notice/);
    expect(blob).not.toMatch(/\b21\b|21 or older/);
    expect(blob).not.toMatch(/Lovense|Grok|Stripe|Supabase|OpenAI|Vibe Lover|\[Insert|\[Your Jurisdiction\]/i);
    expect(blob).not.toMatch(/\$\s?\d/);
  });

  it("answers the basic product questions without invented user counts or public prices", () => {
    const blob = LANDING_FAQ.map((item) => `${item.question} ${item.answer}`).join("\n");
    expect(blob).toMatch(/AI companion/);
    expect(blob).toMatch(/18/);
    expect(blob).toMatch(/waitlist/i);
    expect(blob).not.toMatch(/\$\s?\d/);
    expect(blob).not.toMatch(/credit|payment|\bpay\b|charge|embers|forge coin/i);
    expect(blob).not.toMatch(/\b\d{2,}\s+(users|testers|members)\b/i);
  });
});
