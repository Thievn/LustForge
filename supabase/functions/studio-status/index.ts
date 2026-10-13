import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { refundOne } from "../_shared/studioBilling.ts";
import { gate, json } from "../_shared/studioHttp.ts";
import { bytesFromRunpodOutput, readRunpod } from "../_shared/studioRunpod.ts";
import { isSourceTag } from "../_shared/studioSafety.ts";
import { saveStudioImage } from "../_shared/studioStore.ts";

Deno.serve(async (req) => {
  const session = await gate(req);
  if ("response" in session) return session.response;
  try {
    const body = (await req.json().catch(() => null)) as { jobIds?: string[] } | null;
    const ids = Array.isArray(body?.jobIds) ? body!.jobIds.map((id) => String(id)).slice(0, 4) : [];
    if (!ids.length) return json({ error: "jobIds required" }, 400);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);
    const jobs = [];

    for (const id of ids) {
      const { data: job } = await svc.from("studio_jobs").select("*").eq("id", id).eq("user_id", session.user.id).maybeSingle();
      if (!job) {
        jobs.push({ id, status: "FAILED", error: "Job not found" });
        continue;
      }
      if (job.image_url && job.asset_id) {
        const signed = await svc.storage.from("lf-chat-media").createSignedUrl(
          String(job.image_url).replace(/^storage:\/\/lf-chat-media\//, ""),
          60 * 60,
        );
        jobs.push({
          id,
          status: "COMPLETED",
          imageUrl: signed.data?.signedUrl ?? job.image_url,
          storageUrl: job.image_url,
          assetId: job.asset_id,
          source: job.source_tag,
          seed: job.seed,
        });
        continue;
      }
      if (!job.runpod_id) {
        jobs.push({ id, status: job.status, error: job.error });
        continue;
      }
      const remote = await readRunpod(String(job.runpod_id));
      if (remote.status === "COMPLETED") {
        try {
          const bytes = await bytesFromRunpodOutput(remote.output);
          const source = isSourceTag(job.source_tag) ? job.source_tag : "lab";
          const saved = await saveStudioImage(svc, {
            userId: session.user.id,
            companionId: job.companion_id,
            bytes,
            contentType: "image/png",
            source,
            prompt: String(job.prompt ?? "Studio"),
            kind: job.kind === "edit" ? "edit" : "generate",
          });
          await svc.from("studio_jobs").update({
            status: "COMPLETED",
            asset_id: saved.assetId,
            image_url: saved.imageUrl,
            updated_at: new Date().toISOString(),
          }).eq("id", id);
          jobs.push({
            id,
            status: "COMPLETED",
            imageUrl: saved.signedUrl,
            storageUrl: saved.imageUrl,
            assetId: saved.assetId,
            tag: saved.tag,
            source,
            seed: job.seed,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (!job.refunded) await refundOne(svc, session.user.id, String(job.charge_mode ?? ""));
          await svc.from("studio_jobs").update({
            status: "FAILED",
            error: message.slice(0, 300),
            refunded: true,
            updated_at: new Date().toISOString(),
          }).eq("id", id);
          jobs.push({ id, status: "FAILED", error: message });
        }
        continue;
      }
      if (remote.status === "FAILED" || remote.status === "CANCELLED" || remote.status === "TIMED_OUT") {
        if (!job.refunded) await refundOne(svc, session.user.id, String(job.charge_mode ?? ""));
        const error = remote.error || remote.status;
        await svc.from("studio_jobs").update({
          status: remote.status,
          error,
          refunded: true,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        jobs.push({ id, status: remote.status, error });
        continue;
      }
      await svc.from("studio_jobs").update({ status: remote.status, updated_at: new Date().toISOString() }).eq("id", id);
      jobs.push({ id, status: remote.status === "IN_PROGRESS" ? "IN_PROGRESS" : "IN_QUEUE" });
    }
    return json({ jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message.slice(0, 400) }, 500);
  }
});
