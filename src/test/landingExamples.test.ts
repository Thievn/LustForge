import { describe, expect, it } from "vitest";
import {
  advanceReelSlot,
  buildLandingExamples,
  initialReelSlots,
  isExcludedFromLanding,
  isLandingSample,
  landingDisplayName,
  shuffleLanding,
} from "@/lib/landingExamples";

const local = {
  "lilith-vesper": "/lilith.jpg",
  "marcus-vale": "/marcus.jpg",
  "flicker-spark": "/fairy.jpg",
};

describe("landing examples", () => {
  it("keeps photographic portraits and drops illustration and creature art", () => {
    const examples = buildLandingExamples({
      ...local,
      "nova-quinn": "/nova.jpg",
      "jax-harlan": "/bear.jpg",
    });
    const ids = examples.map((row) => row.id);
    expect(ids).toContain("lilith-vesper");
    expect(ids).not.toContain("marcus-vale");
    expect(ids).not.toContain("jax-harlan");
    expect(ids).not.toContain("flicker-spark");
    expect(ids).not.toContain("nova-quinn");
    expect(examples.find((row) => row.id === "lilith-vesper")?.rarity).toBe("abyssal");
    expect(examples.find((row) => row.id === "lilith-vesper")?.tagline).not.toMatch(/mommy/i);
  });

  it("refuses unknown catalog rows, hybrids, mascots, and forged rows", () => {
    const examples = buildLandingExamples(local, [
      { id: "sage-evergreen", name: "Sage Evergreen", src: "https://cdn.example/sage.jpg", rarity: "epic" },
      { id: "tyler-kane", name: "Tyler Kane", src: "https://cdn.example/tyler.jpg", rarity: "epic" },
      { id: "priya-sharma", name: "Priya Sharma", src: "https://cdn.example/priya.jpg", rarity: "rare" },
      { id: "flicker-spark", name: "Flicker", src: "https://cdn.example/fairy.jpg", rarity: "mythic" },
      { id: "cc-123", name: "Private", src: "https://cdn.example/private.jpg", rarity: "rare" },
      {
        id: "lena-frost",
        name: "Lena Frost",
        src: "https://cdn.example/lena.jpg",
        rarity: "legendary",
        isNexusHybrid: true,
      },
    ]);
    expect(examples.map((row) => row.id)).toContain("tyler-kane");
    expect(examples.find((row) => row.id === "tyler-kane")?.name).toBe("Evan");
    expect(examples.find((row) => row.id === "lilith-vesper")?.name).toBe("Ivy");
    expect(examples.map((row) => row.id)).not.toContain("sage-evergreen");
    expect(examples.map((row) => row.id)).not.toContain("priya-sharma");
    expect(examples.map((row) => row.id)).not.toContain("cc-123");
    expect(examples.map((row) => row.id)).not.toContain("lena-frost");
    expect(isExcludedFromLanding("cc-9")).toBe(true);
    expect(isExcludedFromLanding("sage-evergreen")).toBe(true);
  });

  it("shuffles without dropping or duplicating cards", () => {
    const items = ["a", "b", "c", "d", "e"];
    let n = 0;
    const rand = () => {
      const seq = [0.9, 0.1, 0.4, 0.2];
      const value = seq[n] ?? 0;
      n += 1;
      return value;
    };
    const shuffled = shuffleLanding(items, rand);
    expect(shuffled).toHaveLength(items.length);
    expect(new Set(shuffled)).toEqual(new Set(items));
    expect(shuffled).not.toEqual(items);
  });

  it("rotates in a portrait that is not already on screen", () => {
    const deck = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
    ];
    const slots = initialReelSlots(deck, 2);
    const next = advanceReelSlot(deck, slots, 0, 2);
    expect(next.slots.map((slot) => slot.id)).toEqual(["c", "b"]);
    expect(next.cursor).toBe(3);
  });
});
