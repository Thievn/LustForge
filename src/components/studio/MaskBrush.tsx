import { useEffect, useRef, useState, type PointerEvent } from "react";
import { StudioSheet } from "@/components/studio/Sheet";

export function MaskBrush({
  src,
  open,
  onClose,
  onDone,
}: {
  src: string;
  open: boolean;
  onClose: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(42);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const image = new Image();
    image.onload = () => {
      if (!canvas) return;
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    image.src = src;
  }, [open, src]);

  function paint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = size * (canvas.width / rect.width);
    ctx.lineCap = "round";
    ctx.beginPath();
    if (last.current) {
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    last.current = { x, y };
  }

  return (
    <StudioSheet
      open={open}
      title="Brush"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="h-12 w-full rounded-2xl bg-primary text-primary-foreground"
          onClick={() => {
            const url = canvasRef.current?.toDataURL("image/png");
            if (url) onDone(url);
          }}
        >
          Use this mask
        </button>
      }
    >
      <p className="mb-2 text-sm text-muted-foreground">Paint the part you want to change. White is the edit. Black stays put.</p>
      <input aria-label="Brush size" type="range" min={16} max={96} value={size} onChange={(event) => setSize(Number(event.target.value))} className="mb-3 w-full" />
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <img src={src} alt="" className="max-h-[40vh] w-full object-contain opacity-70" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair opacity-80"
          onPointerDown={(event) => {
            drawing.current = true;
            last.current = null;
            event.currentTarget.setPointerCapture(event.pointerId);
            paint(event);
          }}
          onPointerMove={(event) => {
            if (drawing.current) paint(event);
          }}
          onPointerUp={() => {
            drawing.current = false;
            last.current = null;
          }}
        />
      </div>
    </StudioSheet>
  );
}
