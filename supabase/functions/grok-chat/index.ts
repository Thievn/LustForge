/**
 * xAI Grok (`XAI_API_KEY` / `GROK_API_KEY`):
 * - **classic_chat** — main in-app companion text chat.
 * - **live_voice** — Live Voice assistant text (uncensored voice stack prefix).
 * - **image_teaser** — one short in-character line before a still is shown.
 * - **smart_replies** — three short suggested user replies (JSON).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isLustforgeAdminUser, requireSessionUser } from "../_shared/requireSessionUser.ts";
import { publicApiTeaserGuardResponse } from "../_shared/publicApiTeaserGate.ts";
import { assertUserUnlockedCompanionForSpend } from "../_shared/requireCompanionFcUnlock.ts";
import { resolveXaiApiKey } from "../_shared/resolveXaiApiKey.ts";
import { defaultGrokProductChatModel } from "../_shared/xaiGrokChatRaw.ts";
import { lustforgeNarrowUserScopeBlock } from "../_shared/lustforgeNarrowUserScope.ts";
import { lustforgeChatServerSystemPrefix } from "../_shared/lustforgeChatSystemPrefix.ts";
import { GROK_VOICE_UNCENSORED_SYSTEM_PREFIX } from "../_shared/grokVoiceUncensoredPrefix.ts";
import { grokVisionImageModelCandidates } from "../_shared/grokVisionModels.ts";

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

/** Stable per `(userId, companionId)` for xAI prompt-cache affinity (`x-grok-conv-id`). */
async function grokConversationCacheId(userId: string, companionId: string): Promise<string> {
  const raw = new TextEncoder().encode(`${userId}:${companionId}`);
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extractJsonObject(text: string): unknown {
  const t = text.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(t.slice(start, end + 1)) as unknown;
    } catch {
      /* fall through */
    }
  }
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return null;
  }
}

const STATIC_SMART_FALLBACK = ["Tell me more…", "I love that.", "Keep going."];

type VoiceSourceBody = {
  name?: string;
  tagline?: string;
  bio?: string;
  backstory?: string;
  personality?: string;
  appearance?: string;
  role?: string;
};

function clipField(value: unknown, max: number): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function xaiChat(opts: {
  apiKey: string;
  model: string;
  messages: unknown[];
  maxTokens: number;
  temperature: number;
  convId?: string;
}): Promise<{ ok: true; content: string } | { ok: false; error: string; status: number }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.apiKey}`,
    "Content-Type": "application/json",
  };
  if (opts.convId) headers["x-grok-conv-id"] = opts.convId;
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    }),
  });
  const rawText = await res.text();
  let raw: unknown;
  try {
    raw = JSON.parse(rawText) as unknown;
  } catch {
    return { ok: false, status: 502, error: `xAI invalid JSON (HTTP ${res.status})` };
  }
  if (!res.ok) {
    const errMsg =
      typeof raw === "object" && raw !== null && "error" in raw
        ? JSON.stringify((raw as { error?: unknown }).error)
        : rawText.slice(0, 400);
    return { ok: false, status: 502, error: `xAI HTTP ${res.status}: ${errMsg}` };
  }
  const content = (raw as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content?.trim() || "";
  return { ok: true, content };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const sessionGate = await requireSessionUser(req);
    if ("response" in sessionGate) return sessionGate.response;
    const sessionUser = sessionGate.user;
    const teaserBlock = await publicApiTeaserGuardResponse(sessionUser);
    if (teaserBlock) return teaserBlock;
    const adminUnrestricted = await isLustforgeAdminUser(sessionUser);

    const apiKey = resolveXaiApiKey((name) => Deno.env.get(name));
    if (!apiKey) {
      return json(
        {
          error:
            "Grok chat not configured. Set Edge Function secret XAI_API_KEY or GROK_API_KEY (https://console.x.ai/).",
        },
        503,
      );
    }

    const body = (await req.json().catch(() => null)) as {
      intent?: string;
      companionId?: string;
      messages?: { role: string; content: string }[];
      systemPrompt?: string;
      companionName?: string;
      connectedToys?: unknown;
      imageDataUrl?: string;
      voiceSource?: VoiceSourceBody;
    } | null;

    const intent = String(body?.intent ?? "").trim();
    const allowed = new Set(["live_voice", "image_teaser", "classic_chat", "smart_replies", "voice_copy", "private_photo_react"]);
    if (!allowed.has(intent)) {
      return json(
        {
          error:
            "grok-chat: pass body.intent one of: \"classic_chat\", \"live_voice\", \"image_teaser\", \"smart_replies\", \"voice_copy\", \"private_photo_react\".",
        },
        400,
      );
    }

    const systemRaw = String(body?.systemPrompt ?? "").trim();
    if (intent !== "smart_replies" && intent !== "voice_copy" && !systemRaw) {
      return json({ error: "systemPrompt is required" }, 400);
    }

    const companionIdForGate = String(body?.companionId ?? "").trim();
    if (
      intent === "classic_chat" ||
      intent === "live_voice" ||
      intent === "smart_replies" ||
      intent === "image_teaser" ||
      intent === "private_photo_react"
    ) {
      if (!companionIdForGate) {
        return json(
          {
            error:
              "companionId is required — the server checks that this card is in your vault before running AI (same rule as Discover).",
            code: "MISSING_COMPANION_ID",
          },
          400,
        );
      }
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      if (!supabaseUrl || !svcKey) return json({ error: "Server misconfigured" }, 500);
      const svc = createClient(supabaseUrl, svcKey);
      const gate = await assertUserUnlockedCompanionForSpend(svc, sessionUser.id, companionIdForGate);
      if (!gate.ok) return json({ error: gate.message, code: "COMPANION_LOCKED" }, 403);
    }

    if (intent === "voice_copy") {
      const src = body?.voiceSource ?? {};
      const name = clipField(src.name, 80);
      if (!name) return json({ error: "voiceSource.name is required" }, 400);
      const userPrompt = `Write profile copy for a fictional consenting adult (21+).
