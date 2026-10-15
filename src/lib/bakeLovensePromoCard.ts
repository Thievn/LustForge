import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LOVENSE_BG_END,
  LOVENSE_BG_MID,
  LOVENSE_BG_START,
  LOVENSE_CARD_H,
  LOVENSE_CARD_W,
} from "@/lib/lovenseProductCardTheme";
import { uploadFramedXMedia } from "@/lib/xMarketingFramedVideoBake";

export const LOVENSE_PROMO_W = LOVENSE_CARD_W;
export const LOVENSE_PROMO_H = LOVENSE_CARD_H;

function loadImageCors(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url.slice(0, 80)}`));
    img.src = url;
  });
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let ly = y;
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ly);
      lines++;
      if (lines >= maxLines) return;
      ly += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, ly);
}

export type BakeLovensePromoCardArgs = {
  productName: string;
  productDescription?: string | null;
  productImageUrl?: string | null;
  badge?: string | null;
};

export async function bakeLovensePromoCardPngBlob(args: BakeLovensePromoCardArgs): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = LOVENSE_PROMO_W;
  canvas.height = LOVENSE_PROMO_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported.");

  const bg = ctx.createLinearGradient(0, 0, LOVENSE_PROMO_W, LOVENSE_PROMO_H);
  bg.addColorStop(0, LOVENSE_BG_START);
  bg.addColorStop(0.45, LOVENSE_BG_MID);
  bg.addColorStop(1, LOVENSE_BG_END);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LOVENSE_PROMO_W, LOVENSE_PROMO_H);

  ctx.save();
  ctx.globalAlpha = 0.35;
  const glow = ctx.createRadialGradient(LOVENSE_PROMO_W * 0.72, LOVENSE_PROMO_H * 0.35, 0, LOVENSE_PROMO_W * 0.72, LOVENSE_PROMO_H * 0.35, 420);
  glow.addColorStop(0, "rgba(214,51,108,0.55)");
  glow.addColorStop(1, "rgba(214,51,108,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, LOVENSE_PROMO_W, LOVENSE_PROMO_H);
  ctx.restore();

  const imgUrl = args.productImageUrl?.trim();
  const panelX = LOVENSE_PROMO_W * 0.52;
  const panelY = 48;
  const panelW = LOVENSE_PROMO_W * 0.42;
  const panelH = LOVENSE_PROMO_H - 96;

  if (imgUrl) {
    try {
      const productImg = await loadImageCors(imgUrl.split("?")[0]!);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 18);
      ctx.clip();
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      const scale = Math.min(panelW / productImg.naturalWidth, panelH / productImg.naturalHeight);
      const dw = productImg.naturalWidth * scale;
      const dh = productImg.naturalHeight * scale;
      ctx.drawImage(productImg, panelX + (panelW - dw) / 2, panelY + (panelH - dh) / 2, dw, dh);
      ctx.restore();
      ctx.strokeStyle = "rgba(214,51,108,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 18);
      ctx.stroke();
    } catch {
      /* product panel optional */
    }
  }

  ctx.fillStyle = "rgba(214,51,108,0.92)";
  ctx.font = "bold 13px system-ui,sans-serif";
  ctx.fillText("LustForge × Lovense", 56, 52);

  if (args.badge?.trim()) {
    const badge = args.badge.trim().toUpperCase();
    ctx.font = "bold 11px system-ui,sans-serif";
    const bw = ctx.measureText(badge).width + 20;
    ctx.fillStyle = "rgba(214,51,108,0.18)";
    ctx.strokeStyle = "rgba(214,51,108,0.45)";
    ctx.beginPath();
    ctx.roundRect(56, 64, bw, 24, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#F57AA3";
    ctx.fillText(badge, 66, 81);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Georgia,serif";
  wrapLines(ctx, args.productName, 56, 130, LOVENSE_PROMO_W * 0.46, 48, 2);

  if (args.productDescription?.trim()) {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "18px system-ui,sans-serif";
    wrapLines(ctx, args.productDescription.trim(), 56, 240, LOVENSE_PROMO_W * 0.44, 26, 3);
  }

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 14px system-ui,sans-serif";
  ctx.fillText("Shop syncable toys → lustforge.app/toys", 56, LOVENSE_PROMO_H - 48);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export async function uploadLovensePromoCard(supabase: SupabaseClient, blob: Blob, slug: string): Promise<string> {
  return uploadFramedXMedia(supabase, blob, `lovense-${slug}`);
}
