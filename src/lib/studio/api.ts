import { supabase } from "@/integrations/supabase/client";
import { messageFromFunctionsInvoke } from "@/lib/supabaseFunctionsError";

export type StudioJob = {
  id: string;
  status: string;
  seed?: number;
  imageUrl?: string;
  storageUrl?: string;
  assetId?: string;
  tag?: string;
  source?: "lab" | "character" | "upload";
  error?: string;
};

export class StudioError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function invoke(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  const payload = data as Record<string, unknown> | null;
  if (error || (payload && typeof payload.error === "string")) {
    const message = await messageFromFunctionsInvoke(error, payload);
    throw new StudioError(message, typeof payload?.code === "string" ? payload.code : undefined);
  }
  return payload ?? {};
}

export function studioEnhance(prompt: string, mode: "create" | "edit") {
  return invoke("studio-generate", { action: "enhance", prompt, mode }) as Promise<{ prompt?: string }>;
}

export function studioGenerate(body: Record<string, unknown>) {
  return invoke("studio-generate", body) as Promise<{ jobs?: StudioJob[]; credits?: number; freeLeft?: number; prompt?: string }>;
}

export function studioEdit(body: Record<string, unknown>) {
  return invoke("studio-edit", body) as Promise<{ jobs?: StudioJob[]; source?: StudioJob["source"]; credits?: number; freeLeft?: number }>;
}

export function studioImport(body: Record<string, unknown>) {
  return invoke("studio-import", body) as Promise<{ assetId?: string; imageUrl?: string; tag?: string; source?: "character" }>;
}

export async function pollStudioJobs(ids: string[], onStatus?: (label: string) => void): Promise<StudioJob[]> {
  const pending = new Set(ids);
  const done = new Map<string, StudioJob>();
  const deadline = Date.now() + 480_000;
  while (pending.size && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const data = (await invoke("studio-status", { jobIds: [...pending] })) as { jobs?: StudioJob[] };
    let label = "working";
    for (const job of data.jobs ?? []) {
      if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED" || job.status === "TIMED_OUT") {
        pending.delete(job.id);
        done.set(job.id, job);
      } else if (job.status === "IN_QUEUE") label = "queued, GPU waking";
      else label = "working";
    }
    onStatus?.(pending.size ? label : "done");
  }
  if (pending.size) throw new StudioError("The GPU took too long. Try again in a moment.");
  return ids.map((id) => done.get(id) ?? { id, status: "FAILED", error: "Missing result" });
}

export function readFileAsJpeg(file: File, max = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read that image"));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    image.src = url;
  });
}

export async function stitchOutfitRefs(urls: string[]): Promise<string | null> {
  if (!urls.length) return null;
  if (urls.length === 1) return urls[0];
  const images = await Promise.all(urls.map((src) => loadImage(src)));
  const height = 768;
  const widths = images.map((image) => Math.max(1, Math.round(height * (image.width / image.height))));
  const canvas = document.createElement("canvas");
  canvas.width = widths.reduce((sum, width) => sum + width, 0);
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return urls[0];
  let x = 0;
  images.forEach((image, index) => {
    ctx.drawImage(image, x, 0, widths[index], height);
    x += widths[index];
  });
  return canvas.toDataURL("image/jpeg", 0.86);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read a reference image"));
    image.src = src;
  });
}

export const EDIT_STASH_KEY = "lf-studio-edit";

export type StashedEdit = {
  imageUrl: string;
  storageUrl?: string;
  companionId?: string | null;
  assetId?: string;
  tag?: string;
  source?: "lab" | "character" | "upload";
};

export function stashStudioEdit(value: StashedEdit) {
  sessionStorage.setItem(EDIT_STASH_KEY, JSON.stringify(value));
}

export function readStudioEdit(): StashedEdit | null {
  try {
    const raw = sessionStorage.getItem(EDIT_STASH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StashedEdit;
  } catch {
    return null;
  }
}
