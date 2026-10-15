/** How long an open studio job may stay unfinished before the sweep refunds it. */
export const STUDIO_OPEN_JOB_MAX_MS = 30 * 60 * 1000;

/** Shown if a job row stores an error the Lab can surface. Matches studioFailedLine. */
export const STUDIO_JOB_FAILED_LINE = "She couldn't finish that picture. If it took a credit, it comes back.";

export function studioJobExpired(createdAt: unknown, now = Date.now(), maxAgeMs = STUDIO_OPEN_JOB_MAX_MS): boolean {
  if (typeof createdAt !== "string" || !createdAt) return false;
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return false;
  return now - created >= maxAgeMs;
}

/** True for the status error Runpod returns when the job id is gone. */
export function isRunpodMissingMessage(message: string): boolean {
  return /Runpod status failed \(404\)/.test(message);
}

type RunpodBody = { status?: string; output?: unknown; error?: string } | null;

/** Map a Runpod status HTTP response. A 404 is a finished failure, not a thrown sweep error. */
export function runpodReadResult(httpStatus: number, body: RunpodBody): { status: string; output?: unknown; error?: string } {
  if (httpStatus === 404) return { status: "FAILED", error: STUDIO_JOB_FAILED_LINE };
  if (httpStatus < 200 || httpStatus >= 300) {
    throw new Error(body?.error || `Runpod status failed (${httpStatus})`);
  }
  return { status: body?.status ?? "IN_QUEUE", output: body?.output, error: body?.error };
}
