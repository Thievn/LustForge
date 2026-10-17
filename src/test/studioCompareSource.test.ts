import { describe, expect, it } from "vitest";
import { durableImageRef } from "../../supabase/functions/_shared/storageArchive";
import { saveStudioImage } from "../../supabase/functions/_shared/studioStore";
import { sameStorageObject } from "@/lib/phone/storageUrl";

const g = globalThis as { Deno?: { env: { get: (name: string) => string | undefined } } };
g.Deno = {
  env: {
    get: (name: string) => (name === "EDIT_SIGNING_SECRET" ? "test-secret" : undefined),
  },
};

describe("durable compare source", () => {
  it("collapses signed storage URLs and ignores files that are not in storage", () => {
    expect(durableImageRef("storage://lf-chat-media/user/studio/before.jpg")).toBe("storage://lf-chat-media/user/studio/before.jpg");
    expect(durableImageRef("https://abc.supabase.co/storage/v1/object/sign/lf-chat-media/user/studio/before.jpg?token=expired")).toBe(
      "storage://lf-chat-media/user/studio/before.jpg",
    );
    expect(durableImageRef("data:image/jpeg;base64,aaaa")).toBeNull();
    expect(durableImageRef("")).toBeNull();
  });

  it("treats a signed URL and its storage URI as the same picture", () => {
    const stored = "storage://companion-images/user/still.png";
    const signed = "https://abc.supabase.co/storage/v1/object/public/companion-images/user/still.png";
    expect(sameStorageObject(stored, signed)).toBe(true);
    expect(sameStorageObject(stored, "storage://companion-images/user/other.png")).toBe(false);
  });

  it("stores the source URL on the gallery row for an edit", async () => {
    const { svc, inserts } = memorySvc();
    const saved = await saveStudioImage(svc, {
      userId: "user-1",
      companionId: null,
      bytes: new Uint8Array([1, 2, 3, 4]),
      contentType: "image/png",
      source: "lab",
      prompt: "shorter hair",
      kind: "edit",
      sourceImageUrl: "storage://lf-chat-media/user-1/studio/before.jpg",
    });
    expect(saved.imageUrl.startsWith("storage://lf-chat-media/user-1/studio/")).toBe(true);
    const gallery = inserts.filter((row) => row.table === "generated_images");
    expect(gallery).toHaveLength(1);
    expect(gallery[0].row.source_image_url).toBe("storage://lf-chat-media/user-1/studio/before.jpg");
    expect(gallery[0].row.saved_to_personal_gallery).toBe(true);
  });
});

function memorySvc() {
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  const svc = {
    storage: {
      from() {
        return {
          upload: async () => ({ error: null }),
          createSignedUrl: async () => ({ data: { signedUrl: "https://signed.example/out.png" } }),
        };
      },
    },
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push({ table, row: { ...row } });
          const result = Promise.resolve({ data: { id: `${table}-id` }, error: null });
          return Object.assign(result, {
            select() {
              return {
                single: async () => ({ data: { id: `${table}-id` }, error: null }),
              };
            },
          });
        },
      };
    },
  };
  return { svc, inserts };
}
