/** In-world lines for picture work. No machines, queues, or model names. */

export function studioMood(status: string | null | undefined): string {
  if (status === "IN_QUEUE" || status === "queued") return "Setting the mood…";
  if (status === "IN_PROGRESS") return "Almost there…";
  if (status === "COMPLETED" || status === "done") return "Tucking it away…";
  return "She's getting ready…";
}

export function studioTookTooLong(): string {
  return "She's taking a little longer. You can leave this — she'll still be getting ready.";
}

export function studioFailedLine(): string {
  return "She couldn't finish that picture. If it took a credit, it comes back.";
}
