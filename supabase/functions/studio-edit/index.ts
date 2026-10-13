import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { minorReason } from "../_shared/adultGuard.ts";
import { chargeStudio, refundOne } from "../_shared/studioBilling.ts";
import { classifyEditText } from "../_shared/studioGrok.ts";
import { gate, json } from "../_shared/studioHttp.ts";
import { isLustforgeAdminUser } from "../_shared/requireSessionUser.ts";
import { submitWorkflow } from "../_shared/studioRunpod.ts";
import { EXPLICIT_UPLOAD_MESSAGE, parseDataUrl, type SourceTag } from "../_shared/studioSafety.ts";
import { poseCountsAsUpload, resolveImage, weakest } from "../_shared/studioStore.ts";
import { POSE_SET } from "../_shared/studioPoseIds.ts";
import { editLocksPixels, isClothingEdit, ORIENTATION_NEGATIVE, qwenEdit, withOrientationGuard } from "../_shared/studioWorkflows.ts";
import { resolveStackedEdit } from "../_shared/stackedEdit.ts";

function b64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function instructionFor(body: Record<string, unknown>): { tool: string; text: string; variations: number } {
  if (body.stacked === true) {
    const stacked = resolveStackedEdit(body);
    return { tool: stacked.tool, text: stacked.instruction, variations: stacked.variations };
  }
  const text = String(body.instruction ?? "").slice(0, 800);
  const tool = String(body.tool ?? "prompt");
  const variations = Math.max(1, Math.min(4, Number(body.variations ?? 1) || 1));
  if (tool === "fix") {
    const fix = String(body.fix ?? "face");
    if (fix === "hands") return { tool, variations, text: `Fix the hands: five fingers, natural adult anatomy. Keep the face, clothing, pose, and background identical. ${text}`.trim() };
    if (fix === "touch") return { tool, variations, text: `Subtle natural touch-up. Keep identity and clothing identical. ${text}`.trim() };
    return { tool, variations, text: `Fix the face: natural adult features, symmetrical eyes. Keep identity, clothing, pose, and background. ${text}`.trim() };
  }
  if (tool === "background") return { tool, variations, text: `Replace the background with ${text || "a soft studio backdrop"}. Keep the person identical.` };
  if (tool === "outfit") return { tool, variations, text: `Change the outfit to match the reference. Keep the face identical. ${text}`.trim() };
  if (tool === "pose") return { tool, variations, text: `Repose the person from image 1 so their whole body matches the stick-figure pose skeleton in image 2.${String(body.poseId ?? "").trim() ? ` Target pose: ${String(body.poseId).replace(/[^a-z0-9_]/gi, "").replace(/_/g, " ")}, full body in frame.` : ""} Keep the same face, hair, and outfit. ${text}`.trim() };
  if (tool === "brush") return { tool, variations, text: `Change only the white painted region. Leave everything else identical. ${text}`.trim() };
  return { tool, variations, text };
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

    const resolved = instructionFor(body);
    const instruction = resolved.text;
    if (!instruction.trim()) return json({ error: "Add an edit instruction." }, 400);
    const blocked = minorReason(instruction);
    if (blocked) return json({ error: blocked, code: "MINOR_BLOCKED" }, 400);

    const posePhrase = poseId && POSE_SET.has(poseId) ? `pose: ${poseId.replace(/_/g, " ")}` : "";
    const checkText = [
      String(body.instruction ?? "").slice(0, 800),
      String(body.background ?? "").slice(0, 300),
      posePhrase,
    ].map((part) => part.trim()).filter(Boolean).join(". ");
    const check = await classifyEditText(checkText);
    const explicit = check.explicit;
    console.log(JSON.stringify({ fn: "studio-edit", explicitCheck: check.reason, explicit, detail: check.detail ?? null }));
    const sources: SourceTag[] = [subject.source, ...outfits.map((item) => item.source)];
    if (poseCountsAsUpload(poseId, poseBytes, POSE_SET)) sources.push("upload");
    const inherited = weakest(sources);
    if (explicit && inherited === "upload") {
      return json({ error: EXPLICIT_UPLOAD_MESSAGE, code: "EXPLICIT_UPLOAD" }, 400);
    }

    const variations = resolved.variations;
    const strength = Math.max(0.2, Math.min(1, Number(body.strength ?? 1) || 1));
    const charge = await chargeStudio(svc, user, variations);
    if (!charge.ok) return json({ error: charge.error, code: charge.code }, charge.status);

    const images = [{ name: "subject.png", image: b64(subject.bytes) }];
    if (outfits[0]) images.push({ name: "outfit.png", image: b64(outfits[0].bytes) });
    if (poseBytes) images.push({ name: "pose.png", image: b64(poseBytes) });
    if (maskParsed) images.push({ name: "mask.png", image: b64(maskParsed.bytes) });

    const tool = resolved.tool;
    const userText = String(body.instruction ?? "");
    const guardTool = outfits.length ? "outfit" : tool;
    const prompt = withOrientationGuard(guardTool, instruction, userText);
    const negative = isClothingEdit(guardTool, userText) ? ORIENTATION_NEGATIVE : "";
    const flags = { outfit: Boolean(outfits[0]), pose: Boolean(poseBytes), mask: Boolean(maskParsed) };
    const lock = editLocksPixels(tool) || Boolean(outfits[0]) || Boolean(maskParsed);
    const companionId = String(body.companionId ?? "").trim() || null;
    const baseSeed = Math.floor(Math.random() * 1_000_000_000);
    const jobs: Array<Record<string, unknown>> = [];
    let submitted = 0;
    try {
      for (let i = 0; i < variations; i++) {
        const seed = baseSeed + i;
        const workflow = qwenEdit(prompt, { seed, denoise: strength, images: flags, lock, negative });
        const runpodId = await submitWorkflow(workflow, images);
        const inserted = await svc.from("studio_jobs").insert({
          user_id: user.id,
          runpod_id: runpodId,
          status: "IN_QUEUE",
          kind: "edit",
          source_tag: inherited,
          prompt,
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
      explicitCheck: check.reason,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string }).code;
    return json({ error: message.slice(0, 400), code }, code === "CAMERA_EXIF" ? 400 : 500);
  }
});
