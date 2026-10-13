import { describe, expect, it } from "vitest";
import {
  quoteStackedEdit,
  resolveStackedEdit,
  settleStackedCharge,
  stackedEditReady,
} from "../../supabase/functions/_shared/stackedEdit";

describe("stacked edit charge", () => {
  it("prices one stacked edit as 1 credit even with pose, outfit, mask, and text", () => {
    const resolved = resolveStackedEdit({
      stacked: true,
      instruction: "softer light",
      poseId: "stand_hips",
      poseDataUrl: "data:image/png;base64,aa",
      outfitRefs: [{ dataUrl: "a" }, { dataUrl: "b" }],
      maskDataUrl: "data:image/png;base64,bb",
      variations: 4,
    });
    expect(resolved.variations).toBe(1);
    expect(resolved.chargeCount).toBe(1);
    expect(resolved.tool).toBe("brush");
    expect(resolved.instruction).toContain("outfit");
    expect(resolved.instruction).toContain("pose");
    expect(resolved.instruction).toContain("softer light");
    expect(quoteStackedEdit({ admin: false, stacked: true }).label).toBe("This edit: 1 credit");
  });

  it("does not charge admins and refunds a failed edit", () => {
    expect(quoteStackedEdit({ admin: true })).toEqual({ credits: 0, label: "Unlimited", chargeCount: 0 });
    expect(settleStackedCharge({ admin: true, chargeCount: 1, status: "FAILED" })).toEqual({ kept: 0, refunded: 0 });
    expect(settleStackedCharge({ admin: false, chargeCount: 1, status: "COMPLETED" })).toEqual({ kept: 1, refunded: 0 });
    expect(settleStackedCharge({ admin: false, chargeCount: 1, status: "FAILED" })).toEqual({ kept: 0, refunded: 1 });
    expect(settleStackedCharge({ admin: false, chargeCount: 1, status: "TIMED_OUT" })).toEqual({ kept: 0, refunded: 1 });
  });

  it("refuses an empty edit and a pose-only edit is ready", () => {
    expect(stackedEditReady({ hasImage: true, instruction: "", outfitCount: 0, poseId: null, mask: false, includeFix: false, background: false }).ok).toBe(false);
    expect(stackedEditReady({ hasImage: false, instruction: "x", outfitCount: 0, poseId: null, mask: false, includeFix: false, background: false }).error).toMatch(/Upload/);
    expect(stackedEditReady({ hasImage: true, instruction: "", outfitCount: 0, poseId: "stand_hips", mask: false, includeFix: false, background: false }).ok).toBe(true);
  });
});
