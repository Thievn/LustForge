import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../supabase/functions/_shared/studioBilling.ts", () => ({
  refundOne: vi.fn(async () => undefined),
}));
vi.mock("../../supabase/functions/_shared/studioPush.ts", () => ({
  sendStudioPush: vi.fn(async () => 0),
}));
vi.mock("../../supabase/functions/_shared/studioRunpod.ts", () => ({
  readRunpod: vi.fn(),
  bytesFromRunpodOutput: vi.fn(),
}));
vi.mock("../../supabase/functions/_shared/studioStore.ts", () => ({
  saveStudioImage: vi.fn(),
}));
vi.mock("../../supabase/functions/_shared/studioSafety.ts", () => ({
  isSourceTag: (value: unknown) => value === "lab" || value === "character" || value === "upload",
}));

import { refundOne } from "../../supabase/functions/_shared/studioBilling";
import {
  isRunpodMissingMessage,
  runpodReadResult,
  STUDIO_JOB_FAILED_LINE,
  STUDIO_OPEN_JOB_MAX_MS,
  studioJobExpired,
} from "../../supabase/functions/_shared/studioJobOutcome";
import { bytesFromRunpodOutput, readRunpod } from "../../supabase/functions/_shared/studioRunpod";
import { saveStudioImage } from "../../supabase/functions/_shared/studioStore";
import { editSourceImageUrl, settleStudioJob, sweepOpenStudioJobs } from "../../supabase/functions/_shared/studioSettle";

const refund = vi.mocked(refundOne);
const read = vi.mocked(readRunpod);
const save = vi.mocked(saveStudioImage);
const outputBytes = vi.mocked(bytesFromRunpodOutput);

