import { supabase } from "@/integrations/supabase/client";
import { displayableMediaUrl, parseStorageRef } from "@/lib/phone/storageUrl";

/** Turn a storage:// or signed Supabase URL into something an <img> can paint. Public paths stay as they are. */
export async function signDisplayUrl(url: string | null | undefined): Promise<string | null> {
  const value = (url ?? "").trim();
  if (!value) return null;
  const ref = parseStorageRef(value);
  if (!ref) return displayableMediaUrl(value) || value;
  if (ref.bucket === "companion-images") {
    return supabase.storage.from(ref.bucket).getPublicUrl(ref.path).data.publicUrl || null;
  }
  const signed = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
  return signed.data?.signedUrl ?? null;
}
