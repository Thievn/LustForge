import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireSessionUser, isLustforgeAdminUser } from "../_shared/requireSessionUser.ts";
import { ADULT_ANCHOR, minorReason } from "../_shared/adultGuard.ts";
import { bytesFromImageUrl } from "../_shared/storageArchive.ts";
import { persistImageBytes } from "../_shared/persistChatImage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(obj: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function matchPose(text: string): string | null {
  const hay = text.toLowerCase();
  const rules: Array<[string, string[]]> = [
    ["couch_lying_03", ["couch", "sofa", "lying on", "laying on"]],
    ["mirror_selfie_01", ["mirror", "selfie"]],
    ["kneeling_02", ["on your knees", "kneeling"]],
    ["bed_reclining_04", ["in bed", "on the bed"]],
    ["standing_portrait_01", ["standing", "full body"]],
  ];
  let best: { id: string; score: number } | null = null;
  for (const [id, words] of rules) {
    const score = words.reduce((sum, word) => (hay.includes(word) ? sum + word.length : sum), 0);
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  }
  return best?.id ?? null;
}

async function runpodImage(prompt: string, seed: number, poseId: string | null): Promise<Uint8Array> {
  const key = Deno.env.get("RUNPOD_API_KEY")?.trim();
  const endpoint = Deno.env.get("RUNPOD_ENDPOINT_ID")?.trim() || "knag1yvb1tlqk3";
  if (!key) throw new Error("IMAGE_NOT_CONFIGURED");

  const started = await fetch(`https://api.runpod.ai/v2/${endpoint}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: {
        prompt,
        negative_prompt: "child, teen, underage, minor, lowres, deformed",
        seed,
        width: 768,
        height: 1024,
        steps: 8,
        engine: "zimage",
        pose_id: poseId,
      },
    }),
  });
  const startedJson = (await started.json().catch(() => null)) as { id?: string; error?: string } | null;
  if (!started.ok || !startedJson?.id) {
    throw new Error(startedJson?.error || `Runpod run failed (${started.status})`);
  }

  const deadline = Date.now() + 55_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const statusRes = await fetch(`https://api.runpod.ai/v2/${endpoint}/status/${startedJson.id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const statusJson = (await statusRes.json().catch(() => null)) as {
      status?: string;
      output?: unknown;
      error?: string;
    } | null;
    const state = statusJson?.status ?? "";
    if (state === "FAILED" || state === "CANCELLED" || state === "TIMED_OUT") {
      throw new Error(statusJson?.error || state);
    }
    if (state === "COMPLETED") return decodeRunpodOutput(statusJson?.output);
  }
  throw new Error("Runpod timed out");
}

