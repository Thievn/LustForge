import { describe, expect, it, vi } from "vitest";
import { buildChatImageRun, pollRunpodBytes } from "../../supabase/functions/_shared/chatImageRun";
import {
  CHAT_IMAGE_FAILURE_LINE,
  chatImageErrorPayload,
  friendlyChatImageFailure,
  shouldSendChatImage,
} from "../../supabase/functions/_shared/chatImageCopy";
import { clearedFailedImageBubble } from "@/lib/chatImageFailure";

describe("chat image runpod body", () => {
  it("sends a Z-Image workflow instead of legacy simple params", async () => {
    const { workflow, images } = await buildChatImageRun("adult woman on a couch", 7, null);
    expect(images).toEqual([]);
    expect(workflow).not.toHaveProperty("prompt");
    expect(workflow).not.toHaveProperty("engine");
    expect(workflow).not.toHaveProperty("pose_id");
    const text = workflow.z4 as { inputs: { text: string } };
    const sampler = workflow.z7 as { inputs: { seed: number } };
    expect(text.inputs.text).toBe("adult woman on a couch");
    expect(sampler.inputs.seed).toBe(7);
    expect((workflow.z1 as { class_type: string }).class_type).toBe("UNETLoader");
  });

  it("uses the pose graph and attaches pose.png when a skeleton id is set", async () => {
    const { workflow, images } = await buildChatImageRun("adult woman", 3, "couch_lying_03");
    expect((workflow.p3 as { class_type: string }).class_type).toBe("ZImageFunControlnet");
    expect((workflow.z7 as { inputs: { model: unknown } }).inputs.model).toEqual(["p3", 0]);
    expect((workflow.p2 as { inputs: { image: string } }).inputs.image).toBe("pose.png");
    expect(images).toHaveLength(1);
    expect(images[0]?.name).toBe("pose.png");
    const binary = atob(images[0]!.image);
    expect(binary.slice(1, 4)).toBe("PNG");
    const latent = workflow.z6 as { inputs: { width: number; height: number } };
    expect(latent.inputs.width).toBeGreaterThan(0);
    expect(latent.inputs.height).toBeGreaterThan(0);
  });

  it("keeps a plain graph when the pose id is not a skeleton", async () => {
    const { workflow, images } = await buildChatImageRun("adult woman", 1, "not_a_pose");
    expect(workflow.p3).toBeUndefined();
    expect(images).toEqual([]);
  });
});

describe("pollRunpodBytes", () => {
  it("returns image bytes once the job completes", async () => {
    let t = 0;
    const read = vi.fn()
      .mockResolvedValueOnce({ status: "IN_QUEUE" })
      .mockResolvedValueOnce({ status: "COMPLETED", output: { image: "abc" } });
    const bytes = vi.fn(async () => new Uint8Array([9, 8, 7]));
    const out = await pollRunpodBytes("job-1", {
      read,
      bytes,
      sleep: async () => {
        t += 1500;
      },
      now: () => t,
    });
    expect(out).toEqual(new Uint8Array([9, 8, 7]));
    expect(bytes).toHaveBeenCalledWith({ image: "abc" });
  });

  it("throws the terminal error and times out while still queued", async () => {
    await expect(
      pollRunpodBytes("job-2", {
        read: async () => ({ status: "FAILED", error: "Missing 'workflow' parameter" }),
        bytes: async () => new Uint8Array(),
        sleep: async () => undefined,
        now: () => 0,
        timeoutMs: 10_000,
      }),
    ).rejects.toThrow("Missing 'workflow' parameter");

    let t = 0;
    await expect(
      pollRunpodBytes("job-3", {
        read: async () => ({ status: "IN_PROGRESS" }),
        bytes: async () => new Uint8Array(),
        sleep: async () => {
          t += 20_000;
        },
        now: () => t,
        timeoutMs: 55_000,
      }),
    ).rejects.toThrow("Runpod timed out");
  });
});

describe("chat image failure copy", () => {
  it("hides worker wording and clears the pending bubble", () => {
    expect(friendlyChatImageFailure("Missing 'workflow' parameter")).toBe(CHAT_IMAGE_FAILURE_LINE);
    expect(friendlyChatImageFailure("Missing 'workflow' parameter")).not.toMatch(/workflow|parameter/i);
    expect(chatImageErrorPayload("Missing 'workflow' parameter")).toEqual({
      error: CHAT_IMAGE_FAILURE_LINE,
      code: "IMAGE_FAILED",
      status: 502,
    });
    expect(chatImageErrorPayload("IMAGE_NOT_CONFIGURED")).toEqual({
      error: "IMAGE_NOT_CONFIGURED",
      code: "IMAGE_NOT_CONFIGURED",
      status: 503,
    });
    const cleared = clearedFailedImageBubble({
      id: "photo-1",
      pendingImage: true,
      blurred: true,
      imageUrl: "https://example.test/x.png",
      content: "She is sending a photo…",
    });
    expect(cleared.pendingImage).toBe(false);
    expect(cleared.blurred).toBe(false);
    expect(cleared.imageUrl).toBeNull();
    expect(cleared.content).toBe(CHAT_IMAGE_FAILURE_LINE);
    expect(cleared.content).not.toMatch(/workflow|parameter/i);
  });

  it("does not send another picture on the next message unless she is asked again", () => {
    expect(shouldSendChatImage(true, false, true)).toEqual({ send: false, failed: false });
    expect(shouldSendChatImage(true, true, true)).toEqual({ send: true, failed: true });
    expect(shouldSendChatImage(false, false, true)).toEqual({ send: true, failed: false });
    expect(shouldSendChatImage(false, true, false)).toEqual({ send: true, failed: false });
  });
});
