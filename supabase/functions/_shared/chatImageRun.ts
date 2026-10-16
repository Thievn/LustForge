import { poseCanvasSize, posePngBase64 } from "./poseSkeletonPng.ts";
import { zimage, zimagePose } from "./studioWorkflows.ts";

export type ChatRunpodImage = { name: string; image: string };

/**
 * ComfyUI body for a chat still.
 * A pose id that has a skeleton uses the pose graph and attaches `pose.png`.
 * Anything else is plain Z-Image, same as Studio create without a pose.
 */
export async function buildChatImageRun(
  prompt: string,
  seed: number,
  poseId: string | null,
): Promise<{ workflow: Record<string, unknown>; images: ChatRunpodImage[] }> {
  const png = poseId ? await posePngBase64(poseId) : null;
  const size = poseId && png ? poseCanvasSize(poseId) : null;
  if (poseId && png && size) {
    return {
      workflow: zimagePose(prompt, { seed, w: size.w, h: size.h }),
      images: [{ name: "pose.png", image: png }],
    };
  }
  return { workflow: zimage(prompt, { seed }), images: [] };
}

const TERMINAL_FAIL = new Set(["FAILED", "CANCELLED", "TIMED_OUT"]);

export async function pollRunpodBytes(
  jobId: string,
  deps: {
    read: (id: string) => Promise<{ status: string; output?: unknown; error?: string }>;
    bytes: (output: unknown) => Promise<Uint8Array>;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
    timeoutMs?: number;
    intervalMs?: number;
  },
): Promise<Uint8Array> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = deps.now ?? (() => Date.now());
  const timeoutMs = deps.timeoutMs ?? 55_000;
  const intervalMs = deps.intervalMs ?? 1_500;
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    await sleep(intervalMs);
    const status = await deps.read(jobId);
    const state = status.status ?? "";
    if (TERMINAL_FAIL.has(state)) throw new Error(status.error || state);
    if (state === "COMPLETED") return deps.bytes(status.output);
  }
  throw new Error("Runpod timed out");
}
