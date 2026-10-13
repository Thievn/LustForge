/**
 * Studio safety. Ported from lustforge-lab `src/lib/safety.js` + `src/lib/sign.js`.
 * Explicit detection is the keyword list plus a Grok text check. Fail closed.
 * Source tags: lab (generated here), character (passed import), upload (anything else).
 */

export type SourceTag = "lab" | "character" | "upload";

export const SRC_RANK: Record<SourceTag, number> = { upload: 0, character: 1, lab: 2 };

/** Exact keyword list from the Lab. "strip mall" / "strip light" / "strip club" are not explicit. */
export const EXPLICIT =
  /\b(nud(e|es|ity)|naked|nsfw|topless|bottomless|undress\w*|unclothe\w*|disrobe\w*|strip(ped|ping|s)?\b(?! ?(mall|light|club))|take (off|away) (her|his|their|the) (clothes|clothing|outfit|top|shirt|bra|dress|skirt|pants|panties|underwear|bikini)|remov\w* (all )?(of )?(her|his|their|the)? ?(clothes|clothing|outfit|top|shirt|bra|dress|skirt|pants|jeans|panties|underwear|bikini|lingerie|towel)|without (any )?(clothes|clothing|top|bra|panties|underwear)|no (clothes|clothing|top|bra|panties|underwear)|bare (breasts?|chest|butt|ass|skin)|nipples?|areola\w*|breasts?|boobs?|tits?|titties|genital\w*|pussy|vagina\w*|vulva|labia|penis|cock|dick|erect\w*|testic\w*|butt ?hole|anus|sex(ual|y)?\b|porn\w*|explicit|xxx|erotic\w*|lewd|cum\b|orgasm\w*|masturbat\w*|see[- ]?through|sheer|transparent (top|dress|shirt|bra|lingerie)|wet (t-?shirt|shirt)|lingerie|g-?string|thong|pasties|implied nudity|covering (her|his) (breasts|chest))/i;

export const EXPLICIT_UPLOAD_MESSAGE =
  "That edit isn't available on an uploaded photo. Import as character if this is a fictional adult you have the rights to use.";

export const CAMERA_EXIF_MESSAGE =
  "That file has camera info in it, so it can't be imported as a character. Use a drawing or render without camera metadata.";

export function explicitByRegex(text: string | null | undefined): string | null {
  const match = EXPLICIT.exec(String(text ?? ""));
  return match ? match[0] : null;
}

export function weakest(sources: Array<SourceTag | null | undefined>): SourceTag {
  return sources.reduce<SourceTag>((best, next) => {
    if (!next || !(next in SRC_RANK)) return best;
    return SRC_RANK[next] < SRC_RANK[best] ? next : best;
  }, "lab");
}

export function isSourceTag(value: unknown): value is SourceTag {
  return value === "lab" || value === "character" || value === "upload";
}

/** Lab `ensureAdult` for the Z-Image path (non-Illustrious). */
export function ensureAdult(prompt: string): string {
  const text = String(prompt || "").trim();
  if (/21\+/.test(text)) return text;
  const man = /\b(man|male|guy|masc)\b/i.test(text) && !/\bwoman\b/i.test(text);
  return `${text} Subject is an adult ${man ? "man" : "woman"}, 21+.`;
}

function bytesToB64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacB64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToB64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signImage(bytes: Uint8Array, src: SourceTag, secret: string): Promise<string> {
  const digest = await sha256Hex(bytes);
  const mac = await hmacB64Url(secret, `img:${src}:${digest}`);
  return `${src}.${mac}`;
}

export async function verifyImage(bytes: Uint8Array, tag: string | null | undefined, secret: string): Promise<SourceTag> {
  if (typeof tag !== "string") return "upload";
  const dot = tag.indexOf(".");
  if (dot <= 0) return "upload";
  const src = tag.slice(0, dot);
  const mac = tag.slice(dot + 1);
  if (!isSourceTag(src) || !mac) return "upload";
  const digest = await sha256Hex(bytes);
  const want = await hmacB64Url(secret, `img:${src}:${digest}`);
  return timingSafeEqual(mac, want) ? src : "upload";
}

export function parseDataUrl(value: string | null | undefined): { bytes: Uint8Array; contentType: string } | null {
  const match = String(value ?? "").match(/^data:([^;,]+)?;base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  const clean = match[2].replace(/\s/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, contentType: match[1] || "image/png" };
}

function u16(view: Uint8Array, offset: number, le: boolean): number {
  if (offset + 1 >= view.length) return 0;
  return le ? view[offset] | (view[offset + 1] << 8) : (view[offset] << 8) | view[offset + 1];
}

function u32(view: Uint8Array, offset: number, le: boolean): number {
  if (offset + 3 >= view.length) return 0;
  return le
    ? (view[offset] | (view[offset + 1] << 8) | (view[offset + 2] << 16) | (view[offset + 3] << 24)) >>> 0
    : ((view[offset] << 24) | (view[offset + 1] << 16) | (view[offset + 2] << 8) | view[offset + 3]) >>> 0;
}

/** True when an IFD contains camera identity, a capture timestamp, a lens name, or GPS. */
function ifdHasCameraTags(tiff: Uint8Array, offset: number, le: boolean, depth: number): boolean {
  if (depth > 3 || offset + 2 > tiff.length) return false;
  const count = u16(tiff, offset, le);
  const cameraTags = new Set([0x010f, 0x0110, 0x8825, 0x9003, 0x9004, 0xa433, 0xa434]);
  for (let i = 0; i < count; i++) {
    const entry = offset + 2 + i * 12;
    if (entry + 12 > tiff.length) return false;
    const tag = u16(tiff, entry, le);
    const type = u16(tiff, entry + 2, le);
    const n = u32(tiff, entry + 4, le);
    if (tag === 0x8769) {
      const next = u32(tiff, entry + 8, le);
      if (ifdHasCameraTags(tiff, next, le, depth + 1)) return true;
      continue;
    }
    if (!cameraTags.has(tag)) continue;
    if (tag === 0x8825) return true;
    if (n > 0 && (type === 2 || type === 1 || type === 7)) return true;
  }
  return false;
}

function jpegHasCameraExif(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let i = 2;
  while (i + 4 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2;
      continue;
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (len < 2 || i + 2 + len > bytes.length) break;
    if (marker === 0xe1) {
      const start = i + 4;
      const header = String.fromCharCode(bytes[start] ?? 0, bytes[start + 1] ?? 0, bytes[start + 2] ?? 0, bytes[start + 3] ?? 0, bytes[start + 4] ?? 0, bytes[start + 5] ?? 0);
      if (header === "Exif\0\0") {
        const tiff = bytes.subarray(start + 6, i + 2 + len);
        const le = tiff[0] === 0x49 && tiff[1] === 0x49;
        const be = tiff[0] === 0x4d && tiff[1] === 0x4d;
        if ((le || be) && tiff.length >= 8) {
          const ifd0 = u32(tiff, 4, le);
          if (ifdHasCameraTags(tiff, ifd0, le, 0)) return true;
        }
      }
    }
    i += 2 + len;
  }
  return false;
}

function pngHasCameraExif(bytes: Uint8Array): boolean {
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return false;
  let i = 8;
  while (i + 8 <= bytes.length) {
    const len = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
    const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
    if (type === "eXIf") return true;
    if (type === "IEND") break;
    if (len > bytes.length) break;
    i += 12 + len;
  }
  return false;
}

export function cameraExifReason(bytes: Uint8Array): string | null {
  if (jpegHasCameraExif(bytes) || pngHasCameraExif(bytes)) return CAMERA_EXIF_MESSAGE;
  return null;
}
