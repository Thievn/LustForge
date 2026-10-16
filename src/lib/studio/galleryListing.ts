import { sameStorageObject } from "@/lib/phone/storageUrl";

export type GallerySourceRow = {
  id: string;
  image_url: string;
  source_image_url?: string | null;
  gallery_listing?: string | null;
  is_video?: boolean | null;
};

export type PresentedGalleryRow<T extends GallerySourceRow> = T & {
  beforeUrl: string | null;
  afterUrl: string | null;
};

/** Legacy rows with a source and no listing are compares. A picture listing never opens the slider. */
export function galleryListingOf(row: {
  gallery_listing?: string | null;
  source_image_url?: string | null;
}): "compare" | "picture" | null {
  if (row.gallery_listing === "picture") return "picture";
  if (row.gallery_listing === "compare") return "compare";
  if (row.source_image_url?.trim()) return "compare";
  return null;
}

function findSource<T extends GallerySourceRow>(rows: T[], sourceUrl: string | null | undefined, selfId: string): T | undefined {
  const needle = sourceUrl?.trim();
  if (!needle) return undefined;
  return rows.find((row) => row.id !== selfId && !row.is_video && (row.image_url === needle || sameStorageObject(row.image_url, needle)));
}

/**
 * Newest-first. A clothing edit folds onto its source and hides that source plus older compares of it.
 * A new pose stays its own tile. The folded tile keeps the edit's id so another edit starts from the after image.
 */
export function presentGalleryRows<T extends GallerySourceRow>(rows: T[]): PresentedGalleryRow<T>[] {
  const newestCompare = new Map<string, T>();
  for (const row of rows) {
    if (row.is_video || galleryListingOf(row) !== "compare") continue;
    const source = findSource(rows, row.source_image_url, row.id);
    if (!source || newestCompare.has(source.id)) continue;
    newestCompare.set(source.id, row);
  }

  const out: PresentedGalleryRow<T>[] = [];
  for (const row of rows) {
    if (row.is_video) {
      out.push({ ...row, beforeUrl: null, afterUrl: null });
      continue;
    }
    const listing = galleryListingOf(row);
    if (listing === "picture") {
      out.push({ ...row, beforeUrl: null, afterUrl: null });
      continue;
    }
    if (listing === "compare") {
      const source = findSource(rows, row.source_image_url, row.id);
      if (source) {
        if (newestCompare.get(source.id)?.id !== row.id) continue;
        out.push({ ...row, beforeUrl: source.image_url, afterUrl: row.image_url });
        continue;
      }
      const origin = row.source_image_url?.trim() || null;
      out.push({
        ...row,
        beforeUrl: origin && origin !== row.image_url && !sameStorageObject(origin, row.image_url) ? origin : null,
        afterUrl: row.image_url,
      });
      continue;
    }
    if (newestCompare.has(row.id)) continue;
    out.push({ ...row, beforeUrl: null, afterUrl: null });
  }
  return out;
}
