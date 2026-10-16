/** Shown when a chat picture fails. Never leak worker wording (workflow, parameter, host names). */
export const CHAT_IMAGE_FAILURE_LINE = "She couldn't send that one. Try again.";

const TECHNICAL = /workflow|parameter|runpod|comfyui|\bcomfy\b|endpoint|gpu|worker|stack|undefined is not/i;

export function friendlyChatImageFailure(raw?: string | null): string {
  const text = String(raw ?? "").trim();
  if (!text || TECHNICAL.test(text)) return CHAT_IMAGE_FAILURE_LINE;
  return text.length > 180 ? CHAT_IMAGE_FAILURE_LINE : text;
}

/** Response body for a failed chat still. IMAGE_NOT_CONFIGURED stays a machine code. */
export function chatImageErrorPayload(message: string): { error: string; code: string; status: number } {
  if (message === "IMAGE_NOT_CONFIGURED") {
    return { error: message, code: message, status: 503 };
  }
  return { error: friendlyChatImageFailure(message), code: "IMAGE_FAILED", status: 502 };
}

/**
 * A failed picture is not sent again on the following turn unless the user asks again.
 * `failed` is the flag to keep after this decision (cleared once the retry was skipped).
 */
export function shouldSendChatImage(
  previousFailed: boolean,
  userAsked: boolean,
  modelAsked: boolean,
): { send: boolean; failed: boolean } {
  if (previousFailed && !userAsked) return { send: false, failed: false };
  return { send: userAsked || modelAsked, failed: previousFailed };
}
