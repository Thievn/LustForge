import { bytesFromImageUrl } from "./storageArchive.ts";

function endpoint() {
  return Deno.env.get("RUNPOD_ENDPOINT_ID")?.trim() || "knag1yvb1tlqk3";
}

function apiKey() {
  const key = Deno.env.get("RUNPOD_API_KEY")?.trim();
  if (!key) throw new Error("IMAGE_NOT_CONFIGURED");
  return key;
}

export type RunpodImage = { name: string; image: string };

function webhookUrl(): string | null {
  const secret = Deno.env.get("STUDIO_CRON_SECRET")?.trim();
  const base = Deno.env.get("SUPABASE_URL")?.trim();
  if (!secret || !base) return null;
  return `${base.replace(/\/$/, "")}/functions/v1/studio-settle?key=${encodeURIComponent(secret)}`;
}

export async function submitWorkflow(
  workflow: Record<string, unknown>,
  images: RunpodImage[],
): Promise<string> {
  const key = apiKey();
  const payload: Record<string, unknown> = { input: { workflow, images } };
  const hook = webhookUrl();
  if (hook) payload.webhook = hook;
  const started = await fetch(`https://api.runpod.ai/v2/${endpoint()}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await started.json().catch(() => null)) as { id?: string; error?: string } | null;
  if (!started.ok || !body?.id) {
    throw new Error(body?.error || `Runpod run failed (${started.status})`);
  }
  return body.id;
}

export async function readRunpod(jobId: string): Promise<{ status: string; output?: unknown; error?: string }> {
  const key = apiKey();
  const res = await fetch(`https://api.runpod.ai/v2/${endpoint()}/status/${jobId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = (await res.json().catch(() => null)) as { status?: string; output?: unknown; error?: string } | null;
  if (!res.ok) throw new Error(body?.error || `Runpod status failed (${res.status})`);
  return { status: body?.status ?? "IN_QUEUE", output: body?.output, error: body?.error };
}

function pickImagePayload(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (typeof output !== "object") return null;
  const row = output as Record<string, unknown>;
  for (const key of ["image", "image_url", "url", "image_base64", "message"]) {
    if (typeof row[key] === "string" && row[key]) return String(row[key]);
  }
  const images = row.images;
  if (Array.isArray(images) && images.length) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const nested = first as Record<string, unknown>;
      for (const key of ["image", "url", "data", "image_base64"]) {
        if (typeof nested[key] === "string") return String(nested[key]);
      }
    }
  }
  return null;
}

export async function bytesFromRunpodOutput(output: unknown): Promise<Uint8Array> {
  const candidate = pickImagePayload(output);
  if (!candidate) throw new Error("Runpod returned no image");
  if (candidate.startsWith("http") || candidate.startsWith("data:")) {
    return (await bytesFromImageUrl(candidate)).bytes;
  }
  const clean = candidate.replace(/^data:image\/\w+;base64,/, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
