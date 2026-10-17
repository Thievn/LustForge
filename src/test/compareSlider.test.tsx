import { Profiler, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompareSlider, comparePercent } from "@/components/studio/CompareSlider";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
    }
  }
  (globalThis as { PointerEvent?: typeof MouseEvent }).PointerEvent = PointerEventPolyfill as unknown as typeof MouseEvent;
}

describe("compare percent", () => {
  it("maps a pointer into the frame and clamps the edges", () => {
    expect(comparePercent(150, 100, 200)).toBe(25);
    expect(comparePercent(0, 100, 200)).toBe(0);
    expect(comparePercent(999, 100, 200)).toBe(100);
    expect(comparePercent(150, 100, 0)).toBeNull();
  });
});

describe("compare slider", () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it("drags from the image with pointer capture and does not re-render", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const updates = { n: 0 };
    await act(async () => {
      root?.render(
        <Profiler id="slider" onRender={(_id, phase) => { if (phase === "update") updates.n += 1; }}>
          <CompareSlider before="/before.png" after="/after.png" />
        </Profiler>,
      );
    });

    const slider = container.querySelector("[role='slider']") as HTMLDivElement;
    expect(slider).toBeTruthy();
    expect(slider.style.touchAction).toBe("none");
    expect(slider.getAttribute("aria-valuenow")).toBe("56");
    const before = slider.querySelectorAll("img")[1] as HTMLImageElement;
    expect(before.style.clipPath).toContain("var(--compare-x)");
    expect(before.getAttribute("draggable")).toBe("false");

    slider.getBoundingClientRect = () => ({
      x: 100,
      y: 0,
      left: 100,
      top: 0,
      right: 300,
      bottom: 200,
      width: 200,
      height: 200,
      toJSON() { return {}; },
    });
    const capture = vi.fn();
    slider.setPointerCapture = capture;

    await act(async () => {
      slider.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        pointerId: 7,
        pointerType: "touch",
        button: 0,
      }));
      slider.dispatchEvent(new PointerEvent("pointermove", {
        bubbles: true,
        cancelable: true,
        clientX: 200,
        pointerId: 7,
        pointerType: "touch",
      }));
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(capture).toHaveBeenCalledWith(7);
    expect(slider.style.getPropertyValue("--compare-x")).toBe("50");
    expect(slider.getAttribute("aria-valuenow")).toBe("50");
    expect(updates.n).toBe(0);

    await act(async () => {
      slider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    });
    expect(slider.getAttribute("aria-valuenow")).toBe("52");
  });
});
