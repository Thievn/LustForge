import { describe, expect, it } from "vitest";
import { editLocksPixels, qwenEdit, zimagePose } from "../../supabase/functions/_shared/studioWorkflows";

const prompt = "Change the jacket to black leather.";

function graph(lock: boolean, images: { outfit?: boolean; pose?: boolean; mask?: boolean } = {}) {
  return qwenEdit(prompt, { seed: 7, denoise: 0.7, images, lock });
}

describe("qwen edit workflow (matches Lab qwenEdit / PIXEL_PERFECT.md)", () => {
  it("locks pixels for outfit, region, and fix only", () => {
    expect(editLocksPixels("outfit")).toBe(true);
    expect(editLocksPixels("brush")).toBe(true);
    expect(editLocksPixels("fix")).toBe(true);
    expect(editLocksPixels("pose")).toBe(false);
    expect(editLocksPixels("background")).toBe(false);
    expect(editLocksPixels("prompt")).toBe(false);
  });

  it("prepares at native res (pad /16) and reuses that exact latent as the reference", () => {
    const nodes = graph(true, { outfit: true });
    expect(nodes.prep.class_type).toBe("LFPrepareEdit");
    expect(nodes.prep.inputs).toEqual({ image: ["subj", 0], multiple: 16, max_megapixels: 1.6 });
    expect(nodes.qPos.inputs.vae).toBeUndefined();
    expect(nodes.qPos.inputs.image1).toEqual(["prep", 1]);
    expect(nodes.qPos.inputs.image2).toEqual(["outfit", 0]);
    expect(nodes.qLatent.inputs.pixels).toEqual(["prep", 0]);
    expect(nodes.rPos.inputs).toEqual({ conditioning: ["qPos", 0], latent: ["qLatent", 0] });
    expect(nodes.rNeg.inputs).toEqual({ conditioning: ["qNeg", 0], latent: ["qLatent", 0] });
    expect(nodes.q8.inputs.positive).toEqual(["mPos", 0]);
    expect(nodes.q8.inputs.model).toEqual(["q4", 0]);
    expect(nodes.q8.inputs.latent_image).toEqual(["qLatent", 0]);
    expect(nodes.crop.inputs).toEqual({ image: ["q9", 0], width: ["prep", 2], height: ["prep", 3], x: 0, y: 0 });
    expect(nodes.q10.inputs.images).toEqual(["comp", 0]);
  });

  it("runs drift fix + auto/mask composite for locked edits", () => {
    for (const images of [{ outfit: true }, { mask: true }, {}]) {
      const nodes = graph(true, images);
      expect(nodes.drift.class_type).toBe("PixelDriftFix");
      expect(nodes.drift.inputs).toEqual({
        source_image: ["prep", 1], edited_image: ["crop", 0], method: "flat_4_points", max_mesh_points: 400,
      });
      expect(nodes.comp.class_type).toBe("LFPixelPerfectComposite");
      expect(nodes.comp.inputs).toMatchObject({ original: ["subj", 0], edited: ["drift", 0], work_w: 0, work_h: 0 });
    }
    expect(graph(true, { outfit: true }).comp.inputs.mode).toBe("auto");
    const masked = graph(true, { mask: true });
    expect(masked.comp.inputs.mode).toBe("mask");
    expect(masked.comp.inputs.mask).toEqual(["maskM", 0]);
    expect(masked.maskM).toEqual({ class_type: "ImageToMask", inputs: { image: ["mask", 0], channel: "red" } });
    expect(masked.qPos.inputs.image2).toBeUndefined();
  });

  it("skips drift fix for pose and whole-image edits", () => {
    for (const images of [{ pose: true }, {}]) {
      const nodes = graph(false, images);
      expect(nodes.drift).toBeUndefined();
      expect(nodes.comp.inputs.mode).toBe("off");
      expect(nodes.comp.inputs.edited).toEqual(["crop", 0]);
    }
  });

  it("pose generate uses the Fun ControlNet model patch like the Lab", () => {
    const g = zimagePose("x", { seed: 1 });
    expect(g.p3.class_type).toBe("ZImageFunControlnet");
    expect(g.z7.inputs.model).toEqual(["p3", 0]);
  });
});
