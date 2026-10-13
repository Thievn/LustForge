import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { minorReason } from "../_shared/adultGuard.ts";
import { chargeStudio, refundOne } from "../_shared/studioBilling.ts";
import { enhancePrompt } from "../_shared/studioGrok.ts";
import { gate, json } from "../_shared/studioHttp.ts";
import { isLustforgeAdminUser } from "../_shared/requireSessionUser.ts";
import { submitWorkflow } from "../_shared/studioRunpod.ts";
import { ensureAdult, parseDataUrl } from "../_shared/studioSafety.ts";
import { zimage, zimagePose } from "../_shared/studioWorkflows.ts";

const STYLES: Record<string, string> = {
  photoreal: "Ultra-realistic photograph, natural skin texture, 85mm lens, sharp focus.",
  cinematic: "Cinematic film still, anamorphic lens, dramatic color grading, shallow depth of field, film grain.",
  boudoir: "Intimate boudoir photography, soft window light, warm tones, tasteful sensual mood.",
  semireal: "Semi-realistic digital painting, stylized 3D render with soft painterly shading.",
  anime: "anime style, cel shading, vibrant colors, adult character",
  goth: "Gothic portrait, black lace, candlelight, rich shadows.",
  fantasy: "High-fantasy cinematic portrait of an adult, ornate costume, magical rim light.",
};

Deno.serve(async (req) => {
  const session = await gate(req);
  if ("response" in session) return session.response;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);
    const user = session.user;

    if (body?.action === "enhance") {
      const prompt = String(body.prompt ?? "").slice(0, 2000);
      const blocked = minorReason(prompt);
      if (blocked) return json({ error: blocked, code: "MINOR_BLOCKED" }, 400);
      const mode = body.mode === "edit" ? "edit" : "create";
      const next = await enhancePrompt(prompt, mode);
      const blockedNext = minorReason(next);
      if (blockedNext) return json({ error: blockedNext, code: "MINOR_BLOCKED" }, 400);
      return json({ prompt: next });
    }

    const variations = Math.max(1, Math.min(4, Number(body?.variations ?? 1) || 1));
    const style = STYLES[String(body?.styleId ?? "photoreal")] ?? STYLES.photoreal;
    const scene = String(body?.scene ?? "").slice(0, 300);
    const poseHint = String(body?.poseHint ?? "").slice(0, 300);
    const poseId = String(body?.poseId ?? "").trim();
    const userText = String(body?.prompt ?? "").slice(0, 800);
    const companionId = String(body?.companionId ?? "").trim();
    const admin = await isLustforgeAdminUser(user);
    const profile = await svc.from("profiles").select("is_catalog_owner").eq("user_id", user.id).maybeSingle();
    const catalogOwner = admin || Boolean(profile.data?.is_catalog_owner);

    let identity = "";
    if (companionId) {
      const raw = companionId.startsWith("cc-") ? companionId.slice(3) : companionId;
      const row = await svc.from("custom_characters").select("name, appearance, descriptor, user_id").eq("id", raw).maybeSingle();
      if (row.data && (row.data.user_id === user.id || catalogOwner)) {
        identity = [row.data.name, row.data.descriptor, row.data.appearance].map((item: unknown) => String(item ?? "").trim()).filter(Boolean).join(", ");
      }
    }

    const prompt = ensureAdult([style, identity, scene, poseHint, userText].filter(Boolean).join(", "));
    const blocked = minorReason(prompt);
    if (blocked) return json({ error: blocked, code: "MINOR_BLOCKED" }, 400);

    const charge = await chargeStudio(svc, user, variations);
    if (!charge.ok) return json({ error: charge.error, code: charge.code }, charge.status);

    let poseImage: string | null = null;
    if (poseId) {
      const parsed = parseDataUrl(String(body?.poseDataUrl ?? ""));
      if (parsed && parsed.bytes.byteLength < 2_000_000) {
        let binary = "";
        for (let i = 0; i < parsed.bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...parsed.bytes.subarray(i, i + 0x8000));
        }
        poseImage = btoa(binary);
      }
    }

    const baseSeed = Number.isFinite(Number(body?.seed)) ? Number(body?.seed) : Math.floor(Math.random() * 1_000_000_000);
    const jobs: Array<Record<string, unknown>> = [];
    let submitted = 0;
    try {
      for (let i = 0; i < variations; i++) {
        const seed = baseSeed + i;
        const workflow = poseImage ? zimagePose(prompt, { seed }) : zimage(prompt, { seed });
        const images = poseImage ? [{ name: "pose.png", image: poseImage }] : [];
        const runpodId = await submitWorkflow(workflow, images);
        const inserted = await svc
          .from("studio_jobs")
          .insert({
            user_id: user.id,
            runpod_id: runpodId,
            status: "IN_QUEUE",
            kind: "generate",
            source_tag: "lab",
            prompt,
            companion_id: companionId || null,
            charge_mode: charge.mode,
            seed,
          })
          .select("id, status, seed")
          .single();
        if (inserted.error || !inserted.data) throw new Error(inserted.error?.message || "Could not record the job");
        submitted += 1;
        jobs.push({ id: inserted.data.id, status: inserted.data.status, seed });
      }
    } catch (err) {
      for (let i = submitted; i < variations; i++) await refundOne(svc, user.id, charge.mode);
      const message = err instanceof Error ? err.message : String(err);
      const status = message === "IMAGE_NOT_CONFIGURED" ? 503 : 502;
      return json({ error: message, code: message === "IMAGE_NOT_CONFIGURED" ? message : "IMAGE_FAILED", jobs }, status);
    }

    return json({ jobs, credits: charge.credits, freeLeft: charge.freeLeft, prompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message.slice(0, 400) }, 500);
  }
});
