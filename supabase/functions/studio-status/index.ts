import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { gate, json } from "../_shared/studioHttp.ts";
import { publicStudioError } from "../_shared/studioSafety.ts";
import { listUserStudioJobs, settleStudioJob } from "../_shared/studioSettle.ts";

Deno.serve(async (req) => {
  const session = await gate(req);
  if ("response" in session) return session.response;
  try {
    const body = (await req.json().catch(() => null)) as { jobIds?: string[]; action?: string } | null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);

    if (body?.action === "mine") {
      const jobs = await listUserStudioJobs(svc, session.user.id);
      for (const job of jobs) {
        if (job.error) job.error = publicStudioError(job.error);
      }
      return json({ jobs });
    }

    const ids = Array.isArray(body?.jobIds) ? body!.jobIds.map((id) => String(id)).filter(Boolean).slice(0, 8) : [];
    if (!ids.length) return json({ error: "jobIds required" }, 400);
    const jobs = [];
    for (const id of ids) {
      const { data: job } = await svc.from("studio_jobs").select("*").eq("id", id).eq("user_id", session.user.id).maybeSingle();
      if (!job) {
        jobs.push({ id, status: "FAILED", error: "That picture isn't here anymore." });
        continue;
      }
      const settled = await settleStudioJob(svc, job as Record<string, unknown>);
      if (settled.error) settled.error = publicStudioError(settled.error);
      jobs.push(settled);
    }
    return json({ jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: publicStudioError(message) }, 500);
  }
});