Use ONLY facts in the fields below. Do not invent places, relatives, events, jobs, or traits that are not written there.
If something is missing, leave it out. Do not mention apps, credits, or technology.
Return JSON only: {"voice_teaser":"...","voice_story":"..."}
voice_teaser: one or two sentences, first person, about 160 characters, human, in their voice.
voice_story: 3 or 4 sentences, first person, in their voice, from the backstory and bio.

Name: ${name}
Tagline: ${clipField(src.tagline, 240)}
Role: ${clipField(src.role, 120)}
Personality: ${clipField(src.personality, 2000)}
Bio: ${clipField(src.bio, 4000)}
Backstory: ${clipField(src.backstory, 6000)}
Appearance: ${clipField(src.appearance, 1500)}`;
      const model = defaultGrokProductChatModel((n) => Deno.env.get(n));
      const result = await xaiChat({
        apiKey,
        model,
        maxTokens: 500,
        temperature: 0.7,
        messages: [
          { role: "system", content: "You return only JSON. You never invent biography." },
          { role: "user", content: userPrompt },
        ],
      });
      if (!result.ok) return json({ error: result.error }, result.status);
      const parsed = extractJsonObject(result.content) as { voice_teaser?: unknown; voice_story?: unknown } | null;
      const voice_teaser = clipField(parsed?.voice_teaser, 180);
      const voice_story = clipField(parsed?.voice_story, 1200);
      if (voice_teaser.length < 20 || voice_story.length < 40) {
        return json({ error: "Could not write her introduction." }, 502);
      }
      return json({ voice_teaser, voice_story, model });
    }

    if (intent === "private_photo_react") {
      const imageDataUrl = String(body?.imageDataUrl ?? "").trim();
      if (!imageDataUrl.startsWith("data:image/") || imageDataUrl.length > 4_500_000) {
        return json({ error: "She needs a picture to look at." }, 400);
      }
      const visionModels = grokVisionImageModelCandidates((n) => Deno.env.get(n));
      let sawMinor: boolean | null = null;
      for (const model of visionModels) {
        const screen = await xaiChat({
          apiKey,
          model,
          maxTokens: 80,
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                'Does this image appear to show anyone under 21? Reply JSON only: {"minor": true or false}. If you are unsure, minor is true.',
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Look at this picture." },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
        });
        if (!screen.ok) continue;
        const parsed = extractJsonObject(screen.content) as { minor?: unknown } | null;
        if (parsed && typeof parsed.minor === "boolean") {
          sawMinor = parsed.minor;
          break;
        }
      }
      if (sawMinor === true) {
        return json({ error: "She can't look at that picture." }, 400);
      }
      const threadRaw = Array.isArray(body?.messages) ? body!.messages! : [];
      let reaction = "";
      let usedModel = visionModels[0] ?? "grok-4.3";
      for (const model of visionModels) {
        const result = await xaiChat({
          apiKey,
          model,
          maxTokens: 280,
          temperature: 0.85,
          convId: await grokConversationCacheId(sessionUser.id, companionIdForGate),
          messages: [
            {
              role: "system",
              content: `${systemRaw}\n\nThe user just showed you a private photo only they can see. React in character, in the first person, in two or three sentences. Describe what you notice only if it is an adult. Do not mention apps, storage, or credits. If you cannot see the picture, say you want them to send it again.`,
            },
            ...threadRaw.slice(-6).map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content ?? "").slice(0, 500),
            })),
            {
              role: "user",
              content: [
                { type: "text", text: "Private photo — tell me what you think." },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
        });
        if (!result.ok || !result.content.trim()) continue;
        reaction = result.content.trim();
        usedModel = model;
        break;
      }
      if (!reaction) return json({ error: "She couldn't see that picture just now." }, 502);
      return json({ response: reaction, model: usedModel });
    }

    const threadRaw = Array.isArray(body?.messages) ? body!.messages! : [];

    let messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    let maxTokens = 1024;
    let temperature = 0.8;

    if (intent === "image_teaser") {
      messages = [
        { role: "system", content: systemRaw.slice(0, 120_000) },
        ...threadRaw.slice(-8).map((m) => {
          const role = m.role === "assistant" ? ("assistant" as const) : ("user" as const);
          return { role, content: String(m.content ?? "").slice(0, 24_000) };
        }),
      ];
      maxTokens = 512;
      temperature = 0.85;
    } else if (intent === "smart_replies") {
      const name = String(body?.companionName ?? "Companion").slice(0, 80);
      const scopeLine = adminUnrestricted
        ? ""
        : ` Suggestions must stay in fantasy/roleplay with the companion — no homework, technical, product/app, or general Q&A prompts.`;
      const sys = `You suggest 3 very short optional replies the USER could send next in an adults-only chat with "${name}".
