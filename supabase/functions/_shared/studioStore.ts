import { storageUri, parseStorageRef } from "./storageArchive.ts";
import {
  type SourceTag,
  appStorageSource,
  cameraExifReason,
  isSourceTag,
  parseDataUrl,
  sha256Hex,
  signImage,
  verifyImage,
  weakest,
} from "./studioSafety.ts";

// Service-role client. Typed loosely so this file stays free of a remote supabase type import.
// deno-lint-ignore no-explicit-any
type Svc = any;

const MAX_BYTES = 6_000_000;

export type ResolvedImage = {
  bytes: Uint8Array;
  contentType: string;
  source: SourceTag;
  assetId?: string;
};

function signingSecret(): string {
  const named = Deno.env.get("EDIT_SIGNING_SECRET")?.trim();
  if (named) return named;
  return `lf-src::${Deno.env.get("RUNPOD_API_KEY") ?? ""}`;
}

export function secretForSignatures(): string {
  return signingSecret();
}

function ownedPath(bucket: string, path: string, userId: string): boolean {
  if (bucket === "lf-chat-media") return path.split("/")[0] === userId;
  if (bucket === "companion-images" || bucket === "companion-portraits") return path.includes(userId);
  return false;
}

async function downloadStorage(svc: Svc, bucket: string, path: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const downloaded = await svc.storage.from(bucket).download(path);
  if (downloaded.error || !downloaded.data) throw new Error(downloaded.error?.message || "Image missing");
  const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) throw new Error("Image too large");
  const contentType = downloaded.data.type || "image/png";
  return { bytes, contentType };
}

async function rowHit(query: Promise<{ data: unknown; error: { message: string } | null }>): Promise<boolean> {
  try {
    const { data, error } = await query;
    if (error) return false;
    if (Array.isArray(data)) return data.length > 0;
    return Boolean(data && typeof data === "object" && "id" in (data as Record<string, unknown>)
      ? (data as { id?: unknown }).id
      : data);
  } catch {
    return false;
  }
}

/**
 * App-made pictures (gallery, chat stills, portraits, Lab output) are lab or character.
 * Only a file that never passed through those tables, and is not in the app's own
 * storage prefixes, stays an outside upload.
 */
async function classifyPath(
  svc: Svc,
  userId: string,
  bucket: string,
  path: string,
  catalogOwner: boolean,
): Promise<SourceTag> {
  const asset = await svc
    .from("studio_assets")
    .select("source_tag")
    .eq("user_id", userId)
    .eq("storage_bucket", bucket)
    .eq("storage_path", path)
    .limit(1)
    .maybeSingle();
  if (isSourceTag(asset.data?.source_tag)) return asset.data.source_tag;

  const like = `%${path}%`;
  const ownedLab = await rowHit(
    svc.from("generated_images").select("id").eq("user_id", userId).eq("storage_path", path).limit(1),
  );
  if (ownedLab) return "lab";
  if (await rowHit(svc.from("generated_images").select("id").eq("user_id", userId).ilike("image_url", like).limit(1))) {
    return "lab";
  }
  if (await rowHit(svc.from("lf_media").select("id").eq("user_id", userId).eq("storage_path", path).limit(1))) {
    return "lab";
  }
  if (await rowHit(svc.from("chat_messages").select("id").eq("user_id", userId).ilike("image_url", like).limit(1))) {
    return "lab";
  }
  if (await rowHit(svc.from("studio_jobs").select("id").eq("user_id", userId).ilike("image_url", like).limit(1))) {
    return "lab";
  }
  if (await rowHit(svc.from("companion_portraits").select("id").eq("user_id", userId).ilike("image_url", like).limit(1))) {
    return "character";
  }
  if (
    await rowHit(
      svc.from("user_companion_portrait_overrides").select("user_id").eq("user_id", userId).ilike("portrait_url", like).limit(1),
    ) ||
    await rowHit(
      svc
        .from("user_companion_portrait_overrides")
        .select("user_id")
        .eq("user_id", userId)
        .ilike("animated_portrait_url", like)
        .limit(1),
    )
  ) {
    return "character";
  }

  let characters = svc.from("custom_characters").select("id, image_url, static_image_url, avatar_url").eq("user_id", userId);
  if (catalogOwner) characters = svc.from("custom_characters").select("id, image_url, static_image_url, avatar_url");
  const { data: rows } = await characters.limit(200);
  const needle = path;
  for (const row of rows ?? []) {
    const urls = [row.image_url, row.static_image_url, row.avatar_url].map((item: unknown) => String(item ?? ""));
    if (urls.some((url) => url.includes(needle))) return "character";
  }

  if (catalogOwner) {
    if (await rowHit(svc.from("generated_images").select("id").eq("storage_path", path).limit(1))) return "lab";
    if (await rowHit(svc.from("generated_images").select("id").ilike("image_url", like).limit(1))) return "lab";
    if (await rowHit(svc.from("companion_portraits").select("id").ilike("image_url", like).limit(1))) return "character";
  }

  return appStorageSource(bucket, path, userId) ?? "upload";
}