function ago(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

function job(partial: Record<string, unknown> = {}) {
  return {
    id: "job",
    user_id: "user-1",
    runpod_id: "rp",
    status: "IN_QUEUE",
    charge_mode: "credits",
    refunded: false,
    created_at: ago(60_000),
    ...partial,
  };
}

function fakeSvc(rows: Record<string, unknown>[]) {
  const updates: Array<Record<string, unknown>> = [];
  const svc = {
    from(table: string) {
      if (table !== "studio_jobs") throw new Error(`unexpected table ${table}`);
      return {
        select() {
          return {
            in() {
              return {
                order() {
                  return {
                    limit: async () => ({ data: rows, error: null }),
                  };
                },
              };
            },
          };
        },
        update(value: Record<string, unknown>) {
          return {
            eq(_col: string, id: string) {
              updates.push({ id, ...value });
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
  return { svc, updates };
}

describe("studio job outcome", () => {
  it("treats a Runpod 404 as a failed read and still throws other status errors", () => {
    expect(isRunpodMissingMessage("Runpod status failed (404)")).toBe(true);
    expect(isRunpodMissingMessage("Runpod status failed (500)")).toBe(false);
    expect(runpodReadResult(404, { error: "not found" })).toEqual({ status: "FAILED", error: STUDIO_JOB_FAILED_LINE });
    expect(runpodReadResult(200, { status: "IN_QUEUE" }).status).toBe("IN_QUEUE");
    expect(() => runpodReadResult(500, null)).toThrow("Runpod status failed (500)");
  });

  it("expires an open job once it has been waiting 30 minutes", () => {
    expect(studioJobExpired(ago(STUDIO_OPEN_JOB_MAX_MS - 1000))).toBe(false);
    expect(studioJobExpired(ago(STUDIO_OPEN_JOB_MAX_MS))).toBe(true);
    expect(studioJobExpired(ago(31 * 60 * 1000))).toBe(true);
    expect(studioJobExpired("")).toBe(false);
  });
});

describe("studio sweep", () => {
  beforeEach(() => {
    refund.mockClear();
    read.mockReset();
  });

  it("fails and refunds a missing Runpod job without stopping the jobs after it", async () => {
    const stuck = job({
      id: "cc06f7ce-2ac9-4ffa-9e0b-e06daa0eeab6",
      runpod_id: "gone",
      created_at: "2026-10-14T00:00:00.000Z",
    });
    const boom = job({ id: "boom", runpod_id: "boom-id", created_at: ago(5 * 60 * 1000) });
    const missing = job({ id: "missing", runpod_id: "missing-id", created_at: ago(5 * 60 * 1000) });
    const fresh = job({ id: "fresh", runpod_id: "fresh-id" });
    read.mockImplementation(async (id: string) => {
      if (id === "missing-id") throw new Error("Runpod status failed (404)");
      if (id === "fresh-id") return { status: "IN_PROGRESS" };
      throw new Error("Runpod status failed (500)");
    });
    const { svc, updates } = fakeSvc([stuck, boom, missing, fresh]);

    await expect(sweepOpenStudioJobs(svc)).resolves.toBe(3);

    expect(read).not.toHaveBeenCalledWith("gone");
    expect(updates.map((row) => row.id)).toEqual([stuck.id, missing.id, fresh.id]);
    expect(updates[0]).toMatchObject({ status: "FAILED", refunded: true, error: STUDIO_JOB_FAILED_LINE });
    expect(updates[1]).toMatchObject({ status: "FAILED", refunded: true, error: STUDIO_JOB_FAILED_LINE });
    expect(updates[2]).toMatchObject({ status: "IN_PROGRESS" });
    expect(refund).toHaveBeenCalledTimes(2);
    expect(refund).toHaveBeenCalledWith(svc, "user-1", "credits");
  });

  it("refunds a young 404 through the failed-status path and leaves a recent queue job alone", async () => {
    read.mockResolvedValueOnce({ status: "FAILED", error: STUDIO_JOB_FAILED_LINE });
    const { svc, updates } = fakeSvc([]);
    const settled = await settleStudioJob(svc, job({ id: "young-404", refunded: false }));
    expect(settled.status).toBe("FAILED");
    expect(updates[0]).toMatchObject({ status: "FAILED", refunded: true });
    expect(refund).toHaveBeenCalledTimes(1);

    refund.mockClear();
    read.mockResolvedValueOnce({ status: "IN_QUEUE" });
    const recent = await settleStudioJob(svc, job({ id: "young-ok", created_at: ago(29 * 60 * 1000) }));
    expect(recent.status).toBe("IN_QUEUE");
    expect(refund).not.toHaveBeenCalled();
  });

  it("does not refund a job that was already refunded", async () => {
    read.mockRejectedValueOnce(new Error("Runpod status failed (404)"));
    const { svc, updates } = fakeSvc([]);
    await settleStudioJob(svc, job({ refunded: true }));
    expect(refund).not.toHaveBeenCalled();
    expect(updates[0]).toMatchObject({ status: "FAILED", refunded: true });
  });

  it("writes the edit's original onto the gallery image and leaves generates without one", async () => {
    outputBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));
    save.mockResolvedValue({
      assetId: "asset-1",
      imageUrl: "storage://lf-chat-media/user-1/studio/out.png",
      signedUrl: "https://signed.example/out.png",
      tag: "lab.sig",
      bucket: "lf-chat-media",
      path: "user-1/studio/out.png",
    });
    const { svc } = settleSvc();
    const source = "storage://lf-chat-media/user-1/studio/before.jpg";
    const settled = await settleStudioJob(
      svc,
      job({ kind: "edit", source_tag: "lab", prompt: "shorter hair", subject_url: source, companion_id: null }),
      { status: "COMPLETED", output: {} },
    );
    expect(settled.status).toBe("COMPLETED");
    expect(settled.subjectUrl).toBe("https://signed.example/before.jpg");
    expect(save).toHaveBeenCalledWith(svc, expect.objectContaining({
      kind: "edit",
      sourceImageUrl: source,
      userId: "user-1",
    }));

    save.mockClear();
    outputBytes.mockResolvedValue(new Uint8Array([4]));
    const { svc: generateSvc } = settleSvc();
    await settleStudioJob(
      generateSvc,
      job({ kind: "generate", subject_url: source }),
      { status: "COMPLETED", output: {} },
    );
    expect(save).toHaveBeenCalledWith(generateSvc, expect.objectContaining({ kind: "generate", sourceImageUrl: null }));
  });
});

describe("edit source link", () => {
  it("keeps a storage path and collapses a signed Supabase URL", () => {
    const stored = "storage://lf-chat-media/user-1/studio/before.jpg";
    expect(editSourceImageUrl({ kind: "edit", subject_url: stored })).toBe(stored);
    expect(editSourceImageUrl({
      kind: "edit",
      subject_url: "https://abc.supabase.co/storage/v1/object/sign/lf-chat-media/user-1/studio/before.jpg?token=expired",
    })).toBe(stored);
    expect(editSourceImageUrl({ kind: "generate", subject_url: stored })).toBeNull();
    expect(editSourceImageUrl({ kind: "edit", subject_url: "" })).toBeNull();
  });
});

function settleSvc() {
  const svc = {
    from(table: string) {
      if (table !== "studio_jobs") throw new Error(`unexpected table ${table}`);
      return {
        update() {
          return {
            eq() {
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
    storage: {
      from() {
        return {
          createSignedUrl: async () => ({ data: { signedUrl: "https://signed.example/before.jpg" } }),
        };
      },
    },
  };
  return { svc };
}
