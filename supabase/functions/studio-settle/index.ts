import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { json } from "../_shared/studioHttp.ts";
import { settleByRunpodId, sweepOpenStudioJobs } from "../_shared/studioSettle.ts";

function secretOk(req: Request): boolean {
  const secret = (Deno.env.get("STUDIO_CRON_SECRET") ?? "").trim();
  if (!secret) return false;
  const url = new URL(req.url);
  const given = url.searchParams.get("key") ?? "";
  if (given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!secretOk(req)) return json({ error: "Not allowed" }, 401);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);
    const body = (await req.json().catch(() => null)) as { id?: string; status?: string; output?: unknown; error?: string; action?: string } | null;
    const url = new URL(req.url);
    if (body?.id && body.status) {
      const job = await settleByRunpodId(svc, String(body.id), {
        status: String(body.status),
        output: body.output,
        error: typeof body.error === "string" ? body.error : undefined,
      });
      return json({ ok: true, settled: Boolean(job), status: job?.status ?? null });
    }
    if (url.searchParams.get("action") === "sweep" || body?.action === "sweep") {
      const n = await sweepOpenStudioJobs(svc);
      return json({ ok: true, swept: n });
    }
    return json({ ok: true, settled: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message.slice(0, 300) }, 500);
  }
});
