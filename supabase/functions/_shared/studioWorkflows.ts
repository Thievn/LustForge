/**
 * ComfyUI graphs for the LustForge Runpod worker.
 * `zimage` is the Lab graph (Z-Image Turbo, 8 steps, AuraFlow, lumina2 CLIP).
 * Pose adds ControlNet.
 * Edits use the Lab `qwenEdit()` graph from lustforge-lab commit e0b26ab:
 * native resolution snapped to a multiple of 16, the same VAE latent as the
 * reference (no 1MP resize), then optional PixelDriftFix + composite.
 * Model filenames can be overridden with STUDIO_* secrets if the volume differs.
 */


type Node = { class_type: string; inputs: Record<string, unknown> };
type Graph = Record<string, Node>;

function envName(key: string, fallback: string): string {
  const value = typeof Deno !== "undefined" ? Deno.env.get(key)?.trim() : "";
  return value || fallback;
}

export function zimage(
  prompt: string,
  opts: { seed: number; steps?: number; w?: number; h?: number },
): Graph {
  const steps = opts.steps ?? 8;
  const w = opts.w ?? 832;
  const h = opts.h ?? 1216;
  return {
    z1: {
      class_type: "UNETLoader",
      inputs: { unet_name: envName("STUDIO_ZIMAGE_UNET", "z_image_turbo_bf16.safetensors"), weight_dtype: "default" },
    },
    z1b: { class_type: "ModelSamplingAuraFlow", inputs: { model: ["z1", 0], shift: 3.0 } },
    z2: {
      class_type: "CLIPLoader",
      inputs: { clip_name: envName("STUDIO_ZIMAGE_CLIP", "qwen_3_4b_fp8_mixed.safetensors"), type: "lumina2" },
    },
    z3: { class_type: "VAELoader", inputs: { vae_name: envName("STUDIO_ZIMAGE_VAE", "ae.safetensors") } },
    z4: { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["z2", 0] } },
    z5: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["z4", 0] } },
    z6: { class_type: "EmptySD3LatentImage", inputs: { width: w, height: h, batch_size: 1 } },
    z7: {
      class_type: "KSampler",
      inputs: {
        model: ["z1b", 0],
        positive: ["z4", 0],
        negative: ["z5", 0],
        latent_image: ["z6", 0],
        seed: opts.seed,
        steps,
        cfg: 1.0,
        sampler_name: "res_multistep",
        scheduler: "simple",
        denoise: 1.0,
      },
    },
    c8: { class_type: "VAEDecode", inputs: { samples: ["z7", 0], vae: ["z3", 0] } },
    c9: { class_type: "SaveImage", inputs: { images: ["c8", 0], filename_prefix: "zimage" } },
  };
}

/**
 * Z-Image Turbo with a pose skeleton on `pose.png` (sized w x h).
 * Same as the Lab `addPose()`: Fun ControlNet Union 2.1 loaded as a model patch.
 */
export function zimagePose(
  prompt: string,
  opts: { seed: number; steps?: number; w?: number; h?: number; strength?: number },
): Graph {
  const graph = zimage(prompt, opts);
  graph.p1 = {
    class_type: "ModelPatchLoader",
    inputs: { name: envName("STUDIO_POSE_CONTROLNET", "Z-Image-Turbo-Fun-Controlnet-Union-2.1-2602-8steps.safetensors") },
  };
  graph.p2 = { class_type: "LoadImage", inputs: { image: "pose.png" } };
  graph.p3 = {
    class_type: "ZImageFunControlnet",
    inputs: { model: ["z1b", 0], model_patch: ["p1", 0], vae: ["z3", 0], strength: opts.strength ?? 0.8, image: ["p2", 0] },
  };
  graph.z7.inputs.model = ["p3", 0];
  return graph;
}

export type EditImages = {
  outfit?: boolean;
  pose?: boolean;
  mask?: boolean;
};

/**
 * Tools that keep the face and untouched pixels: outfit, painted region, fix.
 * Pose changes and whole-image changes (background, style/prompt) skip
 * PixelDriftFix and the composite back onto the original.
 */
export function editLocksPixels(tool: string): boolean {
  return tool === "outfit" || tool === "brush" || tool === "fix";
}

/**
 * Qwen-Image-Edit-2511 + Lightning LoRA (4 steps, cfg 1), same graph as the Lab `qwenEdit()`
 * (lustforge-lab lib/workflows.js, comfy-serverless/PIXEL_PERFECT.md).
 * Images: `subject.png` (image1) + optional `outfit.png` / `pose.png` (image2, image3) + `mask.png` (white = edit; NOT sent to the model).
 * Always: LFPrepareEdit (native res, pad to /16), encoder WITHOUT vae, ReferenceLatent = exact VAE latent of the working image,
 * crop the padding off, LFPixelPerfectComposite back to the original size.
 * `lock` adds PixelDriftFix and composite mode "auto" (mask -> "mask"); unlocked = mode "off" (or "mask" when a mask is given).
 */
