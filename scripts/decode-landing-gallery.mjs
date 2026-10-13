// Landing gallery images are stored as base64 text (*.webp.b64) and decoded before dev/build.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const dir = join(process.cwd(), "src/assets/landing-gallery");
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".webp.b64")) continue;
  writeFileSync(join(dir, f.slice(0, -4)), Buffer.from(readFileSync(join(dir, f), "utf8").replace(/\s+/g, ""), "base64"));
}
