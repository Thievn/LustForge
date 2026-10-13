import { useRef, useState } from "react";

export function CompareSlider({ before, after }: { before?: string | null; after: string }) {
  const [x, setX] = useState(56);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  if (!before || before === after) {
    return <img src={after} alt="" className="max-h-[48vh] w-full rounded-2xl object-contain" />;
  }
  const move = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setX(Math.max(4, Math.min(96, ((clientX - box.left) / box.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className="relative max-h-[48vh] overflow-hidden rounded-2xl bg-black"
      onPointerDown={(event) => {
        drag.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event.clientX);
      }}
      onPointerMove={(event) => {
        if (drag.current) move(event.clientX);
      }}
      onPointerUp={() => {
        drag.current = false;
      }}
    >
      <img src={after} alt="After" className="max-h-[48vh] w-full object-contain" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}>
        <img src={before} alt="Before" className="h-full w-full object-contain" draggable={false} />
      </div>
      <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${x}%` }} />
      <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">Before</span>
      <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">After</span>
    </div>
  );
}
