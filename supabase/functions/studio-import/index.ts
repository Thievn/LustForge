import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { minorReason } from "../_shared/adultGuard.ts";
import { screenImportImage } from "../_shared/studioGrok.ts";
import { gate, json } from "../_shared/studioHttp.ts";
import { parseDataUrl } from "../_shared/studioSafety.ts";
import { importExifOrThrow, saveStudioImage } from "../_shared/studioStore.ts";

Deno.serve(async (req) => {
  const session = await gate(req);
  if ("response" in session) return session.response;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (body?.attestation !== true) {
      return json({
        error: "Check the box to confirm this is a fictional adult character you have the rights to use.",
        code: "NO_ATTESTATION",
      }, 400);
    }
    const parsed = parseDataUrl(String(body?.dataUrl ?? ""));
    if (!parsed) return json({ error: "Upload an image first." }, 400);
    if (parsed.bytes.byteLength > 6_000_000) return json({ error: "Image too large" }, 400);
    const name = String(body?.name ?? "").slice(0, 80);
    const blocked = minorReason(name);
    if (blocked) return json({ error: blocked, code: "MINOR_BLOCKED" }, 400);
    try {
      importExifOrThrow(parsed.bytes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Camera metadata";
      return json({ error: message, code: "CAMERA_EXIF" }, 400);
    }

    const screen = await screenImportImage(String(body?.dataUrl ?? ""));
    if (!screen.ok) return json({ error: screen.error, code: "IMPORT_REJECTED" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);
    const saved = await saveStudioImage(svc, {
      userId: session.user.id,
      companionId: null,
      bytes: parsed.bytes,
      contentType: parsed.contentType,
      source: "character",
      prompt: name || "Imported character",
      kind: "import",
    });
    return json({
      assetId: saved.assetId,
      imageUrl: saved.signedUrl,
      tag: saved.tag,
      source: "character",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message.slice(0, 400) }, 500);
  }
});
