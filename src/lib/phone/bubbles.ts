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

export function looksLikePictureAsk(text: string): boolean {
  return /\b(pic|picture|photo|selfie|image|send me)\b/i.test(text);
}
