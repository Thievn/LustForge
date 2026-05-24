import { describe, it, expect } from "vitest";
import {
  isAnimeArtStyleLabel,
  isStylizedNonPhotorealArtLabel,
  resolveChatArtStyleLabel,
} from "@/lib/chatArtStyle";
import { buildForgeThemeSnapshotV1 } from "@/lib/forgeThemeSnapshot";

describe("resolveChatArtStyleLabel", () => {
  it("reads artStyle from forge theme snapshot", () => {
    const snap = buildForgeThemeSnapshotV1({
      activeForgeTab: "realistic_craving",
      forgeCardPose: "standing",
      artStyle: "Anime Style",
      sceneAtmosphere: "Neon City",
      bodyType: "Average Build",
      visualTailoring: {},
      forgeTabFeatures: {},
      forgeTabSharedOverrides: {} as never,
    });
    const label = resolveChatArtStyleLabel({
      personality_forge: { _forgeThemeV2: snap },
      image_prompt: "photoreal portrait",
    });
    expect(label).toBe("Anime Style");
  });

  it("uses anime tab when snapshot art is empty", () => {
    const snap = buildForgeThemeSnapshotV1({
      activeForgeTab: "anime_temptation",
      forgeCardPose: "standing",
      artStyle: "",
      sceneAtmosphere: "Cherry Blossom",
      bodyType: "Average Build",
      visualTailoring: {},
      forgeTabFeatures: {},
      forgeTabSharedOverrides: {} as never,
    });
    expect(
      resolveChatArtStyleLabel({
        personality_forge: { _forgeThemeV2: snap },
      }),
    ).toBe("Anime Style");
  });

  it("prefers snapshot artStyle over conflicting style tags", () => {
    const snap = buildForgeThemeSnapshotV1({
      activeForgeTab: "anime_temptation",
      forgeCardPose: "standing",
      artStyle: "Photorealistic",
      sceneAtmosphere: "Neon City",
      bodyType: "Average Build",
      visualTailoring: {},
      forgeTabFeatures: {},
      forgeTabSharedOverrides: {} as never,
    });
    const label = resolveChatArtStyleLabel({
      tags: ["Anime Style"],
      personality_forge: { _forgeThemeV2: snap },
      image_prompt: "2D anime cel-shaded illustration",
    });
    expect(label).toBe("Photorealistic");
  });
});

describe("isAnimeArtStyleLabel", () => {
  it("detects anime forge labels", () => {
    expect(isAnimeArtStyleLabel("Anime Style")).toBe(true);
    expect(isAnimeArtStyleLabel("Photorealistic")).toBe(false);
  });
});

describe("isStylizedNonPhotorealArtLabel", () => {
  it("treats watercolor as stylized", () => {
    expect(isStylizedNonPhotorealArtLabel("Watercolor Painting")).toBe(true);
  });
  it("does not treat photoreal as stylized", () => {
    expect(isStylizedNonPhotorealArtLabel("Photorealistic")).toBe(false);
  });
});
