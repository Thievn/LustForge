import { storageUri } from "./storageArchive.ts";

type StorageClient = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Uint8Array,
        options: { contentType: string; upsert: boolean },
      ) => Promise<{ error: { message: string } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
};

export type StoredImage = {
  bucket: string;
  path: string;
  imageUrl: string;
};

/**
 * Writes bytes into Supabase Storage.
 * Prefers the existing public companion-images bucket so current <img> tags keep working,
 * and falls back to the private lf-chat-media bucket from the phone-shell migration.
 */
export async function persistImageBytes(
  supabase: StorageClient,
  input: { userId: string; companionId: string; bytes: Uint8Array; contentType: string; fileStem: string },
): Promise<StoredImage> {
  const safeCompanion = input.companionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "companion";
  const ext = input.contentType.includes("jpeg") ? "jpg" : input.contentType.includes("webp") ? "webp" : "png";
  const publicPath = `chat-media/${input.userId}/${safeCompanion}/${input.fileStem}.${ext}`;
  const pub = await supabase.storage.from("companion-images").upload(publicPath, input.bytes, {
    contentType: input.contentType,
    upsert: true,
  });
  if (!pub.error) {
    const url = supabase.storage.from("companion-images").getPublicUrl(publicPath).data.publicUrl;
    return { bucket: "companion-images", path: publicPath, imageUrl: url };
  }

  const privatePath = `${input.userId}/${safeCompanion}/${input.fileStem}.${ext}`;
  const priv = await supabase.storage.from("lf-chat-media").upload(privatePath, input.bytes, {
    contentType: input.contentType,
    upsert: true,
  });
  if (priv.error) {
    throw new Error(pub.error.message || priv.error.message);
  }
  return { bucket: "lf-chat-media", path: privatePath, imageUrl: storageUri("lf-chat-media", privatePath) };
}
