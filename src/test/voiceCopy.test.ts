import { describe, expect, it } from "vitest";
import { deriveVoiceCopy, VOICE_TEASER_MAX } from "@/lib/companionVoiceCopy";
import { PRIVATE_PHOTO_LABEL } from "@/lib/privateChatPhoto";

describe("companion voice copy", () => {
  it("keeps the teaser short and first person from existing bio", () => {
    const copy = deriveVoiceCopy({
      name: "Mirael Voss",
      tagline: "A quiet archivist who keeps dangerous books",
      bio: "Mirael Voss keeps the night library and never lends a book twice. She speaks softly and remembers every promise.",
      backstory:
        "Mirael grew up between candle stacks and locked shelves. She learned names before faces. She still answers the door after midnight.",
    });
    expect(copy.teaser.length).toBeLessThanOrEqual(VOICE_TEASER_MAX);
    expect(copy.teaser.toLowerCase()).toMatch(/\bi\b|i'm|i’m/);
    expect(copy.story.split(/(?<=[.!?])\s+/).filter(Boolean).length).toBeGreaterThanOrEqual(3);
    expect(copy.story.toLowerCase()).toContain("candle");
    expect(copy.story.toLowerCase()).not.toMatch(/paris|doctor|vampire/);
  });

  it("does not invent a city or job that is not in the source", () => {
    const copy = deriveVoiceCopy({
      name: "Alaric",
      tagline: "He waits by the window",
      bio: "Alaric is patient and a little too honest.",
    });
    expect(copy.story.toLowerCase()).not.toMatch(/paris|doctor|vampire/);
  });
});

describe("private photo label", () => {
  it("uses the private photo wording", () => {
    expect(PRIVATE_PHOTO_LABEL).toBe("Private photo");
    expect(PRIVATE_PHOTO_LABEL.toLowerCase()).not.toContain("only you");
  });
});
