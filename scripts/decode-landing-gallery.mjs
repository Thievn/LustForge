// Image binaries are stored as base64 text (*.b64) and decoded before dev/build.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function decodeDir(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".b64")) continue;
    writeFileSync(join(dir, f.slice(0, -4)), Buffer.from(readFileSync(join(dir, f), "utf8").replace(/\s+/g, ""), "base64"));
  }
}

const root = process.cwd();
decodeDir(join(root, "src/assets/landing-gallery"));
decodeDir(join(root, "src/assets/pose-thumbs"));
