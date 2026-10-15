/**
 * Boudoir wireframe thumbnails from OpenPose BODY_18 keypoints.
 * Writes src/assets/pose-thumbs/<id>.webp.b64 (decoded webp is gitignored).
 *
 *   node scripts/render-pose-wireframes.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LIMBS = [
  [1, 2],
  [1, 5],
  [2, 3],
  [3, 4],
  [5, 6],
  [6, 7],
  [1, 8],
  [8, 9],
  [9, 10],
  [1, 11],
  [11, 12],
  [12, 13],
  [1, 0],
  [0, 14],
  [14, 16],
  [0, 15],
  [15, 17],
];

const BG = [18, 12, 20];
const ROSE = [196, 122, 138];
const IVORY = [244, 232, 220];
const LONG = 420;

const file = JSON.parse(readFileSync(new URL("../src/lib/studio/poseKeypoints.json", import.meta.url), "utf8"));
const outDir = new URL("../src/assets/pose-thumbs/", import.meta.url);
const scratch = mkdtempSync(join(tmpdir(), "pose-wire-"));

function canvasSize(width, height) {
  const scale = LONG / Math.max(width, height);
  return { w: Math.round(width * scale), h: Math.round(height * scale) };
}

function draw(points, width, height) {
  const { w, h } = canvasSize(width, height);
  const buf = new Uint8Array(w * h * 3);
  for (let i = 0; i < buf.length; i += 3) {
    buf[i] = BG[0];
    buf[i + 1] = BG[1];
    buf[i + 2] = BG[2];
  }
  const at = (index) => {
    const point = points[index];
    if (!point) return null;
    return [point[0] * w, point[1] * h];
  };
  const stamp = (x, y, radius, rgb) => {
    const r = Math.ceil(radius);
    const x0 = Math.max(0, Math.floor(x - r));
    const y0 = Math.max(0, Math.floor(y - r));
    const x1 = Math.min(w - 1, Math.ceil(x + r));
    const y1 = Math.min(h - 1, Math.ceil(y + r));
    const r2 = radius * radius;
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dx = px + 0.5 - x;
        const dy = py + 0.5 - y;
        if (dx * dx + dy * dy > r2) continue;
        const i = (py * w + px) * 3;
        buf[i] = rgb[0];
        buf[i + 1] = rgb[1];
        buf[i + 2] = rgb[2];
      }
    }
  };
  const stroke = (a, b, radius, rgb) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      stamp(a[0] + dx * t, a[1] + dy * t, radius, rgb);
    }
  };
  const neck = at(1);
  const nose = at(0);
  if (neck && nose) {
    const cx = (neck[0] + nose[0]) / 2;
    const cy = (neck[1] + nose[1]) / 2 - Math.hypot(neck[0] - nose[0], neck[1] - nose[1]) * 0.35;
    const rad = Math.max(7, Math.hypot(neck[0] - nose[0], neck[1] - nose[1]) * 0.85);
    stroke([cx - rad * 0.15, cy], [cx, cy - rad], 2.2, ROSE);
    for (let i = 0; i <= 48; i++) {
      const a0 = (i / 48) * Math.PI * 2;
      const a1 = ((i + 1) / 48) * Math.PI * 2;
      stroke(
        [cx + Math.cos(a0) * rad, cy + Math.sin(a0) * rad * 1.08],
        [cx + Math.cos(a1) * rad, cy + Math.sin(a1) * rad * 1.08],
        i % 2 === 0 ? 2.4 : 1.6,
        i % 2 === 0 ? IVORY : ROSE,
      );
    }
  }
  for (const [from, to] of LIMBS) {
    const start = at(from);
    const end = at(to);
    if (!start || !end) continue;
    stroke(start, end, 5.2, ROSE);
  }
  for (const [from, to] of LIMBS) {
    const start = at(from);
    const end = at(to);
    if (!start || !end) continue;
    stroke(start, end, 2.4, IVORY);
  }
  for (const point of points) {
    if (!point) continue;
    stamp(point[0] * w, point[1] * h, 4.6, ROSE);
    stamp(point[0] * w, point[1] * h, 2.3, IVORY);
  }
  const header = `P6\n${w} ${h}\n255\n`;
  return Buffer.concat([Buffer.from(header), Buffer.from(buf)]);
}

let count = 0;
for (const [id, pose] of Object.entries(file.poses)) {
  const ppm = join(scratch, `${id}.ppm`);
  const webp = join(scratch, `${id}.webp`);
  writeFileSync(ppm, draw(pose.points, pose.width, pose.height));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", ppm, "-c:v", "libwebp", "-quality", "78", webp], {
    stdio: "inherit",
  });
  const bytes = readFileSync(webp);
  if (bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.length < 500) {
    throw new Error(`${id} webp is ${bytes.length} bytes`);
  }
  writeFileSync(new URL(`${id}.webp.b64`, outDir), bytes.toString("base64"));
  count += 1;
}

rmSync(scratch, { recursive: true, force: true });
console.log(`wrote ${count} wireframe thumbs`);
