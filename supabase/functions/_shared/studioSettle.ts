import { refundOne } from "./studioBilling.ts";
import { isRunpodMissingMessage, STUDIO_JOB_FAILED_LINE, studioJobExpired } from "./studioJobOutcome.ts";
import { sendStudioPush } from "./studioPush.ts";
import { bytesFromRunpodOutput, readRunpod } from "./studioRunpod.ts";
import { isSourceTag } from "./studioSafety.ts";
import { durableImageRef } from "./storageArchive.ts";
import { saveStudioImage } from "./studioStore.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

export type SettledJob = {
  id: string;
  status: string;
  imageUrl?: string;
  storageUrl?: string;
  assetId?: string;
  tag?: string;
  source?: string;
  seed?: number;
  error?: string;
  kind?: string;
  companionId?: string | null;
  subjectUrl?: string | null;
  createdAt?: string;
};

const TERMINAL_FAIL = new Set(["FAILED", "CANCELLED", "TIMED_OUT"]);

function isOpen(job: Record<string, unknown>): boolean {
  if (job.asset_id && job.image_url) return false;
  const status = String(job.status ?? "");
  if (TERMINAL_FAIL.has(status)) return false;
  if (status === "COMPLETED" && job.asset_id) return false;
  return Boolean(job.runpod_id);
}

/** Gallery compare source for an edit. Storage URLs are normalized so a signed link cannot expire. */
export function editSourceImageUrl(job: Record<string, unknown>): string | null {
  if (String(job.kind ?? "") !== "edit") return null;
  const raw = typeof job.subject_url === "string" ? job.subject_url.trim() : "";
  if (!raw) return null;
  return durableImageRef(raw) || raw;
}

async function presentUrl(svc: Svc, url: unknown): Promise<string | null> {
  const value = typeof url === "string" ? url.trim() : "";
  if (!value) return null;
  if (!value.startsWith("storage://")) return value;
  const rest = value.slice("storage://".length);
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  const bucket = rest.slice(0, slash);
  let path = rest.slice(slash + 1);
  try {
    path = decodeURIComponent(path);
  } catch {
    /* Keep the raw path when it is not encoded. */
  }
  const bucketApi = svc.storage.from(bucket);
  if (bucket === "companion-images" && typeof bucketApi.getPublicUrl === "function") {
    return bucketApi.getPublicUrl(path)?.data?.publicUrl ?? null;
  }
  const signed = await bucketApi.createSignedUrl(path, 60 * 60);
  return signed?.data?.signedUrl ?? null;
}

export function jobView(job: Record<string, unknown>, extra: Partial<SettledJob> = {}): SettledJob {
  return {
    id: String(job.id),
    status: String(extra.status ?? job.status ?? "IN_QUEUE"),
    imageUrl: extra.imageUrl,
    storageUrl: extra.storageUrl ?? (typeof job.image_url === "string" ? job.image_url : undefined),
    assetId: extra.assetId ?? (job.asset_id ? String(job.asset_id) : undefined),
    tag: extra.tag,
    source: extra.source ?? (isSourceTag(job.source_tag) ? job.source_tag : undefined),
    seed: job.seed == null ? undefined : Number(job.seed),
    error: extra.error ?? (typeof job.error === "string" ? job.error : undefined),
    kind: typeof job.kind === "string" ? job.kind : undefined,
    companionId: job.companion_id == null ? null : String(job.companion_id),
    subjectUrl: extra.subjectUrl ?? (typeof job.subject_url === "string" ? job.subject_url : null),
    createdAt: typeof job.created_at === "string" ? job.created_at : undefined,
  };
}

async function markNotified(svc: Svc, id: string) {
  const updated = await svc.from("studio_jobs").update({ notified_at: new Date().toISOString() }).eq("id", id);
  if (updated.error && /notified_at|column/i.test(updated.error.message ?? "")) return;
}

