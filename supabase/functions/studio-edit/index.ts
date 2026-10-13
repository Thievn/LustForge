import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { minorReason } from "../_shared/adultGuard.ts";
import { chargeStudio, refundOne } from "../_shared/studioBilling.ts";
import { textIsExplicit } from "../_shared/studioGrok.ts";
import { gate, json } from "../_shared/studioHttp.ts";
import { isLustforgeAdminUser } from "../_shared/requireSessionUser.ts";
import { submitWorkflow } from "../_shared/studioRunpod.ts";
import { EXPLICIT_UPLOAD_MESSAGE, parseDataUrl, type SourceTag } from "../_shared/studioSafety.ts";
import { poseCountsAsUpload, resolveImage, weakest } from "../_shared/studioStore.ts";
import { POSE_SET } from "../_shared/studioPoseIds.ts";
import { editLocksPixels, qwenEdit } from "../_shared/studioWorkflows.ts";

function b64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function instructionFor(body: Record<string, unknown>): string {
  const text = String(body.instruction ?? "").slice(0, 800);
  const tool = String(body.tool ?? "prompt");
  if (tool === "fix") {
    const fix = String(body.fix ?? "face");
    if (fix === "hands") return `Fix the hands: five fingers, natural adult anatomy. Keep the face, clothing, pose, and background identical. ${text}`.trim();
    if (fix === "touch") return `Subtle natural touch-up. Keep identity and clothing identical. ${text}`.trim();
    return `Fix the face: natural adult features, symmetrical eyes. Keep identity, clothing, pose, and background. ${text}`.trim();
  }
  if (tool === "background") return `Replace the background with ${text || "a soft studio backdrop"}. Keep the person identical.`;
  if (tool === "outfit") return `Change the outfit to match the reference. Keep the face identical. ${text}`.trim();
  if (tool === "pose") return `Change the pose to match the skeleton reference. Keep the face and outfit. ${text}`.trim();
  if (tool === "brush") return `Change only the white painted region. Leave everything else identical. ${text}`.trim();
  return text;
}

Deno.serve(async (req) => {
  const session = await gate(req);
  if ("response" in session) return session.response;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return json({ error: "Missing body" }, 400);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);
    const user = session.user;
    const admin = await isLustforgeAdminUser(user);
    const profile = await svc.from("profiles").select("is_catalog_owner").eq("user_id", user.id).maybeSingle();
    const catalogOwner = admin || Boolean(profile.data?.is_catalog_owner);

    const subjectRef = (body.subject ?? {}) as Record<string, unknown>;
    const subject = await resolveImage(svc, user.id, {
      assetId: String(subjectRef.assetId ?? "") || undefined,
      dataUrl: String(subjectRef.dataUrl ?? "") || undefined,
      tag: String(subjectRef.tag ?? "") || undefined,
      bucket: String(subjectRef.bucket ?? "") || undefined,
      path: String(subjectRef.path ?? "") || undefined,
      imageUrl: String(subjectRef.imageUrl ?? "") || undefined,
    }, catalogOwner);

    const outfitRefs = Array.isArray(body.outfitRefs) ? body.outfitRefs.slice(0, 3) : [];
    const outfits = [];
    for (const ref of outfitRefs) {
      const row = ref as Record<string, unknown>;
      outfits.push(await resolveImage(svc, user.id, {
        assetId: String(row.assetId ?? "") || undefined,
        dataUrl: String(row.dataUrl ?? "") || undefined,
        tag: String(row.tag ?? "") || undefined,
      }, catalogOwner));
    }

    const poseId = String(body.poseId ?? "").trim();
    const poseParsed = parseDataUrl(String(body.poseDataUrl ?? ""));
    const poseBytes = poseParsed && poseParsed.bytes.byteLength < 2_000_000 ? poseParsed.bytes : null;
    const maskParsed = parseDataUrl(String(body.maskDataUrl ?? ""));

    const instruction = instructionFor(body);
    if (!instruction.trim()) return json({ error: "Add an edit instruction." }, 400);
    const blocked = minorReason(instruction);
    if (blocked) return json({ error: blocked, code: "MINOR_BLOCKED" }, 400);

    const explicit = await textIsExplicit(instruction);
    const sources: SourceTag[] = [subject.source, ...outfits.map((item) => item.source)];
    if (poseCountsAsUpload(poseId, poseBytes, POSE_SET)) sources.push("upload");
    const inherited = weakest(sources);
    if (explicit && inherited === "upload") {
      return json({ error: EXPLICIT_UPLOAD_MESSAGE, code: "EXPLICIT_UPLOAD" }, 400);
    }

    const variations = Math.max(1, Math.min(4, Number(body.variations ?? 1) || 1));
    const strength = Math.max(0.2, Math.min(1, Number(body.strength ?? 1) || 1));
    const charge = await chargeStudio(svc, user, variations);
    if (!charge.ok) return json({ error: charge.error, code: charge.code }, charge.status);

    const images = [{ name: "subject.png", image: b64(subject.bytes) }];
    if (outfits[0]) images.push({ name: "outfit.png", image: b64(outfits[0].bytes) });
    if (poseBytes) images.push({ name: "pose.png", image: b64(poseBytes) });
    if (maskParsed) images.push({ name: "mask.png", image: b64(maskParsed.bytes) });

    const tool = String(body.tool ?? "prompt");
    const flags = { outfit: Boolean(outfits[0]), pose: Boolean(poseBytes), mask: Boolean(maskParsed) };
    const lock = editLocksPixels(tool);
    const companionId = String(body.companionId ?? "").trim() || null;
    const baseSeed = Math.floor(Math.random() * 1_000_000_000);
    const jobs: Array<Record<string, unknown>> = [];
    let submitted = 0;
    try {
      for (let i = 0; i < variations; i++) {
        const seed = baseSeed + i;
        const workflow = qwenEdit(instruction, { seed, denoise: strength, images: flags, lock });
        const runpodId = await submitWorkflow(workflow, images);
        const inserted = await svc.from("studio_jobs").insert({
          user_id: user.id,
          runpod_id: runpodId,
          status: "IN_QUEUE",
          kind: "edit",
          source_tag: inherited,
          prompt: instruction,
          companion_id: companionId,
          charge_mode: charge.mode,
          seed,
        }).select("id, status, seed").single();
        if (inserted.error || !inserted.data) throw new Error(inserted.error?.message || "Could not record the job");
        submitted += 1;
        jobs.push({ id: inserted.data.id, status: inserted.data.status, seed, source: inherited });
      }
    } catch (err) {
      for (let i = submitted; i < variations; i++) await refundOne(svc, user.id, charge.mode);
      const message = err instanceof Error ? err.message : String(err);
      const status = message === "IMAGE_NOT_CONFIGURED" ? 503 : 502;
      return json({ error: message, code: message === "IMAGE_NOT_CONFIGURED" ? message : "IMAGE_FAILED", jobs }, status);
    }

    return json({
      jobs,
      source: inherited,
      credits: charge.credits,
      freeLeft: charge.freeLeft,
      explicit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string }).code;
    return json({ error: message.slice(0, 400), code }, code === "CAMERA_EXIF" ? 400 : 500);
  }
});
