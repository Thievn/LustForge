import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HIGHLIGHTED_PLAN_ID, SPOILING_PLANS, type SpoilingPlanId } from "@/config/spoilingPlans";
import { cn } from "@/lib/utils";
import { SpoilingPlanCard } from "@/components/plans/SpoilingPlanCard";

const DESKTOP_QUERY = "(min-width: 1280px)";

function prefersDesktop() {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
}

export function SpoilingPlanDeck({ continueTo }: { continueTo: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [centered, setCentered] = useState<SpoilingPlanId>(HIGHLIGHTED_PLAN_ID);
  const centeredRef = useRef(centered);
  centeredRef.current = centered;

  const alignTo = useCallback((id: SpoilingPlanId, smooth: boolean) => {
    const root = scrollerRef.current;
    const card = root?.querySelector<HTMLElement>(`[data-slide="${id}"]`);
    if (!root || !card || card.getBoundingClientRect().width === 0) return;
    const rootRect = root.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const left = root.scrollLeft + (cardRect.left - rootRect.left) - (root.clientWidth - cardRect.width) / 2;
    root.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const markCentered = useCallback(() => {
    const root = scrollerRef.current;
    if (!root || prefersDesktop()) return;
    const midpoint = root.getBoundingClientRect().left + root.clientWidth / 2;
    let best: SpoilingPlanId = HIGHLIGHTED_PLAN_ID;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const plan of SPOILING_PLANS) {
      const card = root.querySelector<HTMLElement>(`[data-slide="${plan.id}"]`);
      if (!card) continue;
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - midpoint);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = plan.id;
      }
    }
    setCentered(best);
  }, []);

  useLayoutEffect(() => {
    if (prefersDesktop()) return;
    alignTo(HIGHLIGHTED_PLAN_ID, false);
  }, [alignTo]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(markCentered);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => {
      if (prefersDesktop()) {
        setCentered(HIGHLIGHTED_PLAN_ID);
        return;
      }
      alignTo(centeredRef.current, false);
      markCentered();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [alignTo, markCentered]);

  return (
    <div>
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Plans"
        onKeyDown={(event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          if (prefersDesktop()) return;
          const index = SPOILING_PLANS.findIndex((plan) => plan.id === centered);
          const next = event.key === "ArrowRight" ? index + 1 : index - 1;
          const plan = SPOILING_PLANS[next];
          if (!plan) return;
          event.preventDefault();
          setCentered(plan.id);
          alignTo(plan.id, true);
        }}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[12vw] pb-2 pt-5 [scrollbar-width:none] xl:grid xl:grid-cols-4 xl:gap-4 xl:overflow-visible xl:px-0 xl:pb-0 xl:pt-5 [&::-webkit-scrollbar]:hidden"
      >
        {SPOILING_PLANS.map((plan) => (
          <div key={plan.id} data-slide={plan.id} className="h-full w-[76vw] shrink-0 snap-center xl:w-auto xl:min-w-0 xl:shrink">
            <SpoilingPlanCard plan={plan} centered={centered === plan.id} continueTo={continueTo} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2 xl:hidden" aria-label="Plan cards">
        {SPOILING_PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            aria-label={plan.name}
            aria-current={centered === plan.id ? "true" : undefined}
            onClick={() => {
              setCentered(plan.id);
              alignTo(plan.id, true);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all",
              centered === plan.id ? "w-6 bg-[#D4AF37]" : "w-1.5 bg-white/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}
