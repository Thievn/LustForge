/**
 * OpenPose-18 stick figure for chat ControlNet (`pose.png`).
 * Same limbs and colours as the Studio canvas painter, encoded without a DOM.
 */
import rawKeypoints from "../../../src/lib/studio/poseKeypoints.json" with { type: "json" };

type PosePoint = [number, number] | null;
type PoseRow = { width: number; height: number; points: PosePoint[] };
type KeypointFile = { poses: Record<string, PoseRow> };

const keypoints = rawKeypoints as unknown as KeypointFile;

const LIMBS: Array<[number, number]> = [
  [1, 2], [1, 5], [2, 3], [3, 4], [5, 6], [6, 7],
  [1, 8], [8, 9], [9, 10], [1, 11], [11, 12], [12, 13],
  [1, 0], [0, 14], [14, 16], [0, 15], [15, 17],
];

const COLORS: Array<[number, number, number]> = [
  [255, 0, 0], [255, 85, 0], [255, 170, 0], [255, 255, 0],
  [170, 255, 0], [85, 255, 0], [0, 255, 0], [0, 255, 85],
  [0, 255, 170], [0, 255, 255], [0, 170, 255], [0, 85, 255],
  [0, 0, 255], [85, 0, 255], [170, 0, 255], [255, 0, 255],
  [255, 0, 170], [255, 0, 85],
];

export function poseCanvasSize(id: string): { w: number; h: number } | null {
  const row = keypoints.poses[id];
  if (!row) return null;
  return { w: row.width, h: row.height };
}

function crc32(data: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i]!;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function u32(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  const out = new Uint8Array(4 + body.length + 4);
  out.set(u32(data.length), 0);
  out.set(body, 4);
  out.set(u32(crc32(body)), 4 + body.length);
  return out;
}

async function zlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream("deflate");
  const writer = stream.writable.getWriter();
  await writer.write(data);
  await writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

function stamp(
  rgb: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number,
  color: [number, number, number],
  alpha: number,
) {
  const r = Math.ceil(radius);
  const x0 = Math.max(0, Math.floor(x - r));
  const y0 = Math.max(0, Math.floor(y - r));
  const x1 = Math.min(width - 1, Math.ceil(x + r));
  const y1 = Math.min(height - 1, Math.ceil(y + r));
  const r2 = radius * radius;
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const dx = px + 0.5 - x;
      const dy = py + 0.5 - y;
      if (dx * dx + dy * dy > r2) continue;
      const i = (py * width + px) * 3;
      rgb[i] = Math.round(rgb[i]! * (1 - alpha) + color[0] * alpha);
      rgb[i + 1] = Math.round(rgb[i + 1]! * (1 - alpha) + color[1] * alpha);
      rgb[i + 2] = Math.round(rgb[i + 2]! * (1 - alpha) + color[2] * alpha);
    }
  }
}

function stroke(
  rgb: Uint8Array,
  width: number,
  height: number,
  a: [number, number],
  b: [number, number],
  radius: number,
  color: [number, number, number],
) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    stamp(rgb, width, height, a[0] + dx * t, a[1] + dy * t, radius, color, 0.6);
  }
}

function draw(row: PoseRow): Uint8Array {
  const { width, height, points } = row;
  const rgb = new Uint8Array(width * height * 3);
  const scale = Math.min(width, height) / 832;
  const thickness = Math.max(6, Math.round(12 * scale)) / 2;
  const joint = Math.max(3, Math.round(5 * scale));
  const at = (index: number): [number, number] | null => {
    const point = points[index];
    if (!point) return null;
    return [point[0] * width, point[1] * height];
  };
  LIMBS.forEach(([from, to], index) => {
    const start = at(from);
    const end = at(to);
    if (!start || !end) return;
    stroke(rgb, width, height, start, end, thickness, COLORS[index] ?? [255, 255, 255]);
  });
  points.forEach((point, index) => {
    const placed = at(index);
    if (!point || !placed) return;
    stamp(rgb, width, height, placed[0], placed[1], joint, COLORS[index] ?? [255, 255, 255], 1);
  });
  return rgb;
}

async function encodePng(width: number, height: number, rgb: Uint8Array): Promise<Uint8Array> {
  const raw = new Uint8Array((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), row + 1);
  }
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(width), 0);
  ihdr.set(u32(height), 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", await zlib(raw)),
    chunk("IEND", new Uint8Array()),
  ];
  const size = png.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of png) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Base64 PNG skeleton, or null when this id is not in the catalog. */
export async function posePngBase64(id: string): Promise<string | null> {
  const row = keypoints.poses[id];
  if (!row) return null;
  return toBase64(await encodePng(row.width, row.height, draw(row)));
}
