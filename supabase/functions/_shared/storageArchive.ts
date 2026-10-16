const STORAGE_MARKER = "/storage/v1/object/";

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const value = url.trim();
  if (value.startsWith("storage://")) return true;
  try {
    const parsed = new URL(value);
    return parsed.pathname.includes(STORAGE_MARKER) && /(^|\.)supabase\.co$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function needsStorageArchive(url: string | null | undefined): boolean {
  const value = (url ?? "").trim();
  if (!value) return false;
  if (value.startsWith("storage://")) return false;
  if (isSupabaseStorageUrl(value)) return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:");
}

export function parseStorageRef(url: string | null | undefined): { bucket: string; path: string } | null {
  const value = (url ?? "").trim();
  if (!value) return null;
  if (value.startsWith("storage://")) {
    const rest = value.slice("storage://".length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    return { bucket: rest.slice(0, slash), path: decodeURIComponent(rest.slice(slash + 1)) };
  }
  try {
    const parsed = new URL(value);
    const marker = parsed.pathname.indexOf(STORAGE_MARKER);
    if (marker < 0) return null;
    const parts = parsed.pathname.slice(marker + STORAGE_MARKER.length).split("/").filter(Boolean);
    if (parts[0] === "public" || parts[0] === "sign" || parts[0] === "authenticated") parts.shift();
    const bucket = parts.shift();
    if (!bucket || !parts.length) return null;
    return { bucket, path: parts.map((part) => decodeURIComponent(part)).join("/") };
  } catch {
    return null;
  }
}

export function storageUri(bucket: string, path: string): string {
  return `storage://${bucket}/${path}`;
}

/** Stable storage:// ref. Signed Supabase URLs collapse to the object path so compare links do not expire. */
export function durableImageRef(url: string | null | undefined): string | null {
  const ref = parseStorageRef(url);
  if (!ref?.bucket || !ref.path) return null;
  return storageUri(ref.bucket, ref.path);
}

export async function bytesFromImageUrl(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)?;base64,(.+)$/);
    if (!match) throw new Error("Unsupported data URL");
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { bytes, contentType: match[1] || "image/png" };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  return { bytes: new Uint8Array(await res.arrayBuffer()), contentType };
}
