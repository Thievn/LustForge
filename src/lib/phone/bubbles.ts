import { shouldSendChatImage } from "../../../supabase/functions/_shared/chatImageCopy";
import {
  decideImageCharge,
  type PictureSignal,
} from "../../../supabase/functions/_shared/pictureAllowance";

export {
  LOCKED_PHOTO_LABEL,
  LOCKED_PHOTO_PROMPT,
  looksLikePictureAsk,
  phoneSendGate,
  type PictureSignal,
} from "../../../supabase/functions/_shared/pictureAllowance";

/** Server `picture: "open"` wins over a stale empty balance so a real pic still dispatches. */
export function planChatPicture(input: {
  userAsked: boolean;
  modelAsked: boolean;
  previousFailed: boolean;
  serverPicture: PictureSignal | null;
  picsLeft: number;
  credits: number;
  catalogOwner: boolean;
}): { image: "none" | "dispatch" | "locked"; failed: boolean } {
  const decision = shouldSendChatImage(input.previousFailed, input.userAsked, input.modelAsked);
  if (!decision.send) return { image: "none", failed: decision.failed };
  if (input.serverPicture === "locked") return { image: "locked", failed: decision.failed };
  if (input.serverPicture === "open") return { image: "dispatch", failed: decision.failed };
  const charge = decideImageCharge({
    catalogOwner: input.catalogOwner,
    picsLeft: input.picsLeft,
    credits: input.credits,
  });
  return { image: charge.action === "locked" ? "locked" : "dispatch", failed: decision.failed };
}

/** Split a companion reply into 1–3 texting bubbles. */

export function splitBubbles(raw: string): string[] {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return ["…"];
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [text];
  if (parts.length === 2) return parts;
  const head = parts.slice(0, 2);
  const tail = parts.slice(2).join(" ");
  return [...head, tail].filter(Boolean).slice(0, 3);
}

export function parseStructuredReply(content: string): { bubbles: string[]; imageRequest: ImageRequest | null } {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(content.slice(start, end + 1)) as {
        bubbles?: unknown;
        reply?: unknown;
        image_request?: unknown;
      };
      const fromBubbles = Array.isArray(parsed.bubbles)
        ? parsed.bubbles.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [];
      const fromReply = typeof parsed.reply === "string" ? splitBubbles(parsed.reply) : [];
      const bubbles = (fromBubbles.length ? fromBubbles : fromReply).slice(0, 3);
      const imageRequest = normalizeImageRequest(parsed.image_request);
      if (bubbles.length) return { bubbles, imageRequest };
    } catch {
      /* plain text */
    }
  }
  return { bubbles: splitBubbles(content), imageRequest: null };
}

export type ImageRequest = {
  scene: string;
  outfit: string;
  framing: string;
  expression: string;
  poseHint: string;
};

function normalizeImageRequest(value: unknown): ImageRequest | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const scene = String(row.scene ?? "").trim();
  if (!scene) return null;
  return {
    scene,
    outfit: String(row.outfit ?? "").trim(),
    framing: String(row.framing ?? "half-body").trim(),
    expression: String(row.expression ?? "").trim(),
    poseHint: String(row.pose_hint ?? row.poseHint ?? "").trim(),
  };
}

export type Receipt = "pending" | "sent" | "delivered" | "failed";

/** Single check = sent. Double check = delivered. Pending and a failed unsent message have none. */
export function visibleTicks(receipt: Receipt, saved: boolean): 0 | 1 | 2 {
  if (receipt === "delivered") return 2;
  if (receipt === "sent" || (receipt === "failed" && saved)) return 1;
  return 0;
}

export function isLockedPhotoMessage(content: string, imageUrl?: string | null): boolean {
  return content.trim() === "Locked photo" && !String(imageUrl ?? "").trim();
}

const TECHNICAL_CHAT = /xai|workflow|parameter|stack|http \d|edge function/i;

export function chatFailureNote(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim();
  if (!text || text.length > 180 || TECHNICAL_CHAT.test(text)) return "She didn't get that.";
  return text;
}

export function isStoredMessageId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/** Last unanswered user turn is a failure. Earlier saved lines stay sent. A later reply is delivered. */
export function annotateReceipts<T extends { role: "user" | "assistant" }>(
  rows: T[],
): Array<T & { receipt: Receipt; saved: boolean }> {
  let lastUserIndex = -1;
  rows.forEach((row, index) => {
    if (row.role === "user") lastUserIndex = index;
  });
  return rows.map((row, index) => {
    if (row.role !== "user") return { ...row, receipt: "delivered" as const, saved: true };
    const hasLaterAssistant = rows.slice(index + 1).some((item) => item.role === "assistant");
    if (hasLaterAssistant) return { ...row, receipt: "delivered" as const, saved: true };
    if (index === lastUserIndex) return { ...row, receipt: "failed" as const, saved: true };
    return { ...row, receipt: "sent" as const, saved: true };
  });
}
