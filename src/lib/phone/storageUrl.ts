/** Classify image URLs so the archive job can copy temporary hosts into Storage. */

const STORAGE_MARKER = "/storage/v1/object/";

export type StorageRef = {
  bucket: string;
  path: string;
};

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

export function parseStorageRef(url: string | null | undefined): StorageRef | null {
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
    const tail = parsed.pathname.slice(marker + STORAGE_MARKER.length);
    const parts = tail.split("/").filter(Boolean);
    if (parts[0] === "public" || parts[0] === "sign" || parts[0] === "authenticated") {
      parts.shift();
    }
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

/** Temporary provider links. Gallery must prefer the Storage public_url instead. */
export function isTemporaryProviderUrl(url: string | null | undefined): boolean {
  const value = (url ?? "").trim();
  if (!value) return false;
  return /x\.ai|api\.x\.ai|runpod\.io|oaidalle|blob\.core\.windows\.net/i.test(value);
}

/** First URL that is safe to render. Skips xAI/Runpod temporaries when a Storage URL exists. */
export function displayableMediaUrl(...candidates: Array<string | null | undefined>): string | null {
  const stored = candidates.find((url) => url && !isTemporaryProviderUrl(url) && (isSupabaseStorageUrl(url) || url.startsWith("/") || url.startsWith("data:")));
  if (stored) return stored;
  const other = candidates.find((url) => url && !isTemporaryProviderUrl(url));
  return other ?? null;
}