export async function settleStudioJob(
  svc: Svc,
  job: Record<string, unknown>,
  remote?: { status: string; output?: unknown; error?: string },
): Promise<SettledJob> {
  const id = String(job.id);
  if (job.asset_id && job.image_url) {
    const imageUrl = await presentUrl(svc, job.image_url);
    const subjectUrl = await presentUrl(svc, job.subject_url);
    return jobView(job, { status: "COMPLETED", imageUrl: imageUrl ?? undefined, subjectUrl });
  }
  if (!isOpen(job)) {
    const subjectUrl = await presentUrl(svc, job.subject_url);
    return jobView(job, { subjectUrl, status: TERMINAL_FAIL.has(String(job.status)) ? String(job.status) : String(job.status || "FAILED") });
  }

  if (!remote && studioJobExpired(job.created_at)) {
    console.error(`studio job ${id} marked failed: open longer than 30 minutes`);
    return failAndRefund(svc, job, "FAILED", STUDIO_JOB_FAILED_LINE);
  }

  let remoteStatus = remote;
  if (!remoteStatus) {
    try {
      remoteStatus = await readRunpod(String(job.runpod_id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!isRunpodMissingMessage(message)) throw err;
      console.error(`studio job ${id} marked failed: runpod 404`);
      return failAndRefund(svc, job, "FAILED", STUDIO_JOB_FAILED_LINE);
    }
  }
  if (remoteStatus.status === "COMPLETED") {
    try {
      const bytes = await bytesFromRunpodOutput(remoteStatus.output);
      const source = isSourceTag(job.source_tag) ? job.source_tag : "lab";
      const saved = await saveStudioImage(svc, {
        userId: String(job.user_id),
        companionId: job.companion_id ? String(job.companion_id) : null,
        bytes,
        contentType: "image/png",
        source,
        prompt: String(job.prompt ?? "Studio"),
        kind: job.kind === "edit" ? "edit" : "generate",
        sourceImageUrl: editSourceImageUrl(job),
      });
      await svc.from("studio_jobs").update({
        status: "COMPLETED",
        asset_id: saved.assetId,
        image_url: saved.imageUrl,
        error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (!job.notified_at) {
        await sendStudioPush(svc, String(job.user_id), {
          title: "She's ready",
          body: "Her new picture is waiting.",
          url: `/gallery?picture=${encodeURIComponent(saved.imageUrl)}`,
          tag: `lf-studio-${id}`,
        });
        await markNotified(svc, id);
      }
      const subjectUrl = await presentUrl(svc, job.subject_url);
      return jobView(job, {
        status: "COMPLETED",
        imageUrl: saved.signedUrl,
        storageUrl: saved.imageUrl,
        assetId: saved.assetId,
        tag: saved.tag,
        source,
        subjectUrl,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!job.refunded) await refundOne(svc, String(job.user_id), String(job.charge_mode ?? ""));
      await svc.from("studio_jobs").update({
        status: "FAILED",
        error: message.slice(0, 300),
        refunded: true,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      const subjectUrl = await presentUrl(svc, job.subject_url);
      return jobView(job, { status: "FAILED", error: message, subjectUrl });
    }
  }

  if (remoteStatus.status === "FAILED" || remoteStatus.status === "CANCELLED" || remoteStatus.status === "TIMED_OUT") {
    return failAndRefund(svc, job, remoteStatus.status, remoteStatus.error || remoteStatus.status);
  }

  const status = remoteStatus.status === "IN_PROGRESS" ? "IN_PROGRESS" : "IN_QUEUE";
  await svc.from("studio_jobs").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  const subjectUrl = await presentUrl(svc, job.subject_url);
  return jobView(job, { status, subjectUrl });
}

async function failAndRefund(svc: Svc, job: Record<string, unknown>, status: string, error: string): Promise<SettledJob> {
  const id = String(job.id);
  if (!job.refunded) await refundOne(svc, String(job.user_id), String(job.charge_mode ?? ""));
  await svc.from("studio_jobs").update({
    status,
    error: error.slice(0, 300),
    refunded: true,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  const subjectUrl = await presentUrl(svc, job.subject_url);
  return jobView(job, { status, error, subjectUrl });
}

export async function listUserStudioJobs(svc: Svc, userId: string): Promise<SettledJob[]> {
  const { data, error } = await svc
    .from("studio_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw new Error(error.message);
  const jobs: SettledJob[] = [];
  for (const job of data ?? []) {
    try {
      jobs.push(await settleStudioJob(svc, job as Record<string, unknown>));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`studio status skipped ${String((job as Record<string, unknown>).id)}: ${message}`);
      jobs.push(jobView(job as Record<string, unknown>));
    }
  }
  return jobs;
}

export async function sweepOpenStudioJobs(svc: Svc, limit = 12): Promise<number> {
  const { data, error } = await svc
    .from("studio_jobs")
    .select("*")
    .in("status", ["IN_QUEUE", "IN_PROGRESS", "queued"])
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  let n = 0;
  for (const job of data ?? []) {
    try {
      await settleStudioJob(svc, job as Record<string, unknown>);
      n += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`studio sweep skipped ${String((job as Record<string, unknown>).id)}: ${message}`);
    }
  }
  return n;
}

export async function settleByRunpodId(
  svc: Svc,
  runpodId: string,
  remote?: { status: string; output?: unknown; error?: string },
): Promise<SettledJob | null> {
  const { data } = await svc.from("studio_jobs").select("*").eq("runpod_id", runpodId).limit(1).maybeSingle();
  if (!data) return null;
  return settleStudioJob(svc, data as Record<string, unknown>, remote);
}
