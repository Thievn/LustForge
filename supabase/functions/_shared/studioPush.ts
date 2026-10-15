import webpush from "npm:web-push@3.6.7";

type Svc = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string } | null }>;
    };
    delete: () => {
      eq: (col: string, val: string) => Promise<unknown>;
    };
  };
};

let vapidReady = false;

function initVapid(): boolean {
  if (vapidReady) return true;
  const publicKey = (Deno.env.get("VAPID_PUBLIC_KEY") ?? "").trim();
  const privateKey = (Deno.env.get("VAPID_PRIVATE_KEY") ?? "").trim();
  const subject = (Deno.env.get("VAPID_CONTACT") ?? "mailto:support@lustforge.app").trim();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

/** Best-effort buzz when a picture is ready. Quiet if push is not configured. */
export async function sendStudioPush(
  svc: Svc,
  userId: string,
  payload: { title: string; body: string; url: string; tag: string },
): Promise<number> {
  if (!initVapid()) return 0;
  const { data, error } = await svc.from("web_push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  if (error || !data?.length) return 0;
  const body = JSON.stringify(payload);
  let sent = 0;
  for (const row of data) {
    const endpoint = String(row.endpoint ?? "");
    const p256dh = String(row.p256dh ?? "");
    const auth = String(row.auth ?? "");
    const id = String(row.id ?? "");
    if (!endpoint || !p256dh || !auth) continue;
    try {
      await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, body, { TTL: 60 * 60, urgency: "normal" });
      sent += 1;
    } catch (err) {
      const status = typeof err === "object" && err && "statusCode" in err ? Number((err as { statusCode?: number }).statusCode) : 0;
      if ((status === 404 || status === 410) && id) {
        await svc.from("web_push_subscriptions").delete().eq("id", id);
      }
    }
  }
  return sent;
}
