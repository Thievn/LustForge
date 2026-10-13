import { describe, expect, it } from "vitest";
import { applyStoryChoice, awardMessageXp, matchOutfitName, nextGroupSpeaker, nextStreak, tierForXp } from "@/lib/bond/logic";

describe("bond logic", () => {
  it("tracks streak, outfits, tiers, and whose turn it is", () => {
    expect(nextStreak(3, "2026-10-11", "2026-10-12").streak).toBe(4);
    expect(nextStreak(3, "2026-10-12", "2026-10-12").changed).toBe(false);
    expect(nextStreak(3, "2026-10-01", "2026-10-12").streak).toBe(1);
    expect(matchOutfitName("wear the black lace set tonight", ["Black lace set", "Red thong"])).toBe("Black lace set");
    expect(matchOutfitName("hello", ["Black lace set"])).toBeNull();
    expect(tierForXp(awardMessageXp(0, 10)).level).toBeGreaterThan(1);
    expect(nextGroupSpeaker(["a", "b", "c"], "b")).toBe("c");
    expect(nextGroupSpeaker(["a", "b"], "b")).toBe("a");
    const done = applyStoryChoice({
      chapterCount: 2,
      chapterIndex: 1,
      choice: { id: "x", label: "Stay", reply: "yes", unlocks: "A rain night" },
    });
    expect(done.completed).toBe(true);
    expect(done.unlocked).toBe("A rain night");
  });
});
