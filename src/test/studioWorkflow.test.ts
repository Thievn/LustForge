import { describe, expect, it } from "vitest";
import { editLocksPixels, qwenEdit } from "../../supabase/functions/_shared/studioWorkflows";

const prompt = "Change the jacket to black leather.";

function graph(lock: boolean, images: { outfit?: boolean; pose?: boolean; mask?: boolean } = {}) {
  return qwenEdit(prompt, { seed: 7, denoise: 0.7, images, lock });
}

describe("qwen edit workflow", () => {
  it("locks pixels for outfit, region, and fix only", () => {
    expect(editLocksPixels("outfit")).toBe(true);
    expect(editLocksPixels("brush")).toBe(true);
    expect(editLocksPixels("fix")).toBe(true);
    expect(editLocksPixels("pose")).toBe(false);
    expect(editLocksPixels("background")).toBe(false);
    expect(editLocksPixels("prompt")).toBe(false);
  });

  it("snaps the subject to a multiple of 16 and reuses that latent as the reference", () => {
    const nodes = graph(true, { outfit: true });
    expect(nodes.prep.class_type).toBe("LFPixelPerfectPrepare");
    expect(nodes.prep.inputs).toEqual({ image: ["subj", 0] });
    expect(nodes.q6.inputs.vae).toBeUndefined();
    expect(nodes.q6.inputs.image1).toEqual(["prep", 0]);
    expect(nodes.qLatent.inputs.pixels).toEqual(["prep", 0]);
    expect(nodes.qRef.inputs).toEqual({ conditioning: ["q6", 0], latent: ["qLatent", 0] });
    expect(nodes.q8.inputs.positive).toEqual(["qRef", 0]);
    expect(nodes.q8.inputs.latent_image).toEqual(["qLatent", 0]);
    expect(nodes.q8.inputs.steps).toBe(4);
    expect(nodes.q8.inputs.cfg).toBe(1);
  });

  it("runs drift fix and composite for outfit, region, and fix edits", () => {
    for (const images of [{ outfit: true }, { mask: true }, {}]) {
      const nodes = graph(true, images);
      expect(nodes.drift.class_type).toBe("PixelDriftFix");
      expect(nodes.drift.inputs).toMatchObject({
        source_image: ["prep", 0],
        edited_image: ["q9", 0],
        method: "flat_4_points",
        max_mesh_points: 400,
      });
      expect(nodes.comp.class_type).toBe("LFPixelPerfectComposite");
      expect(nodes.comp.inputs.original).toEqual(["subj", 0]);
      expect(nodes.comp.inputs.edited).toEqual(["drift", 0]);
      expect(nodes.q10.inputs.images).toEqual(["comp", 0]);
    }
    expect(graph(true, { mask: true }).comp.inputs.mask).toEqual(["mask", 0]);
    expect(graph(true, { outfit: true }).comp.inputs.mask).toBeUndefined();
  });

  it("skips drift fix and composite for pose and whole-image edits", () => {
    for (const images of [{ pose: true }, {}]) {
      const nodes = graph(false, images);
      expect(nodes.drift).toBeUndefined();
      expect(nodes.comp).toBeUndefined();
      expect(nodes.prep).toBeDefined();
      expect(nodes.qRef).toBeDefined();
      expect(nodes.q10.inputs.images).toEqual(["q9", 0]);
    }
  });
});
