// Renders the PWA / favicon PNG set from public/icon-source.svg (the LustForge flame mark).
// Binaries are generated at build time so the repo only carries the text SVG source.
// Uses @resvg/resvg-js, installed on demand into a temp dir (no package.json / lockfile changes).
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = process.cwd();
const pub = join(root, "public");
const svg = readFileSync(join(pub, "icon-source.svg"), "utf8");

function loadResvg() {
  try {
    return createRequire(join(root, "package.json"))("@resvg/resvg-js");
  } catch {}
  const dir = join(tmpdir(), "lf-resvg");
  mkdirSync(dir, { recursive: true });
  if (!existsSync(join(dir, "node_modules/@resvg/resvg-js"))) {
    writeFileSync(join(dir, "package.json"), "{}");
    execSync("npm install --no-audit --no-fund --silent @resvg/resvg-js@2", { cwd: dir, stdio: "inherit" });
  }
  return createRequire(join(dir, "package.json"))("@resvg/resvg-js");
}
const { Resvg } = loadResvg();

const render = (s, size) => new Resvg(s, { fitTo: { mode: "width", value: size } }).render().asPng();

// Maskable: wine full-bleed background, mark scaled into the central 70% safe zone.
const marker = /<rect width="1024" height="1024" fill="url\(#bg\)"\/>/;
if (!marker.test(svg)) throw new Error("icon-source.svg: background rect not found");
const [head, tail] = svg.replace(marker, "@@SPLIT@@").split("@@SPLIT@@");
const maskableSvg = head.replace(/<svg[^>]*>/, (m) => m) + `<rect width="1024" height="1024" fill="#1B1620"/><g transform="translate(512 512) scale(.7) translate(-512 -512)"><rect width="1024" height="1024" rx="0" fill="url(#bg)" opacity="0"/>` + tail.replace(/<\/svg>\s*$/, "</g></svg>");

for (const s of [72, 96, 128, 144, 152, 180, 192, 384, 512]) writeFileSync(join(pub, `pwa-icon-${s}.png`), render(svg, s));
for (const s of [192, 512]) writeFileSync(join(pub, `pwa-icon-maskable-${s}.png`), render(maskableSvg, s));
const fav = [16, 32, 48].map((s) => {
  const png = render(svg, s);
  writeFileSync(join(pub, `favicon-${s}.png`), png);
  return { s, png };
});
// favicon.ico with embedded PNG frames
const hdr = Buffer.alloc(6);
hdr.writeUInt16LE(1, 2);
hdr.writeUInt16LE(fav.length, 4);
let offset = 6 + 16 * fav.length;
const dirs = fav.map(({ s, png }) => {
  const d = Buffer.alloc(16);
  d[0] = s; d[1] = s; d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
  d.writeUInt32LE(png.length, 8); d.writeUInt32LE(offset, 12);
  offset += png.length;
  return d;
});
writeFileSync(join(pub, "favicon.ico"), Buffer.concat([hdr, ...dirs, ...fav.map((f) => f.png)]));
console.log("render-pwa-icons: wrote PWA icons, maskable icons, favicons");
