import { describe, expect, it } from "vitest";
import {
  cameraExifReason,
  explicitByRegex,
  signImage,
  verifyImage,
  weakest,
} from "../../supabase/functions/_shared/studioSafety";

describe("studio safety", () => {
  it("matches the lab explicit list and ignores strip mall", () => {
    expect(explicitByRegex("a tasteful portrait in a coat")).toBeNull();
    expect(explicitByRegex("strip mall at night")).toBeNull();
    expect(explicitByRegex("please undress her")).toMatch(/undress/i);
    expect(explicitByRegex("lingerie on the chair")).toMatch(/lingerie/i);
  });

  it("keeps the weakest source tag", () => {
    expect(weakest(["lab", "character"])).toBe("character");
    expect(weakest(["lab", "upload"])).toBe("upload");
    expect(weakest(["character"])).toBe("character");
    expect(weakest([])).toBe("lab");
  });

  it("signs an image and rejects a tampered tag", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const tag = await signImage(bytes, "lab", "test-secret");
    expect(tag.startsWith("lab.")).toBe(true);
    expect(await verifyImage(bytes, tag, "test-secret")).toBe("lab");
    expect(await verifyImage(bytes, tag, "other-secret")).toBe("upload");
    expect(await verifyImage(new Uint8Array([9]), tag, "test-secret")).toBe("upload");
    expect(await verifyImage(bytes, undefined, "test-secret")).toBe("upload");
  });

  it("rejects jpeg camera EXIF and allows a jpeg without it", () => {
    expect(cameraExifReason(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
    const make = jpegWithMake("Canon");
    expect(cameraExifReason(make)).toMatch(/camera info/i);
  });

  it("rejects a png eXIf chunk", () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x00, 0x65, 0x58, 0x49, 0x66,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(cameraExifReason(png)).toMatch(/camera info/i);
  });
});

function jpegWithMake(make: string) {
  const ascii = new TextEncoder().encode(make + "\0");
  const entryCount = 1;
  const ifdSize = 2 + entryCount * 12 + 4;
  const tiff = new Uint8Array(8 + ifdSize + ascii.length);
  tiff[0] = 0x49;
  tiff[1] = 0x49;
  tiff[2] = 42;
  tiff[4] = 8;
  tiff[8] = entryCount;
  tiff[10] = 0x0f;
  tiff[11] = 0x01;
  tiff[12] = 2;
  tiff[14] = ascii.length;
  const valueOffset = 8 + ifdSize;
  tiff[18] = valueOffset & 0xff;
  tiff[19] = (valueOffset >> 8) & 0xff;
  tiff.set(ascii, valueOffset);
  const payload = new Uint8Array(6 + tiff.length);
  payload.set(new TextEncoder().encode("Exif\0\0"), 0);
  payload.set(tiff, 6);
  const segmentLength = payload.length + 2;
  const jpeg = new Uint8Array(2 + 4 + payload.length + 2);
  jpeg[0] = 0xff;
  jpeg[1] = 0xd8;
  jpeg[2] = 0xff;
  jpeg[3] = 0xe1;
  jpeg[4] = (segmentLength >> 8) & 0xff;
  jpeg[5] = segmentLength & 0xff;
  jpeg.set(payload, 6);
  jpeg[jpeg.length - 2] = 0xff;
  jpeg[jpeg.length - 1] = 0xd9;
  return jpeg;
}
