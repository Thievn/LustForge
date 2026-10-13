import { describe, expect, it } from "vitest";
import { generateForgeName } from "@/lib/forgeNameEngine";
import { DEFAULT_FORGE_PERSONALITY } from "@/lib/forgePersonalityProfile";

const NATURE = /\b(luna|violet|stormy|phoenix|ocean|ivy|jade|ruby|willow|sky|river|sage|cedar|indigo)\b/i;

describe("modern companion names", () => {
  it("stays a real given name, never a nature token or a stamped filler", () => {
    for (let seed = 1; seed <= 80; seed++) {
      const name = generateForgeName({
        gender: seed % 2 ? "woman" : "man",
        forgePersonality: DEFAULT_FORGE_PERSONALITY,
        seed,
      });
      expect(name).not.toMatch(/^Nom\b/);
      expect(name).not.toMatch(NATURE);
      expect(name.length).toBeGreaterThan(1);
    }
  });
});
