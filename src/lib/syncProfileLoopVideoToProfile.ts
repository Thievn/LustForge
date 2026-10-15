import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionInvokeMessage } from "@/lib/edgeFunction";
import {
  invokeGenerateProfileLoopVideo,
  profileLoopVideoResponseSucceeded,
  saveProfileLoopJobId,
} from "@/lib/invokeGenerateProfileLoopVideo";

export type SyncProfileLoopResult = {
  synced: boolean;
  publicUrl?: string;
  message?: string;
};

/**
 * Re-attaches the latest saved loop MP4 (jobs table, gallery, or row) to profile + override.
 * No FC charge; does not call xAI unless a stuck finalize job needs upload.
 */
export async function syncProfileLoopVideoToProfile(
  companionId: string,
  options?: { repair?: boolean },
): Promise<SyncProfileLoopResult> {
  const cid = companionId.trim();
  if (!cid) return { synced: false, message: "Missing companion id." };

  const { data, error } = await supabase.functions.invoke("generate-profile-loop-video", {
    body: { companionId: cid, action: options?.repair ? "repair" : "sync" },
  });

  if (profileLoopVideoResponseSucceeded(data)) {
    const url = (data as { publicUrl?: string }).publicUrl;
    return { synced: true, publicUrl: url };
  }

  const d = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  if (d?.success === true && d.phase === "poll" && typeof d.jobId === "string") {
    const jobId = d.jobId.trim();
    saveProfileLoopJobId(cid, jobId);
    try {
      const polled = await invokeGenerateProfileLoopVideo({
        companionId: cid,
        jobId,
      });
      const url = polled.publicUrl?.trim();
      if (url) return { synced: true, publicUrl: url };
    } catch {
      return {
        synced: false,
        message: "Her loop is still coming together — keep this page open, or tap Generate loop video.",
      };
    }
  }
  if (d?.success === true && d.synced === false) {
    return {
      synced: false,
      message: typeof d.message === "string" ? d.message : "No loop video to sync.",
    };
  }

  if (error) {
    throw new Error(await getEdgeFunctionInvokeMessage(error, data));
  }
  const errMsg = d?.error;
  if (typeof errMsg === "string" && errMsg.trim()) {
    throw new Error(errMsg.trim());
  }
  return { synced: false, message: "Sync did not return a loop URL." };
}
