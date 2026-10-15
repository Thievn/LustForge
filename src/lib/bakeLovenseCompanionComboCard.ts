import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbCompanion } from "@/hooks/useCompanions";
import { galleryStaticPortraitUrl } from "@/lib/companionMedia";
import { normalizeCompanionRarity } from "@/lib/companionRarity";
import { absolutizeMediaUrl, uploadFramedXMedia } from "@/lib/xMarketingFramedVideoBake";
import { LOVENSE_PROMO_H, LOVENSE_PROMO_W } from "@/lib/bakeLovensePromoCard";

function loadImageCors(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url.slice(0, 80)}`));
    img.src = url;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = "naturalWidth" in img ? img.naturalWidth : (img as HTMLVideoElement).videoWidth;
  const ih = "naturalHeight" in img ? img.naturalHeight : (img as HTMLVideoElement).videoHeight;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih) * 1.02;
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, 0, 0, iw, ih, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export type BakeLovenseComboCardArgs = {
  companion: DbCompanion;
  productName: string;
  productImageUrl?: string | null;
  productBadge?: string | null;
};

export async function bakeLovenseCompanionComboCardPngBlob(args: BakeLovenseComboCardArgs): Promise<Blob> {
  const { companion } = args;
  const canvas = document.createElement("canvas");
  canvas.width = LOVENSE_PROMO_W;
  canvas.height = LOVENSE_PROMO_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported.");

  const bg = ctx.createLinearGradient(0, 0, LOVENSE_PROMO_W, LOVENSE_PROMO_H);
  bg.addColorStop(0, "#1B1620");
  bg.addColorStop(0.5, "#120818");
  bg.addColorStop(1, "#1B1620");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LOVENSE_PROMO_W, LOVENSE_PROMO_H);

  const leftX = 32;
  const leftY = 40;
  const leftW = Math.floor(LOVENSE_PROMO_W * 0.54);
  const leftH = LOVENSE_PROMO_H - 80;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(leftX, leftY, leftW, leftH, 20);
  ctx.clip();
  const g = ctx.createLinearGradient(leftX, leftY, leftX + leftW, leftY + leftH);
  g.addColorStop(0, companion.gradient_from);
  g.addColorStop(1, companion.gradient_to);
  ctx.fillStyle = g;
  ctx.fillRect(leftX, leftY, leftW, leftH);

  const portraitUrl = galleryStaticPortraitUrl(companion, companion.id);
  if (portraitUrl) {
    try {
      const hero = await loadImageCors(absolutizeMediaUrl(portraitUrl));
      drawCover(ctx, hero, leftX, leftY, leftW, leftH);
    } catch {
      /* gradient fallback */
    }
  }

  const fade = ctx.createLinearGradient(0, leftY + leftH * 0.5, 0, leftY + leftH);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = fade;
  ctx.fillRect(leftX, leftY, leftW, leftH);
  ctx.restore();

  ctx.strokeStyle = "rgba(214,51,108,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(leftX, leftY, leftW, leftH, 20);
  ctx.stroke();

  const rarity = normalizeCompanionRarity(companion.rarity);
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.font = "bold 12px system-ui,sans-serif";
  const rLabel = rarity.toUpperCase();
  const rw = ctx.measureText(rLabel).width + 16;
  ctx.beginPath();
  ctx.roundRect(leftX + 14, leftY + 14, rw, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(rLabel, leftX + 22, leftY + 30);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Georgia,serif";
  ctx.fillText(companion.name, leftX + 16, leftY + leftH - 52);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "14px system-ui,sans-serif";
  const tag = (companion.tagline || "AI companion").slice(0, 60);
  ctx.fillText(tag, leftX + 16, leftY + leftH - 24);

  const badgeText = "Pairs with Lovense";
  ctx.font = "bold 12px system-ui,sans-serif";
  const bw = ctx.measureText(badgeText).width + 24;
  ctx.fillStyle = "rgba(214,51,108,0.22)";
  ctx.strokeStyle = "rgba(214,51,108,0.55)";
  ctx.shadowColor = "rgba(214,51,108,0.45)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(leftX + 14, leftY + leftH - 100, bw, 28, 10);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#F57AA3";
  ctx.fillText(badgeText, leftX + 26, leftY + leftH - 80);

  const rightX = leftX + leftW + 24;
  const rightW = LOVENSE_PROMO_W - rightX - 32;
  const rightY = 80;
  const rightH = LOVENSE_PROMO_H - 160;

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.strokeStyle = "rgba(214,51,108,0.3)";
  ctx.beginPath();
  ctx.roundRect(rightX, rightY, rightW, rightH, 16);
  ctx.fill();
  ctx.stroke();

  const pImg = args.productImageUrl?.trim();
  if (pImg) {
    try {
      const product = await loadImageCors(pImg.split("?")[0]!);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rightX + 8, rightY + 8, rightW - 16, rightH - 56, 12);
      ctx.clip();
      const scale = Math.min((rightW - 16) / product.naturalWidth, (rightH - 56) / product.naturalHeight);
      const dw = product.naturalWidth * scale;
      const dh = product.naturalHeight * scale;
      ctx.drawImage(product, rightX + 8 + (rightW - 16 - dw) / 2, rightY + 8 + (rightH - 56 - dh) / 2, dw, dh);
      ctx.restore();
    } catch {
      /* optional */
    }
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Georgia,serif";
  ctx.fillText(args.productName.slice(0, 28), rightX + 12, rightY + rightH - 28);
  if (args.productBadge?.trim()) {
    ctx.fillStyle = "rgba(255,184,217,0.9)";
    ctx.font = "600 10px system-ui,sans-serif";
    ctx.fillText(args.productBadge.trim().toUpperCase(), rightX + 12, rightY + rightH - 10);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export async function uploadLovenseComboCard(supabase: SupabaseClient, blob: Blob, slug: string): Promise<string> {
  return uploadFramedXMedia(supabase, blob, `lovense-combo-${slug}`);
}