export function qwenEdit(
  prompt: string,
  opts: { seed: number; denoise: number; images: EditImages; lock?: boolean },
): Graph {
  const extra: string[] = [];
  if (opts.images.outfit) extra.push("outfit");
  if (opts.images.pose) extra.push("pose");
  const enc = (text: string) => {
    const inputs: Record<string, unknown> = { clip: ["q5", 0], prompt: text, image1: ["prep", 1] };
    extra.forEach((n, k) => { inputs[`image${k + 2}`] = [n, 0]; });
    return inputs;
  };
  const mask = Boolean(opts.images.mask);
  const mode = opts.lock ? (mask ? "mask" : "auto") : (mask ? "mask" : "off");
  const graph: Graph = {
    q1: {
      class_type: "UNETLoader",
      inputs: { unet_name: envName("STUDIO_QWEN_UNET", "qwen_image_edit_2511_fp8mixed.safetensors"), weight_dtype: "default" },
    },
    q2: {
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["q1", 0],
        lora_name: envName("STUDIO_QWEN_LORA", "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors"),
        strength_model: 1.0,
      },
    },
    q3: { class_type: "ModelSamplingAuraFlow", inputs: { model: ["q2", 0], shift: 3.0 } },
    q4: { class_type: "CFGNorm", inputs: { model: ["q3", 0], strength: 1.0 } },
    q5: {
      class_type: "CLIPLoader",
      inputs: { clip_name: envName("STUDIO_QWEN_CLIP", "qwen_2.5_vl_7b_fp8_scaled.safetensors"), type: "qwen_image" },
    },
    q6: { class_type: "VAELoader", inputs: { vae_name: envName("STUDIO_QWEN_VAE", "qwen_image_vae.safetensors") } },
    subj: { class_type: "LoadImage", inputs: { image: "subject.png" } },
    prep: { class_type: "LFPrepareEdit", inputs: { image: ["subj", 0], multiple: 16, max_megapixels: 1.6 } },
    qLatent: { class_type: "VAEEncode", inputs: { pixels: ["prep", 0], vae: ["q6", 0] } },
    qPos: { class_type: "TextEncodeQwenImageEditPlus", inputs: enc(prompt) },
    qNeg: { class_type: "TextEncodeQwenImageEditPlus", inputs: enc("") },
    rPos: { class_type: "ReferenceLatent", inputs: { conditioning: ["qPos", 0], latent: ["qLatent", 0] } },
    rNeg: { class_type: "ReferenceLatent", inputs: { conditioning: ["qNeg", 0], latent: ["qLatent", 0] } },
    mPos: { class_type: "FluxKontextMultiReferenceLatentMethod", inputs: { conditioning: ["rPos", 0], reference_latents_method: "index_timestep_zero" } },
    mNeg: { class_type: "FluxKontextMultiReferenceLatentMethod", inputs: { conditioning: ["rNeg", 0], reference_latents_method: "index_timestep_zero" } },
    q8: {
      class_type: "KSampler",
      inputs: {
        model: ["q4", 0],
        positive: ["mPos", 0],
        negative: ["mNeg", 0],
        latent_image: ["qLatent", 0],
        seed: opts.seed,
        steps: 4,
        cfg: 1.0,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: Math.max(0.2, Math.min(1, opts.denoise)),
      },
    },
    q9: { class_type: "VAEDecode", inputs: { samples: ["q8", 0], vae: ["q6", 0] } },
    crop: { class_type: "ImageCrop", inputs: { image: ["q9", 0], width: ["prep", 2], height: ["prep", 3], x: 0, y: 0 } },
    comp: {
      class_type: "LFPixelPerfectComposite",
      inputs: {
        original: ["subj", 0], edited: ["crop", 0], work_w: 0, work_h: 0, mode,
        threshold: 0.07, grow: 12, feather: 8, min_area: 0.0015,
      },
    },
    q10: { class_type: "SaveImage", inputs: { images: ["comp", 0], filename_prefix: "studio_edit" } },
  };
  if (opts.images.outfit) graph.outfit = { class_type: "LoadImage", inputs: { image: "outfit.png" } };
  if (opts.images.pose) graph.pose = { class_type: "LoadImage", inputs: { image: "pose.png" } };
  if (mask) {
    graph.mask = { class_type: "LoadImage", inputs: { image: "mask.png" } };
    graph.maskM = { class_type: "ImageToMask", inputs: { image: ["mask", 0], channel: "red" } };
    graph.comp.inputs.mask = ["maskM", 0];
  }
  if (opts.lock) {
    graph.drift = {
      class_type: "PixelDriftFix",
      inputs: { source_image: ["prep", 1], edited_image: ["crop", 0], method: "flat_4_points", max_mesh_points: 400 },
    };
    graph.comp.inputs.edited = ["drift", 0];
  }
  return graph;
}
