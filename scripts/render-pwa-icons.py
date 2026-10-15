#!/usr/bin/env python3
"""Render LustForge PWA icons: deep wine ground, rose/gold flame, Cinzel monogram."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
FONT = PUBLIC / "fonts" / "cinzel-decorative-700.ttf"

WINE = (27, 22, 32, 255)
WINE_DEEP = (42, 20, 36, 255)
ROSE = (214, 51, 108, 255)
ROSE_SOFT = (245, 122, 163, 255)
GOLD = (212, 175, 55, 255)
CREAM = (246, 239, 234, 255)

ANY_SIZES = (16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512)
MASKABLE = (192, 512)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def gradient(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size))
    px = img.load()
    cx = cy = (size - 1) / 2
    max_r = math.hypot(cx, cy)
    for y in range(size):
        for x in range(size):
            r = math.hypot(x - cx, y - cy * 0.92) / max_r
            t = min(1.0, r ** 0.85)
            # warm highlight toward the upper third
            lift = max(0.0, 1 - math.hypot((x - cx) / size, (y - size * 0.28) / size) * 2.2)
            col = tuple(
                min(255, lerp(WINE_DEEP[i], WINE[i], t) + int(lift * (36 if i == 0 else 12)))
                for i in range(3)
            )
            px[x, y] = (*col, 255)
    return img


def flame_polygon(cx: float, cy: float, s: float) -> list[tuple[float, float]]:
    """Classic fire silhouette. Unit box is 0..1, y grows downward, then scaled by s."""
    unit = [
        (0.50, 0.02),
        (0.40, 0.16),
        (0.33, 0.14),
        (0.28, 0.28),
        (0.18, 0.26),
        (0.16, 0.42),
        (0.12, 0.52),
        (0.20, 0.66),
        (0.30, 0.80),
        (0.50, 0.96),
        (0.70, 0.80),
        (0.80, 0.66),
        (0.88, 0.52),
        (0.84, 0.42),
        (0.82, 0.26),
        (0.72, 0.28),
        (0.67, 0.14),
        (0.60, 0.16),
    ]
    return [(cx + (x - 0.5) * s, cy + (y - 0.5) * s) for x, y in unit]


def draw_mark(base: Image.Image, scale: float) -> Image.Image:
    size = base.size[0]
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    cx = size / 2
    cy = size * (0.40 if scale < 0.7 else 0.38)
    s = size * scale * 0.86

    # gold halo
    halo = Image.new("RGBA", base.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse(
        (cx - s * 0.42, cy - s * 0.48, cx + s * 0.42, cy + s * 0.46),
        fill=(214, 51, 108, 70),
    )
    halo = halo.filter(ImageFilter.GaussianBlur(radius=max(1, size * 0.03)))
    base = Image.alpha_composite(base, halo)

    ring_r = s * 0.46
    draw.ellipse(
        (cx - ring_r, cy - ring_r * 0.98, cx + ring_r, cy + ring_r * 0.92),
        outline=(*GOLD[:3], 180),
        width=max(2, int(size * 0.012)),
    )

    flame = flame_polygon(cx, cy + s * 0.02, s * 0.78)
    draw.polygon(flame, fill=ROSE)
    # inner gold tongue
    inner = flame_polygon(cx, cy + s * 0.08, s * 0.42)
    draw.polygon(inner, fill=GOLD)
    core = flame_polygon(cx, cy + s * 0.12, s * 0.20)
    draw.polygon(core, fill=CREAM)

    # monogram
    if size >= 96 and FONT.exists():
        font_size = max(12, int(size * (0.16 if scale < 0.7 else 0.145)))
        font = ImageFont.truetype(str(FONT), font_size)
        text = "LF"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        tx = cx - tw / 2
        ty = cy + s * 0.50
        draw.text((tx, ty), text, font=font, fill=GOLD)

    return Image.alpha_composite(base, overlay)


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGBA").save(path, "PNG", optimize=True)


def main() -> None:
    for size in ANY_SIZES:
        img = draw_mark(gradient(size), 0.72 if size >= 64 else 0.78)
        name = "favicon-32.png" if size == 32 else f"pwa-icon-{size}.png"
        if size == 16:
            name = "favicon-16.png"
        if size == 48:
            name = "favicon-48.png"
        save_png(img, PUBLIC / name)

    for size in MASKABLE:
        # Maskable safe zone is the central 80%. Keep the mark inside ~62%.
        img = draw_mark(gradient(size), 0.52)
        save_png(img, PUBLIC / f"pwa-icon-maskable-{size}.png")

    # Multi-size favicon.ico
    ico_sizes = [16, 32, 48]
    images = [Image.open(PUBLIC / f"favicon-{s}.png").convert("RGBA") for s in ico_sizes]
    images[0].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=images[1:],
    )
    print("wrote icons", ANY_SIZES, "maskable", MASKABLE)


if __name__ == "__main__":
    main()