export async function resolveImage(
  svc: Svc,
  userId: string,
  ref: { assetId?: string; dataUrl?: string; tag?: string; bucket?: string; path?: string; imageUrl?: string },
  catalogOwner: boolean,
): Promise<ResolvedImage> {
  if (ref.assetId) {
    const { data, error } = await svc
      .from("studio_assets")
      .select("id, storage_bucket, storage_path, source_tag")
      .eq("id", ref.assetId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) throw new Error("That image is not in your studio");
    const file = await downloadStorage(svc, data.storage_bucket, data.storage_path);
    return {
      ...file,
      source: isSourceTag(data.source_tag) ? data.source_tag : "upload",
      assetId: data.id,
    };
  }

  if (ref.dataUrl) {
    const parsed = parseDataUrl(ref.dataUrl);
    if (!parsed) throw new Error("Bad image");
    if (parsed.bytes.byteLength > MAX_BYTES) throw new Error("Image too large");
    const source = await verifyImage(parsed.bytes, ref.tag, signingSecret());
    return { bytes: parsed.bytes, contentType: parsed.contentType, source };
  }

  let bucket = ref.bucket?.trim() || "";
  let path = ref.path?.trim() || "";
  if ((!bucket || !path) && ref.imageUrl) {
    const parsed = parseStorageRef(ref.imageUrl);
    if (!parsed) throw new Error("Pick an image from your gallery or upload a file.");
    bucket = parsed.bucket;
    path = parsed.path;
  }
  if (!bucket || !path) throw new Error("Image required");
  if (!ownedPath(bucket, path, userId) && !catalogOwner) {
    const source = await classifyPath(svc, userId, bucket, path, false);
    if (source === "upload") {
      const tied = await svc.from("generated_images").select("id").eq("user_id", userId).eq("storage_path", path).limit(1).maybeSingle();
      if (!tied.data?.id) throw new Error("That image is not on your account.");
    }
  }
  const file = await downloadStorage(svc, bucket, path);
  const source = await classifyPath(svc, userId, bucket, path, catalogOwner);
  return { ...file, source };
}

export function poseCountsAsUpload(poseId: string | null, poseBytes: Uint8Array | null, catalog: Set<string>): boolean {
  if (!poseBytes) return false;
  if (poseId && catalog.has(poseId)) return false;
  return true;
}

