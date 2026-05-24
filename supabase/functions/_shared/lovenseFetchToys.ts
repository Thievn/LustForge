import {
  extractToysFromGetToysResponse,
  isLikelyUserUidNotToyId,
  type ParsedLovenseToy,
} from "./lovenseToyParse.ts";

/** Server API: list toys linked to this app user id (post-QR). */
export async function fetchCloudToysForUser(userId: string): Promise<ParsedLovenseToy[]> {
  const developerToken = Deno.env.get("LOVENSE_DEVELOPER_TOKEN");
  if (!developerToken) return [];

  const res = await fetch("https://api.lovense.com/api/lan/getToys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: developerToken,
      uid: userId,
    }),
  });

  const json = await res.json().catch(() => ({}));
  return extractToysFromGetToysResponse(json).filter(
    (t) => !isLikelyUserUidNotToyId(t.deviceUid, userId),
  );
}

/** LAN API via Lovense tunnel domain from the QR callback payload. */
export async function fetchLanToysFromCallback(
  callbackData: Record<string, unknown>,
): Promise<ParsedLovenseToy[]> {
  const domain = typeof callbackData.domain === "string" ? callbackData.domain.trim() : "";
  const httpsPortRaw = callbackData.httpsPort;
  const httpsPort =
    typeof httpsPortRaw === "string"
      ? httpsPortRaw.trim()
      : typeof httpsPortRaw === "number"
        ? String(httpsPortRaw)
        : "";
  if (!domain || !httpsPort) return [];

  try {
    const res = await fetch(`https://${domain}:${httpsPort}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "GetToys" }),
    });
    const json = await res.json().catch(() => ({}));
    return extractToysFromGetToysResponse(json);
  } catch (err) {
    console.error("LAN GetToys failed:", err);
    return [];
  }
}
