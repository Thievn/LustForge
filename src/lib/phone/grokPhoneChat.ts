/** Body for the existing `grok-chat` edge function (classic_chat). */

export function buildGrokPhoneRequest(input: {
  companionId: string;
  companionName: string;
  systemPrompt: string;
  messages: { role: string; content: string }[];
}) {
  return {
    intent: "classic_chat" as const,
    companionId: input.companionId,
    companionName: input.companionName,
    systemPrompt: `${input.systemPrompt}\nWrite like a text thread. Prefer JSON only: {"bubbles":["..."],"image_request":null}. One to three short bubbles. image_request is {scene,outfit,framing,expression,pose_hint} only when a picture was asked for. Everyone is a fictional adult 21 or older.`,
    messages: input.messages,
  };
}

export function replyTextFromGrok(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const row = data as Record<string, unknown>;
  for (const key of ["response", "content", "message"]) {
    if (typeof row[key] === "string" && row[key].trim()) return String(row[key]);
  }
  return "";
}

export function pictureSignalFromGrok(data: unknown): "none" | "open" | "locked" | null {
  if (!data || typeof data !== "object") return null;
  const value = (data as { picture?: unknown }).picture;
  if (value === "none" || value === "open" || value === "locked") return value;
  return null;
}