async function decodeRunpodOutput(output: unknown): Promise<Uint8Array> {
  const candidate = pickImagePayload(output);
  if (!candidate) throw new Error("Runpod returned no image");
  if (candidate.startsWith("http") || candidate.startsWith("data:")) {
    const downloaded = await bytesFromImageUrl(candidate);
    return downloaded.bytes;
  }
  const clean = candidate.replace(/^data:image\/\w+;base64,/, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pickImagePayload(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (typeof output !== "object") return null;
  const row = output as Record<string, unknown>;
  for (const key of ["image", "image_url", "url", "image_base64"]) {
    if (typeof row[key] === "string" && row[key]) return String(row[key]);
  }
  const images = row.images;
  if (Array.isArray(images) && images.length) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const nested = first as Record<string, unknown>;
      for (const key of ["image", "url", "data"]) {
        if (typeof nested[key] === "string") return String(nested[key]);
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sessionGate = await requireSessionUser(req);
    if ("response" in sessionGate) return sessionGate.response;
    const user = sessionGate.user;
    const admin = await isLustforgeAdminUser(user);

    const body = (await req.json().catch(() => null)) as {
      companionId?: string;
      descriptor?: string;
      seed?: number;
      scene?: string;
      outfit?: string;
      framing?: string;
      expression?: string;
      poseHint?: string;
      userText?: string;
    } | null;

    const companionId = String(body?.companionId ?? "").trim();
    if (!companionId) return json({ error: "companionId is required" }, 400);

    const slots = [body?.scene, body?.outfit, body?.expression, body?.poseHint, body?.userText, body?.descriptor]
      .map((item) => String(item ?? ""))
      .join("\n");
    const blocked = minorReason(slots);
    if (blocked) return json({ error: blocked, code: "MINOR_BLOCKED" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);

    let blurred = false;
    if (!admin) {
      const { data: profile } = await svc
        .from("profiles")
        .select("plan, pics_left, credits, is_catalog_owner")
        .eq("user_id", user.id)
        .maybeSingle();
      const plan = String(profile?.plan ?? "free");
      const owner = Boolean(profile?.is_catalog_owner);
      const pics = Number(profile?.pics_left ?? 0);
      const credits = Number(profile?.credits ?? 0);
      if (!owner && (plan === "free" || (pics <= 0 && credits < 10))) {
        blurred = true;
      } else if (!owner && pics > 0) {
        await svc.from("profiles").update({ pics_left: pics - 1 }).eq("user_id", user.id);
      } else if (!owner && credits >= 10) {
        await svc.from("profiles").update({ credits: credits - 10 }).eq("user_id", user.id);
      }
    }

    if (blurred) {
      return json({
        blurred: true,
        locked: true,
        imageUrl: null,
        message: "Pictures stay blurred on the free tier.",
      });
    }

    const descriptor = String(body?.descriptor ?? "adult woman").slice(0, 800);
    const scene = String(body?.scene ?? "close portrait").slice(0, 400);
    const prompt = [descriptor, scene, body?.outfit, body?.expression, body?.framing, ADULT_ANCHOR]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean)
      .join(", ");
    const poseId = matchPose(`${body?.poseHint ?? ""} ${body?.userText ?? ""} ${scene}`);
    const seed = Number.isFinite(Number(body?.seed)) ? Number(body?.seed) : Math.floor(Math.random() * 1_000_000_000);

    let bytes: Uint8Array;
    try {
      bytes = await runpodImage(prompt, seed, poseId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message === "IMAGE_NOT_CONFIGURED" ? 503 : 502;
      return json({ error: message, code: message === "IMAGE_NOT_CONFIGURED" ? message : "IMAGE_FAILED" }, status);
    }

    const fileStem = crypto.randomUUID();
    const stored = await persistImageBytes(svc, {
      userId: user.id,
      companionId,
      bytes,
      contentType: "image/png",
      fileStem,
    });

    const { data: imageRow, error: insertError } = await svc
      .from("generated_images")
      .insert({
        user_id: user.id,
        companion_id: companionId,
        image_url: stored.imageUrl,
        prompt,
        original_prompt: scene,
        saved_to_personal_gallery: true,
        is_video: false,
        storage_bucket: stored.bucket,
        storage_path: stored.path,
      })
      .select("id")
      .single();

    if (insertError) {
      const retry = await svc
        .from("generated_images")
        .insert({
          user_id: user.id,
          companion_id: companionId,
          image_url: stored.imageUrl,
          prompt,
          original_prompt: scene,
          saved_to_personal_gallery: true,
          is_video: false,
        })
        .select("id")
        .single();
      if (retry.error || !retry.data) return json({ error: retry.error?.message || insertError.message }, 500);
      return json({
        imageUrl: stored.imageUrl,
        storageBucket: stored.bucket,
        storagePath: stored.path,
        generatedImageId: retry.data.id,
        poseId,
        blurred: false,
      });
    }

    await svc.from("lf_media").insert({
      user_id: user.id,
      companion_id: companionId,
      generated_image_id: imageRow.id,
      storage_bucket: stored.bucket,
      storage_path: stored.path,
      kind: "image",
      saved: true,
    });

    return json({
      imageUrl: stored.imageUrl,
      storageBucket: stored.bucket,
      storagePath: stored.path,
      generatedImageId: imageRow.id,
      poseId,
      blurred: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message.slice(0, 400) }, 500);
  }
});
