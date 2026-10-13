/** One Apply. Tools stack into a single instruction and a single credit. */

export function resolveStackedEdit(body: Record<string, unknown>): {
  tool: string;
  instruction: string;
  variations: number;
  chargeCount: number;
} {
  const userText = String(body.instruction ?? "").slice(0, 800);
  const backgroundText = String(body.background ?? "").trim().slice(0, 300);
  const requested = String(body.tool ?? "prompt");
  const outfitCount = Array.isArray(body.outfitRefs) ? body.outfitRefs.length : 0;
  const hasPose = Boolean(String(body.poseId ?? "").trim() || String(body.poseDataUrl ?? "").trim());
  const hasMask = Boolean(String(body.maskDataUrl ?? "").trim());
  const includeFix = body.includeFix === true || requested === "fix";
  const stacked = body.stacked === true;
  const parts: string[] = [];

  if (includeFix) {
    const fix = String(body.fix ?? "face");
    if (fix === "hands") parts.push("Fix the hands: five fingers, natural adult anatomy. Keep the face, clothing, pose, and background identical.");
    else if (fix === "touch") parts.push("Subtle natural touch-up. Keep identity and clothing identical.");
    else parts.push("Fix the face: natural adult features, symmetrical eyes. Keep identity, clothing, pose, and background.");
  }
  if (requested === "background" || backgroundText) {
    parts.push(`Replace the background with ${backgroundText || userText || "a soft studio backdrop"}. Keep the person identical.`);
  }
  if (outfitCount > 0) parts.push("Change the outfit to match the reference. Keep the face identical.");
  if (hasPose) parts.push("Change the pose to match the skeleton reference. Keep the face and outfit.");
  if (hasMask) parts.push("Change only the white painted region. Leave everything else identical.");
  if (userText && (requested !== "background" || backgroundText)) parts.push(userText);

  const tool = hasMask
    ? "brush"
    : outfitCount > 0
      ? "outfit"
      : includeFix
        ? "fix"
        : hasPose
          ? "pose"
          : requested === "background"
            ? "background"
            : "prompt";

  const variations = stacked ? 1 : Math.max(1, Math.min(4, Math.floor(Number(body.variations ?? 1)) || 1));
  return {
    tool,
    instruction: parts.join(" ").trim(),
    variations,
    chargeCount: variations,
  };
}

export function quoteStackedEdit(input: { admin: boolean; stacked?: boolean; variations?: number }): {
  credits: number;
  label: string;
  chargeCount: number;
} {
  if (input.admin) return { credits: 0, label: "Unlimited", chargeCount: 0 };
  const chargeCount = input.stacked === false
    ? Math.max(1, Math.min(4, Math.floor(Number(input.variations ?? 1)) || 1))
    : 1;
  const label = chargeCount === 1 ? "This edit: 1 credit" : `This edit: ${chargeCount} credits`;
  return { credits: chargeCount, label, chargeCount };
}

export function stackedEditReady(input: {
  hasImage: boolean;
  instruction: string;
  outfitCount: number;
  poseId: string | null;
  mask: boolean;
  includeFix: boolean;
  background: boolean;
}): { ok: boolean; error: string | null } {
  if (!input.hasImage) return { ok: false, error: "Upload a photo or open one from the gallery." };
  if (input.outfitCount > 3) return { ok: false, error: "An outfit swap takes at most 3 reference pictures." };
  const hasChange = Boolean(
    input.instruction.trim() || input.outfitCount || input.poseId || input.mask || input.includeFix || input.background,
  );
  if (!hasChange) return { ok: false, error: "Set a typed edit, an outfit, a pose, or a mask, then apply once." };
  return { ok: true, error: null };
}

/** Credits stay spent only when the job completes. Failure returns them. */
export function settleStackedCharge(input: {
  admin: boolean;
  chargeCount: number;
  status: string;
}): { kept: number; refunded: number } {
  if (input.admin || input.chargeCount <= 0) return { kept: 0, refunded: 0 };
  if (input.status === "COMPLETED") return { kept: input.chargeCount, refunded: 0 };
  return { kept: 0, refunded: input.chargeCount };
}
