/** Wireframe stick figures rendered from pose keypoints. See scripts/render-pose-wireframes.mjs. */
const modules = import.meta.glob("../../assets/pose-thumbs/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const POSE_THUMBS: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split("/").pop() ?? "";
  const id = file.replace(/\.webp$/, "");
  if (id && typeof url === "string") POSE_THUMBS[id] = url;
}

export function poseThumbUrl(id: string): string | null {
  return POSE_THUMBS[id] ?? null;
}