export async function saveStudioImage(
  svc: Svc,
  input: {
    userId: string;
    companionId: string | null;
    bytes: Uint8Array;
    contentType: string;
    source: SourceTag;
    prompt: string;
    parentId?: string | null;
    kind?: string;
    sourceImageUrl?: string | null;
    galleryListing?: "compare" | "picture" | null;
  },
): Promise<{ assetId: string; imageUrl: string; signedUrl: string; tag: string; bucket: string; path: string }> {
  const secret = signingSecret();
  const tag = await signImage(input.bytes, input.source, secret);
  const sha = await sha256Hex(input.bytes);
  const ext = input.contentType.includes("jpeg") ? "jpg" : input.contentType.includes("webp") ? "webp" : "png";
  const path = `${input.userId}/studio/${crypto.randomUUID()}.${ext}`;
  const uploaded = await svc.storage.from("lf-chat-media").upload(path, input.bytes, {
    contentType: input.contentType.includes("png") || input.contentType.includes("jpeg") || input.contentType.includes("webp")
      ? input.contentType
      : "image/png",
    upsert: false,
  });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const imageUrl = storageUri("lf-chat-media", path);
  const signed = await svc.storage.from("lf-chat-media").createSignedUrl(path, 60 * 60);
  const signedUrl = signed.data?.signedUrl || imageUrl;

  const assetInsert = await svc
    .from("studio_assets")
    .insert({
      user_id: input.userId,
      companion_id: input.companionId,
      storage_bucket: "lf-chat-media",
      storage_path: path,
      source_tag: input.source,
      source_sig: tag,
      sha256: sha,
      kind: input.kind ?? "image",
      prompt: input.prompt.slice(0, 2000),
      parent_id: input.parentId ?? null,
    })
    .select("id")
    .single();
  if (assetInsert.error || !assetInsert.data) throw new Error(assetInsert.error?.message || "Could not save");

  const assetId = assetInsert.data.id as string;
  const companionId = input.companionId || "studio";
  const fullRow = {
    user_id: input.userId,
    companion_id: companionId,
    image_url: imageUrl,
    prompt: input.prompt.slice(0, 2000),
    original_prompt: input.prompt.slice(0, 500),
    saved_to_personal_gallery: true,
    saved_to_companion_gallery: Boolean(input.companionId && input.companionId !== "studio"),
    is_video: false,
    storage_bucket: "lf-chat-media",
    storage_path: path,
    source_tag: input.source,
    source_sig: tag,
    studio_asset_id: assetId,
    source_image_url: input.sourceImageUrl || null,
    gallery_listing: input.galleryListing ?? null,
  };
  let imageId: string | null = null;
  let inserted = await svc.from("generated_images").insert(fullRow).select("id").single();
  if (inserted.error && /gallery_listing/i.test(inserted.error.message ?? "")) {
    const { gallery_listing: _listing, ...withoutListing } = fullRow;
    inserted = await svc.from("generated_images").insert(withoutListing).select("id").single();
  }
  if (inserted.error) {
    const { source_tag: _a, source_sig: _b, studio_asset_id: _c, storage_bucket: _d, storage_path: _e, source_image_url: _f, gallery_listing: _g, ...basic } = fullRow;
    const retry = await svc.from("generated_images").insert(basic).select("id").single();
    imageId = (retry.data?.id as string) ?? null;
  } else {
    imageId = inserted.data.id as string;
  }

  await svc.from("lf_media").insert({
    user_id: input.userId,
    companion_id: input.companionId,
    generated_image_id: imageId,
    storage_bucket: "lf-chat-media",
    storage_path: path,
    kind: "image",
    saved: true,
  });

  return { assetId, imageUrl, signedUrl, tag, bucket: "lf-chat-media", path };
}

/** Keep the picture an edit started from, without adding a second gallery tile. */
export async function archiveSourceBytes(
  svc: Svc,
  userId: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const type = contentType.split(";")[0]?.trim() || "image/png";
  const ext = type.includes("jpeg") || type.includes("jpg") ? "jpg" : type.includes("webp") ? "webp" : "png";
  const path = `${userId}/studio/src-${crypto.randomUUID()}.${ext}`;
  const uploaded = await svc.storage.from("lf-chat-media").upload(path, bytes, {
    contentType: type === "image/png" || type === "image/jpeg" || type === "image/webp" ? type : "image/png",
    upsert: false,
  });
  if (uploaded.error) throw new Error(uploaded.error.message);
  return storageUri("lf-chat-media", path);
}

export function importExifOrThrow(bytes: Uint8Array) {
  const reason = cameraExifReason(bytes);
  if (reason) {
    const error = new Error(reason) as Error & { code?: string };
    error.code = "CAMERA_EXIF";
    throw error;
  }
}

export { weakest };
