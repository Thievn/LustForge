/**
 * Generates a stagger-ready explicit two-voice breeding script for Nexus / covenant overlays (Grok 4.3).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireSessionUser } from "../_shared/requireSessionUser.ts";
import { resolveXaiApiKey } from "../_shared/resolveXaiApiKey.ts";
import {
  defaultGrokEdgeChatModel,
  defaultGrokProductChatModel,
  extractGrokAssistantText,
  grokChatCompletionRaw,
} from "../_shared/xaiGrokChatRaw.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(obj: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function stripCc(id: string): string | null {
  const t = id.trim();
  if (!t.startsWith("cc-")) return null;
  const u = t.slice(3);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(u) ? u : null;
}

function parentAllowed(row: Record<string, unknown>, userId: string): boolean {
  return row.user_id === userId;
}

function normalizeScriptLines(raw: unknown, targetMin: number): Array<{ kind: "speech" | "narration"; speaker: 0 | 1 | null; text: string }> {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const arr = Array.isArray(o.lines) ? o.lines : [];
  const out: Array<{ kind: "speech" | "narration"; speaker: 0 | 1 | null; text: string }> = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const text = String(r.text ?? "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 420) continue;
    const low = String(r.kind ?? "speech").toLowerCase();
    const kind: "speech" | "narration" = low === "narration" ? "narration" : "speech";
    out.push({ kind, speaker: null, text });
  }
  let flip: 0 | 1 = 0;
  for (const row of out) {
    if (row.kind === "narration") continue;
    row.speaker = flip;
    flip = flip === 0 ? 1 : 0;
  }
  const minOk = Math.max(28, Math.floor(targetMin * 0.38));
  if (out.length < minOk) return [];
  return out;
}

function nexusBreedingModel(getEnv: (name: string) => string | undefined): string {
  return (
    getEnv("GROK_NEXUS_BREEDING_MODEL")?.trim() ||
    getEnv("GROK_ADMIN_CHAT_MODEL")?.trim() ||
    defaultGrokProductChatModel(getEnv)
  );
}

function buildSystemPrompt(
  surface: "nexus_merge" | "ritual",
  targetLineCount: number,
  nameA: string,
  nameB: string,
): string {
  const baseRules = `Output **only** valid JSON (no markdown, no code fences, no commentary). Shape:
{"lines":[{"kind":"speech"|"narration","text":"string"}, ...]}

Rules:
- Produce at least ${targetLineCount} entries in "lines" (more is fine; cap at 200).
- kind "speech" = in-character dialogue from one of the two lovers only — first person, short (aim under 220 characters), natural cadence, continuous back-and-forth as if mid-act.
- kind "narration" = brief third-person scene beat (bodies, motion, heat, touch, breath, sweat) — one short sentence or clause each time. Use regularly but less than half of all lines.
- **Speaking order:** list "speech" lines in strict alternation: first speech is always ${nameA} (first thread), second speech is ${nameB} (second thread), then ${nameA}, then ${nameB}, and so on. Do **not** include a "speaker" field.
- Open with 1–2 "narration" lines, then begin alternating speech.
- Never use the words: child, baby, offspring, kid (any casing).
- Stay in voice: ${nameA} vs ${nameB} — personalities, kinks, and appearance below.
- JSON must be parseable; escape internal double quotes in strings.`;

  if (surface === "nexus_merge") {
    return `You write hardcore adults-only pornographic fantasy dialogue for a private fictional "Nexus breeding" scene between two consenting adult characters (no minors, no non-consent, no coercion).
${baseRules}

Tone for this surface (Nexus Forge — premium ritual):
- Raw, vulgar, explicit dirty talk — graphic body parts, fucking, moaning, wetness, grip, rhythm. No euphemisms, no fade-to-black, no poetic softening.
- Speech lines should feel like filthy sexting mid-sex: profanity welcome, kink-aware, hungry, shameless.
- Weave each parent's listed kinks and personality into how they speak and what they want.
- Narration beats stay physical and explicit (skin, breath, motion), not abstract romance.`;
  }

  return `You write explicit adults-only fantasy dialogue for a private fictional "Nexus breeding" scene between two consenting adult characters (no minors, no non-consent).
${baseRules}
- kind "speech" = lewd and continuous, as if they are mid-act with each other.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireSessionUser(req);
  if ("response" in auth) return auth.response;
  const userId = auth.user.id;

  let body: {
    parentAId?: string;
    parentBId?: string;
    targetLineCount?: number;
    surface?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const idA = typeof body.parentAId === "string" ? stripCc(body.parentAId) : null;
  const idB = typeof body.parentBId === "string" ? stripCc(body.parentBId) : null;
  if (!idA || !idB || idA === idB) {
    return json({ error: "Two distinct forge companions (cc-…) are required." }, 400);
  }

  const rawTarget = typeof body.targetLineCount === "number" && Number.isFinite(body.targetLineCount)
    ? Math.round(body.targetLineCount)
    : 72;
  const targetLineCount = Math.max(40, Math.min(170, rawTarget));
  const surface: "nexus_merge" | "ritual" = body.surface === "nexus_merge" ? "nexus_merge" : "ritual";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Server misconfigured" }, 500);
  }

  const apiKey = resolveXaiApiKey((n) => Deno.env.get(n) ?? undefined);
  if (!apiKey) {
    return json({ error: "Grok not configured (XAI_API_KEY / GROK_API_KEY)." }, 503);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: rows, error: qErr } = await supabase
    .from("custom_characters")
    .select("id,user_id,name,gender,role,personality,kinks,appearance,tagline,bio")
    .in("id", [idA, idB]);

  if (qErr || !rows || rows.length !== 2) {
    return json({ error: "Could not load both parents." }, 400);
  }

  const pa = rows.find((r) => r.id === idA) as Record<string, unknown> | undefined;
  const pb = rows.find((r) => r.id === idB) as Record<string, unknown> | undefined;
  if (!pa || !pb || !parentAllowed(pa, userId) || !parentAllowed(pb, userId)) {
    return json({ error: "Parents must be in your vault." }, 403);
  }

  const nameA = String(pa.name ?? "First").trim().slice(0, 80) || "First";
  const nameB = String(pb.name ?? "Second").trim().slice(0, 80) || "Second";

  const brief = (r: Record<string, unknown>) => ({
    name: String(r.name ?? "").slice(0, 80),
    gender: String(r.gender ?? "").slice(0, 40),
    role: String(r.role ?? "").slice(0, 40),
    tagline: String(r.tagline ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
    personality: String(r.personality ?? "").replace(/\s+/g, " ").trim().slice(0, 520),
    appearance: String(r.appearance ?? "").replace(/\s+/g, " ").trim().slice(0, 420),
    bio: String(r.bio ?? "").replace(/\s+/g, " ").trim().slice(0, 360),
    kinks: Array.isArray(r.kinks) ? (r.kinks as unknown[]).map((x) => String(x)).slice(0, 12).join(", ") : "",
  });

  const system = buildSystemPrompt(surface, targetLineCount, nameA, nameB);
  const userMsg = `THREAD I (${nameA}):\n${JSON.stringify(brief(pa))}\n\nTHREAD II (${nameB}):\n${JSON.stringify(brief(pb))}\n\nGenerate the JSON now.`;

  const model = surface === "nexus_merge"
    ? nexusBreedingModel((n) => Deno.env.get(n))
    : defaultGrokEdgeChatModel((n) => Deno.env.get(n));

  const res = await grokChatCompletionRaw({
    model,
    messages: [
      { role: "system", content: system.slice(0, 120_000) },
      { role: "user", content: userMsg.slice(0, 24_000) },
    ],
    temperature: surface === "nexus_merge" ? 0.92 : 0.88,
    max_tokens: 12_000,
  }, apiKey);

  if (!res.ok || res.json === null) {
    console.error("nexus-breeding-dialogue grok", res.status, res.rawText.slice(0, 400));
    return json({ error: `Grok error (HTTP ${res.status})` }, 502);
  }

  const assistant = extractGrokAssistantText(res.json);
  let parsed: unknown;
  try {
    parsed = JSON.parse(assistant) as unknown;
  } catch {
    const start = assistant.indexOf("{");
    const end = assistant.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(assistant.slice(start, end + 1)) as unknown;
      } catch {
        parsed = null;
      }
    }
  }

  const lines = normalizeScriptLines(parsed, targetLineCount);
  if (!lines.length) {
    return json({ error: "Model returned an unusable script — try again." }, 502);
  }

  return json({ lines, model, surface });
});
