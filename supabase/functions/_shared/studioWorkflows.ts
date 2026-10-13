/**
 * ComfyUI graphs for the LustForge Runpod worker.
 * `zimage` is the Lab graph (Z-Image Turbo, 8 steps, AuraFlow, lumina2 CLIP).
 * Pose adds ControlNet. Edits use Qwen-Image-Edit-2511 + the Lightning LoRA.
 * Model filenames can be overridden with STUDIO_* secrets if the volume differs.
 */

const NEG = "low quality, blurry, deformed, bad anatomy, extra fingers, watermark, text, child, minor, underage";

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

/** Z-Image Turbo with a pose skeleton on `pose.png`. */
export function zimagePose(
  prompt: string,
  opts: { seed: number; steps?: number; w?: number; h?: number; strength?: number },
): Graph {
  const graph = zimage(prompt, opts);
  const strength = opts.strength ?? 0.85;
  graph.pose = { class_type: "LoadImage", inputs: { image: "pose.png" } };
  graph.cn = {
    class_type: "ControlNetLoader",
    inputs: {
      control_net_name: envName("STUDIO_POSE_CONTROLNET", "Z-Image-Turbo-Fun-Controlnet-Union.safetensors"),
    },
  };
  graph.cnApply = {
    class_type: "ControlNetApplyAdvanced",
    inputs: {
      positive: ["z4", 0],
      negative: ["z5", 0],
      control_net: ["cn", 0],
      image: ["pose", 0],
      strength,
      start_percent: 0,
      end_percent: 0.85,
    },
  };
  graph.z7.inputs.positive = ["cnApply", 0];
  graph.z7.inputs.negative = ["cnApply", 1];
  return graph;
}

export type EditImages = {
  outfit?: boolean;
  pose?: boolean;
  mask?: boolean;
};

/**
 * Qwen-Image-Edit-2511 + Lightning LoRA (4 steps, cfg 1).
 * Subject is `subject.png`. Optional outfit / pose / mask images are extra references.
 */
export function qwenEdit(
  prompt: string,
  opts: { seed: number; denoise: number; images: EditImages },
): Graph {
  const imageInputs: Record<string, unknown> = {
    clip: ["q3", 0],
    prompt: `${prompt}\nAvoid: ${NEG}`,
    vae: ["q4", 0],
    image1: ["subj", 0],
  };
  if (opts.images.outfit) imageInputs.image2 = ["outfit", 0];
  else if (opts.images.pose) imageInputs.image2 = ["pose", 0];
  else if (opts.images.mask) imageInputs.image2 = ["mask", 0];
  if (opts.images.outfit && opts.images.pose) imageInputs.image3 = ["pose", 0];
  else if ((opts.images.outfit || opts.images.pose) && opts.images.mask) imageInputs.image3 = ["mask", 0];

  const graph: Graph = {
    q1: {
      class_type: "UNETLoader",
      inputs: {
        unet_name: envName("STUDIO_QWEN_UNET", "qwen_image_edit_2511_bf16.safetensors"),
        weight_dtype: "default",
      },
    },
    q2: {
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["q1", 0],
        lora_name: envName("STUDIO_QWEN_LORA", "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors"),
        strength_model: 1,
      },
    },
    q3: {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: envName("STUDIO_QWEN_CLIP", "qwen_2.5_vl_7b_fp8_scaled.safetensors"),
        type: "qwen_image",
      },
    },
    q4: { class_type: "VAELoader", inputs: { vae_name: envName("STUDIO_QWEN_VAE", "qwen_image_vae.safetensors") } },
    subj: { class_type: "LoadImage", inputs: { image: "subject.png" } },
    q6: { class_type: "TextEncodeQwenImageEditPlus", inputs: imageInputs },
    q7: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["q6", 0] } },
    qLatent: { class_type: "VAEEncode", inputs: { pixels: ["subj", 0], vae: ["q4", 0] } },
    q8: {
      class_type: "KSampler",
      inputs: {
        model: ["q2", 0],
        positive: ["q6", 0],
        negative: ["q7", 0],
        latent_image: ["qLatent", 0],
        seed: opts.seed,
        steps: 4,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: Math.max(0.2, Math.min(1, opts.denoise)),
      },
    },
    q9: { class_type: "VAEDecode", inputs: { samples: ["q8", 0], vae: ["q4", 0] } },
    q10: { class_type: "SaveImage", inputs: { images: ["q9", 0], filename_prefix: "qwen_edit" } },
  };
  if (opts.images.outfit) graph.outfit = { class_type: "LoadImage", inputs: { image: "outfit.png" } };
  if (opts.images.pose) graph.pose = { class_type: "LoadImage", inputs: { image: "pose.png" } };
  if (opts.images.mask) graph.mask = { class_type: "LoadImage", inputs: { image: "mask.png" } };
  return graph;
}
