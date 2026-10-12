/**
 * Idempotent copy of image URLs that are not already in Supabase Storage.
 * Default mode is dry_run. The owner runs this after backup and migration review.
 * This function does not delete rows, objects, or the previous URL (kept on external_url).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireSessionUser, isLustforgeAdminUser } from "../_shared/requireSessionUser.ts";
import { bytesFromImageUrl, isSupabaseStorageUrl, needsStorageArchive, parseStorageRef } from "../_shared/storageArchive.ts";
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

type Row = Record<string, unknown>;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sessionGate = await requireSessionUser(req);
    if ("response" in sessionGate) return sessionGate.response;
    const admin = await isLustforgeAdminUser(sessionGate.user);
    if (!admin) return json({ error: "Catalog owner only" }, 403);

    const body = (await req.json().catch(() => ({}))) as { apply?: boolean; limit?: number };
    const apply = body.apply === true;
    const limit = Math.min(50, Math.max(1, Number(body.limit ?? 20)));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfigured" }, 500);
    const svc = createClient(supabaseUrl, serviceKey);

    const probe = await svc.from("generated_images").select("id, storage_path").limit(1);
    if (probe.error && /storage_path/i.test(probe.error.message)) {
      return json(
        {
          error: "Migration has not been applied. storage_path is missing on generated_images.",
          code: "MIGRATION_REQUIRED",
        },
        412,
      );
    }

    const summary: Record<string, unknown>[] = [];

    summary.push(await archiveTable(svc, apply, limit, {
      table: "generated_images",
      urlColumn: "image_url",
      userColumn: "user_id",
      companionColumn: "companion_id",
    }));
    summary.push(await archiveTable(svc, apply, limit, {
      table: "companion_portraits",
      urlColumn: "image_url",
      userColumn: "user_id",
      companionColumn: null,
    }));
    summary.push(await archiveTable(svc, apply, limit, {
      table: "chat_messages",
      urlColumn: "image_url",
      userColumn: "user_id",
      companionColumn: "companion_id",
    }));
    summary.push(await archiveOverride(svc, apply, limit, "portrait_url", "portrait_storage_bucket", "portrait_storage_path", "portrait_external_url"));
    summary.push(await archiveOverride(svc, apply, limit, "animated_portrait_url", "animated_storage_bucket", "animated_storage_path", "animated_external_url"));
    summary.push(await archiveLoopJobs(svc, apply, limit));

    return json({ apply, limit, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message.slice(0, 400) }, 500);
  }
});

async function archiveTable(
  svc: ReturnType<typeof createClient>,
  apply: boolean,
  limit: number,
  spec: { table: string; urlColumn: string; userColumn: string; companionColumn: string | null },
) {
  const { data, error } = await svc
    .from(spec.table)
    .select("*")
    .is("storage_path", null)
    .not(spec.urlColumn, "is", null)
    .limit(limit);
  if (error) return { table: spec.table, error: error.message };
  return consume(svc, apply, spec.table, (data ?? []) as Row[], (row) => ({
    id: row.id,
    url: String(row[spec.urlColumn] ?? ""),
    userId: String(row[spec.userColumn] ?? ""),
    companionId: spec.companionColumn ? String(row[spec.companionColumn] ?? "companion") : "portrait",
    patch: async (fields: Row) => {
      const { error: updateError } = await svc.from(spec.table).update(fields).eq("id", row.id as string);
      if (updateError) throw new Error(updateError.message);
    },
  }));
}

async function archiveOverride(
  svc: ReturnType<typeof createClient>,
  apply: boolean,
  limit: number,
  urlColumn: "portrait_url" | "animated_portrait_url",
  bucketColumn: string,
  pathColumn: string,
  externalColumn: string,
) {
  const { data, error } = await svc
    .from("user_companion_portrait_overrides")
    .select("*")
    .is(pathColumn, null)
    .not(urlColumn, "is", null)
    .limit(limit);
  if (error) return { table: `user_companion_portrait_overrides.${urlColumn}`, error: error.message };
  return consume(svc, apply, `user_companion_portrait_overrides.${urlColumn}`, (data ?? []) as Row[], (row) => ({
    id: `${row.user_id}:${row.companion_id}`,
    url: String(row[urlColumn] ?? ""),
    userId: String(row.user_id ?? ""),
    companionId: String(row.companion_id ?? "companion"),
    patch: async (fields: Row) => {
      const mapped: Row = {};
      if ("storage_bucket" in fields) mapped[bucketColumn] = fields.storage_bucket;
      if ("storage_path" in fields) mapped[pathColumn] = fields.storage_path;
      if ("external_url" in fields) mapped[externalColumn] = fields.external_url;
      if (urlColumn in fields || "image_url" in fields) mapped[urlColumn] = fields.image_url;
      const { error: updateError } = await svc
        .from("user_companion_portrait_overrides")
        .update(mapped)
        .eq("user_id", row.user_id as string)
        .eq("companion_id", row.companion_id as string);
      if (updateError) throw new Error(updateError.message);
    },
  }));
}

/** Jobs already store a Storage public_url. Never surface xai_video_url when public_url is set. */
async function archiveLoopJobs(svc: ReturnType<typeof createClient>, apply: boolean, limit: number) {
  const { data, error } = await svc
    .from("profile_loop_video_jobs")
    .select("id, user_id, companion_id, public_url, xai_video_url")
    .is("public_url", null)
    .not("xai_video_url", "is", null)
    .limit(limit);
  if (error) return { table: "profile_loop_video_jobs", error: error.message, note: "public_url is preferred; xai_video_url is not shown in the app" };
  let copied = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const row of data ?? []) {
    if (row.public_url && String(row.public_url).trim()) {
      skipped += 1;
      continue;
    }
    const source = String(row.xai_video_url ?? "");
    if (!needsStorageArchive(source)) {
      skipped += 1;
      continue;
    }
    if (!apply) {
      copied += 1;
      continue;
    }
    try {
      const downloaded = await bytesFromImageUrl(source);
      const stored = await persistImageBytes(svc, {
        userId: String(row.user_id),
        companionId: String(row.companion_id || "loop"),
        bytes: downloaded.bytes,
        contentType: downloaded.contentType,
        fileStem: crypto.randomUUID(),
      });
      const { error: updateError } = await svc
        .from("profile_loop_video_jobs")
        .update({ public_url: stored.imageUrl })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
      copied += 1;
    } catch (err) {
      errors.push(`${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return {
    table: "profile_loop_video_jobs",
    scanned: (data ?? []).length,
    skipped,
    copied,
    errors,
    note: "Leaves xai_video_url in place. Skips rows that already have public_url.",
  };
}

async function consume(
  svc: ReturnType<typeof createClient>,
  apply: boolean,
  table: string,
  rows: Row[],
  map: (row: Row) => {
    id: unknown;
    url: string;
    userId: string;
    companionId: string;
    patch: (fields: Row) => Promise<void>;
  },
) {
  let skipped = 0;
  let linked = 0;
  let copied = 0;
  const errors: string[] = [];
  for (const raw of rows) {
    const row = map(raw);
    if (!row.url || !row.userId) {
      skipped += 1;
      continue;
    }
    if (!needsStorageArchive(row.url) && isSupabaseStorageUrl(row.url)) {
      const ref = parseStorageRef(row.url);
      if (apply && ref) {
        await row.patch({ storage_bucket: ref.bucket, storage_path: ref.path });
        linked += 1;
      } else skipped += 1;
      continue;
    }
    if (!needsStorageArchive(row.url)) {
      skipped += 1;
      continue;
    }
    if (!apply) {
      copied += 1;
      continue;
    }
    try {
      const downloaded = await bytesFromImageUrl(row.url);
      const stored = await persistImageBytes(svc, {
        userId: row.userId,
        companionId: row.companionId,
        bytes: downloaded.bytes,
        contentType: downloaded.contentType,
        fileStem: crypto.randomUUID(),
      });
      await row.patch({
        external_url: row.url,
        storage_bucket: stored.bucket,
        storage_path: stored.path,
        image_url: stored.imageUrl,
      });
      copied += 1;
    } catch (err) {
      errors.push(`${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { table, scanned: rows.length, skipped, linked, copied, errors };
}
