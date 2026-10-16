import { useEffect, useRef, type PointerEvent } from "react";

type Props = {
  before?: string | null;
  after: string;
  /** Caps the frame. The edit tab stays short; the gallery viewer can pass a taller limit. */
  frameClass?: string;
};

/** Map a pointer x into 0–100 across the frame. Width 0 keeps the caller from jumping. */
export function comparePercent(clientX: number, left: number, width: number): number | null {
  if (!(width > 0) || !Number.isFinite(clientX)) return null;
  const raw = ((clientX - left) / width) * 100;
  return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}

/**
 * Before/after clip. Position lives in a CSS variable updated once per frame,
 * so a finger drag does not re-render React or resize either image.
 */
export function CompareSlider({ before, after, frameClass = "max-h-[48vh]" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const pendingX = useRef<number | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty("--compare-x", "56");
    root.setAttribute("aria-valuenow", "56");
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [before, after]);

  if (!before || before === after) {
    return <img src={after} alt="" draggable={false} className={`${frameClass} w-full rounded-2xl object-contain`} />;
  }

  const paint = (next: number) => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty("--compare-x", String(next));
    root.setAttribute("aria-valuenow", String(Math.round(next)));
  };

  const queue = (clientX: number) => {
    pendingX.current = clientX;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const x = pendingX.current;
      const box = rootRef.current?.getBoundingClientRect();
      if (x == null || !box) return;
      const next = comparePercent(x, box.left, box.width);
      if (next == null) return;
      paint(next);
    });
  };

  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    pointerId.current = null;
    const node = event.currentTarget;
    if (node.hasPointerCapture?.(event.pointerId)) node.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={rootRef}
      role="slider"
      aria-label="Compare before and after"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={56}
      tabIndex={0}
      className={`relative w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-2xl bg-black [--compare-x:56] ${frameClass}`}
      style={{ touchAction: "none", WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (pointerId.current != null) return;
        pointerId.current = event.pointerId;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* Capture can fail if the pointer is already gone. Moves still track while the finger is over the frame. */
        }
        if (event.pointerType !== "mouse") event.preventDefault();
        queue(event.clientX);
      }}
      onPointerMove={(event) => {
        if (pointerId.current !== event.pointerId) return;
        if (event.pointerType !== "mouse") event.preventDefault();
        queue(event.clientX);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={() => {
        pointerId.current = null;
      }}
      onDragStart={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        const current = Number(event.currentTarget.getAttribute("aria-valuenow") ?? "56");
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          event.preventDefault();
          paint(Math.max(0, current - 2));
        } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          event.preventDefault();
          paint(Math.min(100, current + 2));
        } else if (event.key === "Home") {
          event.preventDefault();
          paint(0);
        } else if (event.key === "End") {
          event.preventDefault();
          paint(100);
        }
      }}
    >
      <img
        src={after}
        alt=""
        draggable={false}
        className={`pointer-events-none block w-full select-none object-contain ${frameClass}`}
      />
      <img
        src={before}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        style={{ clipPath: "inset(0 calc((100 - var(--compare-x)) * 1%) 0 0)", willChange: "clip-path" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ transform: "translate3d(calc(var(--compare-x) * 1%), 0, 0)" }}
      >
        <div
          className="pointer-events-auto absolute inset-y-0 left-0 w-16 -translate-x-1/2 touch-none"
          style={{ touchAction: "none" }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.45)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/50 shadow-[0_2px_16px_rgba(0,0,0,0.45)]" />
        </div>
      </div>
      <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">Before</span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">After</span>
    </div>
  );
}
