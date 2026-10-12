import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireSessionUser, isLustforgeAdminUser } from "../_shared/requireSessionUser.ts";
import { defaultGrokProductChatModel, grokChatCompletionRaw } from "../_shared/xaiGrokChatRaw.ts";
import { minorReason } from "../_shared/adultGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(obj: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const STRUCTURED_SUFFIX = `
Reply with ONLY valid JSON, no markdown.
Shape: {"bubbles":["..."],"image_request":null}
bubbles: 1 to 3 short text-message strings, like a real phone thread.
Set image_request only when the user asked for a picture or you are sending one:
{"scene":"","outfit":"","framing":"half-body","expression":"","pose_hint":""}
All people depicted are fictional consenting adults age 21 or older. Refuse anything younger.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const sessionGate = await requireSessionUser(req);
    if ("response" in sessionGate) return sessionGate.response;
    const user = sessionGate.user;
    const admin = await isLustforgeAdminUser(user);

    const body = (await req.json().catch(() => null)) as {
      companionId?: string;
      companionName?: string;
      systemPrompt?: string;
      messages?: { role: string; content: string }[];
    } | null;

    const companionId = String(body?.companionId ?? "").trim();
    const systemRaw = String(body?.systemPrompt ?? "").trim();
    if (!companionId || !systemRaw) return json({ error: "companionId and systemPrompt are required" }, 400);

    const thread = Array.isArray(body?.messages) ? body!.messages! : [];
    const lastUser = [...thread].reverse().find((row) => row.role !== "assistant");
    const blocked = minorReason(lastUser?.content);
    if (blocked) return json({ error: blocked, code: "MINOR_BLOCKED" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const svc = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    let textsLeft: number | null = null;
    let plan = "free";
    if (svc && !admin) {
      const { data: profile, error } = await svc
        .from("profiles")
        .select("plan, texts_left, texts_quota_date, is_catalog_owner")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && profile) {
        plan = String(profile.plan ?? "free");
        const owner = Boolean(profile.is_catalog_owner);
        if (!owner && plan === "free") {
          const today = new Date().toISOString().slice(0, 10);
          let left = Number(profile.texts_left ?? 10);
          if (profile.texts_quota_date !== today) left = 10;
          if (left <= 0) {
            return json(
              { error: "Daily free texts are used up. A pass adds more.", code: "OUT_OF_TEXTS", texts_left: 0 },
              402,
            );
          }
          textsLeft = left - 1;
          await svc
            .from("profiles")
            .update({ texts_left: textsLeft, texts_quota_date: today })
            .eq("user_id", user.id);
        }
      }
    }

    const messages = [
      { role: "system", content: `${systemRaw}\n${STRUCTURED_SUFFIX}`.slice(0, 120_000) },
      ...thread.slice(-40).map((row) => ({
        role: row.role === "assistant" ? "assistant" : "user",
        content: String(row.content ?? "").slice(0, 8_000),
      })),
    ];

    const model = defaultGrokProductChatModel((name) => Deno.env.get(name));
    const completion = await grokChatCompletionRaw({
      model,
      messages,
      max_tokens: 700,
      temperature: 0.85,
    });
    if (!completion.ok) {
      return json({ error: completion.rawText.slice(0, 400) || "Grok request failed" }, 502);
    }
    const content =
      (completion.json as { choices?: Array<{ message?: { content?: string } }> } | null)?.choices?.[0]?.message
        ?.content ?? "";

    return json({
      content,
      model,
      plan,
      texts_left: textsLeft,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message.slice(0, 400) }, 500);
  }
});
