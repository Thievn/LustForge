/**
 * Labeled contact sheet of every pose wireframe.
 *   node scripts/pose-contact-sheet.mjs [out.webp]
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const font = "/usr/share/fonts/truetype/macos/Inter-Regular.ttf";
const srcDir = new URL("../src/assets/pose-thumbs/", import.meta.url).pathname;
const out = process.argv[2] || "/opt/cursor/artifacts/pose-contact-sheet.webp";
const ids = readdirSync(srcDir).filter((name) => name.endsWith(".webp") && !name.endsWith(".b64")).map((name) => name.slice(0, -5)).sort();
const cols = 8;
const cellW = 168;
const cellH = 268;
const scratch = mkdtempSync(join(tmpdir(), "pose-sheet-"));
const cells = [];
for (const id of ids) {
  const cell = join(scratch, `${id}.png`);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", join(srcDir, `${id}.webp`),
    "-vf", `scale=${cellW - 16}:${cellH - 36}:force_original_aspect_ratio=decrease,pad=${cellW}:${cellH}:(ow-iw)/2:8:color=0x120C14,drawtext=fontfile='${font}':text='${id}':fontsize=13:fontcolor=0xF4E8DC:x=(w-text_w)/2:y=h-22`,
    cell,
  ]);
  cells.push(cell);
}
const rows = Math.ceil(cells.length / cols);
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  ...cells.flatMap((cell) => ["-i", cell]),
  "-filter_complex", `tile=${cols}x${rows}:padding=4:color=0x1A1018`,
  out,
]);
rmSync(scratch, { recursive: true, force: true });
console.log(`wrote ${ids.length} poses to ${out}`);
