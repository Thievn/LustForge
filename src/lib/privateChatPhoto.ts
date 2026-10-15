/** Shrink a picture before it is stored and shown to her. The thread never renders it. */
export async function fileToPrivateJpeg(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    const dataUrl = await readAsDataUrl(file);
    return { blob: file, dataUrl };
  }
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    const dataUrl = await readAsDataUrl(file);
    return { blob: file, dataUrl };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("picture"))), "image/jpeg", 0.82);
  });
  const dataUrl = await readAsDataUrl(new File([blob], "photo.jpg", { type: "image/jpeg" }));
  return { blob, dataUrl };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("picture"));
    reader.readAsDataURL(file);
  });
}

export const PRIVATE_PHOTO_LABEL = "Private photo";
