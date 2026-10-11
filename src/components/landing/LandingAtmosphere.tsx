import { useEffect, useRef } from "react";

/**
 * Soft rose / plum / teal glows. Scroll parallax runs on desktop only, and
 * never when the visitor prefers reduced motion.
 */
export function LandingAtmosphere() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    const node = layer.current;
    if (!node) return;

    let frame = 0;
    const paint = () => {
      frame = 0;
      if (reduce.matches || !desktop.matches) {
        node.style.setProperty("--landing-parallax", "0px");
        return;
      }
      const y = window.scrollY || 0;
      node.style.setProperty("--landing-parallax", `${Math.round(Math.min(y, 2400) * 0.1)}px`);
    };
    const onScroll = () => {
      if (reduce.matches || !desktop.matches) return;
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    reduce.addEventListener("change", paint);
    desktop.addEventListener("change", paint);
    return () => {
      window.removeEventListener("scroll", onScroll);
      reduce.removeEventListener("change", paint);
      desktop.removeEventListener("change", paint);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={layer}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
      style={{ ["--landing-parallax" as string]: "0px" }}
    >
      <div
        className="absolute -left-[18%] -top-[8%] h-[48vh] w-[78vw] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.2), transparent 68%)",
          transform: "translate3d(0, var(--landing-parallax), 0)",
        }}
      />
      <div
        className="absolute -right-[12%] top-[28%] h-[42vh] w-[58vw] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--velvet-purple) / 0.18), transparent 70%)",
          transform: "translate3d(0, calc(var(--landing-parallax) * -0.55), 0)",
        }}
      />
      <div
        className="absolute bottom-[8%] left-[18%] h-[36vh] w-[48vw] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--electric-teal) / 0.1), transparent 70%)",
          transform: "translate3d(0, calc(var(--landing-parallax) * 0.28), 0)",
        }}
      />
    </div>
  );
}