Rules: Reply with **only** valid JSON, no markdown or code fences. Format: {"suggestions":["...","...","..."]}
Each string max 72 characters. Match thread energy: flirty, playful, or explicitly sexual language is allowed when it fits; stay consensual-adults fiction.${scopeLine}`;
      messages = [
        { role: "system", content: sys },
        ...threadRaw.slice(-14).map((m) => {
          const role = m.role === "assistant" ? ("assistant" as const) : ("user" as const);
          return { role, content: String(m.content ?? "").slice(0, 4000) };
        }),
      ];
      maxTokens = 220;
      temperature = 0.8;
    } else if (intent === "classic_chat") {
      const scopeBlock = adminUnrestricted ? "" : `${lustforgeNarrowUserScopeBlock()}\n`;
      const systemContent = `${lustforgeChatServerSystemPrefix()}\n${scopeBlock}${systemRaw}`.trim();
      messages = [
        { role: "system", content: systemContent.slice(0, 120_000) },
        ...threadRaw.slice(-100).map((m) => {
          const role = m.role === "assistant" ? ("assistant" as const) : ("user" as const);
          return { role, content: String(m.content ?? "").slice(0, 24_000) };
        }),
      ];
    } else {
      /* live_voice */
      const scopeBlock = adminUnrestricted ? "" : `${lustforgeNarrowUserScopeBlock()}\n`;
      const systemContent =
        `${GROK_VOICE_UNCENSORED_SYSTEM_PREFIX}${lustforgeChatServerSystemPrefix()}\n${scopeBlock}${systemRaw}`.trim();
      messages = [
        { role: "system", content: systemContent.slice(0, 120_000) },
        ...threadRaw.slice(-100).map((m) => {
          const role = m.role === "assistant" ? ("assistant" as const) : ("user" as const);
          return { role, content: String(m.content ?? "").slice(0, 24_000) };
        }),
      ];
    }

    const model = defaultGrokProductChatModel((n) => Deno.env.get(n));

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (companionIdForGate) {
      headers["x-grok-conv-id"] = await grokConversationCacheId(sessionUser.id, companionIdForGate);
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
      }),
    });

    const rawText = await res.text();
    let raw: unknown;
    try {
      raw = JSON.parse(rawText) as unknown;
    } catch {
      return json({ error: `xAI invalid JSON (HTTP ${res.status})` }, 502);
    }

    if (!res.ok) {
      const errMsg =
        typeof raw === "object" && raw !== null && "error" in raw
          ? JSON.stringify((raw as { error?: unknown }).error)
          : rawText.slice(0, 400);
      return json({ error: `xAI HTTP ${res.status}: ${errMsg}` }, 502);
    }

    const obj = raw as { choices?: Array<{ message?: { content?: string } }> };
    const content = obj.choices?.[0]?.message?.content?.trim() || "…";

    if (intent === "smart_replies") {
      const parsed = extractJsonObject(content);
      let suggestions: string[] = [];
      if (parsed && typeof parsed === "object" && parsed !== null && "suggestions" in parsed) {
        const arr = (parsed as { suggestions: unknown }).suggestions;
        if (Array.isArray(arr)) {
          suggestions = arr.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 3);
        }
      }
      if (suggestions.length < 3) {
        suggestions = [...suggestions, ...STATIC_SMART_FALLBACK].slice(0, 3);
      }
      return json({ suggestions, model, usage: (raw as { usage?: unknown })?.usage ?? null });
    }

    return json({ response: content, model, usage: (raw as { usage?: unknown })?.usage ?? null });
  } catch (err) {
    console.error("grok-chat:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg.length > 400 ? `${msg.slice(0, 397)}…` : msg }, 500);
  }
});
