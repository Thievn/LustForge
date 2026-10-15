import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PlansView from "@/components/phone/PlansView";
import {
  EMBER_ACTIONS,
  EMBER_PACKS,
  LAB_LINE,
  SPOILING_COPY,
  SPOILING_PAYMENTS_LIVE,
  SPOILING_PLANS,
  plansThatNameTheLab,
  spoilingCheckoutHref,
} from "@/config/spoilingPlans";
import { CREDIT_PACKS, PLANS } from "@/lib/phone/pricing";

function renderPlans(path: string) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root;
  act(() => {
    root = createRoot(container);
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <PlansView />
      </MemoryRouter>,
    );
  });
  return {
    container,
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("spoiling plans config", () => {
  it("keeps the Lab on Forge only and lets Inferno inherit it", () => {
    expect(plansThatNameTheLab()).toEqual(["forge"]);
    expect(SPOILING_PLANS.find((plan) => plan.id === "forge")?.features).toContain(LAB_LINE);
    for (const id of ["free", "spark", "inferno"] as const) {
      const blob = SPOILING_PLANS.find((plan) => plan.id === id);
      expect(blob?.features.join(" ")).not.toMatch(/lab/i);
    }
    expect(SPOILING_PLANS.find((plan) => plan.id === "inferno")?.inherits).toBe("Everything in Forge, plus:");
  });

  it("uses the requested prices without touching live billing figures", () => {
    expect(SPOILING_PLANS.map((plan) => plan.price)).toEqual(["$0", "$14.99", "$29.99", "$59.99"]);
    expect(PLANS.map((plan) => plan.price)).toEqual(["$14.99", "$24.99", "$39.99"]);
    expect(CREDIT_PACKS.map((pack) => pack.price)).toEqual(["$4.99", "$9.99", "$19.99"]);
    expect(EMBER_PACKS.map((pack) => [pack.price, pack.embers, pack.bonus, pack.badge])).toEqual([
      ["$4.99", "500", null, null],
      ["$9.99", "1,100", "+10%", null],
      ["$24.99", "3,000", "+20%", "Best value"],
      ["$49.99", "6,500", "+30%", null],
    ]);
    expect(EMBER_ACTIONS.map((action) => `${action.label} ${action.amount}${action.suffix ? ` ${action.suffix}` : ""}`)).toEqual([
      "Picture 10",
      "Edit 12",
      "Enhance 4",
      "Voice 44 per minute",
      "Create a companion 150",
    ]);
    expect(SPOILING_PAYMENTS_LIVE).toBe(false);
    expect(spoilingCheckoutHref("forge")).toBeNull();
    const billing = readFileSync(resolve(process.cwd(), "supabase/functions/nowpayments-fc/index.ts"), "utf8");
    expect(billing).not.toContain("29.99");
    expect(billing).not.toContain("59.99");
  });
});

describe("plans page", () => {
  it("shows the spoiling copy, a yearly note without new prices, and coming soon on paid plans", () => {
    const view = renderPlans("/plans?preview=1");
    const text = () => view.container.textContent ?? "";
    expect(text()).toContain(SPOILING_COPY.header);
    expect(text()).toContain(SPOILING_COPY.subline);
    expect(text()).not.toContain(SPOILING_COPY.welcome);
    expect(text()).toContain("Most loved");
    expect(text()).toContain(LAB_LINE);
    expect(text().match(/Lustforge Lab/g)).toHaveLength(1);
    expect(view.container.querySelector('[data-plan="forge"]')?.getAttribute("data-centered")).toBe("true");
    expect(view.container.querySelector('[data-plan="spark"] button')).toBeDisabled();
    expect(view.container.querySelector('[data-plan="spark"]')?.textContent).toContain("Choose Spark");
    expect(view.container.querySelector('[data-plan="spark"]')?.textContent).toContain("Coming soon");
    expect(view.container.querySelector('[data-plan="free"] a')?.getAttribute("href")).toBe("/dashboard?preview=1");
    expect(text()).toContain("Keep it free");
    expect(text()).toContain(SPOILING_COPY.reassurance);
    expect(text()).toContain(SPOILING_COPY.changeAnytime);
    expect(text()).toContain("Continue free");
    expect(text()).not.toContain("two months free");

    const yearly = view.container.querySelector<HTMLButtonElement>('[data-cadence="yearly"]');
    act(() => {
      yearly?.click();
    });
    expect(text()).toContain("two months free");
    expect(text()).toContain("$14.99");
    expect(text()).toContain("$29.99");
    expect(text()).toContain("$59.99");
    expect(text()).not.toMatch(/\$179\.88|\$359\.88|\/year/);
    view.cleanup();
  });

  it("opens a welcome state for a new account", () => {
    const view = renderPlans("/plans?welcome=1");
    expect(view.container.textContent).toContain("Your account is open.");
    expect(view.container.querySelector('[data-plan="free"] a')?.getAttribute("href")).toBe("/dashboard");
    view.cleanup();
  });
});
