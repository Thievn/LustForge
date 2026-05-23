import { requireSessionUser } from "../_shared/requireSessionUser.ts";
import { resolveXaiApiKey } from "../_shared/resolveXaiApiKey.ts";
import {
  defaultGrokEdgeChatModel,
  extractGrokAssistantText,
  grokChatCompletionRaw,
} from "../_shared/xaiGrokChatRaw.ts";
import { buildForgeCompanionNamingBrief } from "../_shared/buildForgeCompanionNamingBrief.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeNameKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function sanitizeGender(g: unknown): string {
  if (typeof g !== "string") return "non-binary";
  const t = g.replace(/\s+/g, " ").trim().slice(0, 48);
  return t || "non-binary";
}

function parseSingleNameFromAssistant(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^["'\u201c\u201d`]+|["'\u201c\u201d`]+$/g, "").trim();
  const firstLine = t.split(/\r?\n/).map((x) => x.trim()).find(Boolean) ?? "";
  const noLabel = firstLine.replace(/^(name|companion)\s*:\s*/i, "").trim();
  return noLabel.slice(0, 120);
}

function buildUserPrompt(gender: string, namingBrief: string): string {
  const brief = namingBrief.trim();
  if (brief.length >= 24) {
    return [
      "NAMING_BRIEF (invent ONE display name that fits this companion exactly):",
      brief,
      "",
      `Gender anchor: ${gender}.`,
      "Output only the name.",
    ].join("\n");
  }
  return `Generate a memorable display name for a ${gender} AI companion. Match a premium adult catalog tone. Return only the name — first name only OR first + last (2–4 words max).`;
}

const NAMING_SYSTEM = `You name premium adult AI companions for LustForge (dark romance / companion forge catalog).

The user's message is the **complete** naming brief — follow it literally.

Rules:
1. Invent a **one-of-one** display name that sounds native to the brief's era, theme tab, personality, and visual lane.
2. **Allowed:** a single first name OR first + last (2–4 words total, max 120 characters).
3. **Forbidden:** Luna/Raven/Scarlett/Nova/Lilith-class clichés; stock gothic surname lists (Grimholt, Nightbane, Shadowmere, Thorne, Dreadmarch, etc.); repeating syllable-mash patterns; copying any name in the avoid list.
4. **Do not** default to cyber-goth or generic dark fantasy unless the brief explicitly calls for that lane.
5. Phonetics and cadence should match the brief (modern casual, feudal Japan, cyberpunk handle, mythic compound, etc.).
6. Respond with **only** the companion's display name — no quotation marks, no labels, no explanation, no trailing sentence punctuation.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const sessionGate = await requireSessionUser(req);
  if ("response" in sessionGate) return sessionGate.response;

  try {
    const body = (await req.json()) as {
      gender?: unknown;
      avoid_names?: unknown;
      naming_brief?: unknown;
      /** Legacy: structured context when client sends fields instead of pre-built brief */
      forgePersonality?: unknown;
      activeForgeTab?: unknown;
      forgeThemeLine?: unknown;
      artStyle?: unknown;
      sceneAtmosphere?: unknown;
      bodyType?: unknown;
      ethnicity?: unknown;
      traits?: unknown;
      namePrefix?: unknown;
      tagline?: unknown;
      narrativeAppearance?: unknown;
    };
    const gender = sanitizeGender(body.gender);
    const avoidRaw = Array.isArray(body.avoid_names) ? body.avoid_names : [];
    const avoidList = avoidRaw
      .map((x) => (typeof x === "string" ? x.trim().slice(0, 120) : ""))
      .filter(Boolean)
      .slice(0, 400);
    const avoidJson = JSON.stringify(avoidList);

    let namingBrief =
      typeof body.naming_brief === "string" ? body.naming_brief.trim().slice(0, 1400) : "";
    if (!namingBrief && body.forgePersonality && typeof body.forgePersonality === "object") {
      const fp = body.forgePersonality as Record<string, unknown>;
      namingBrief = buildForgeCompanionNamingBrief({
        gender,
        forgePersonality: {
          timePeriod: String(fp.timePeriod ?? "Modern Day"),
          personalityType: String(fp.personalityType ?? "Sweet & Loving"),
          speechStyle: String(fp.speechStyle ?? "Modern & Casual"),
          sexualEnergy: String(fp.sexualEnergy ?? "Sensual & Romantic"),
          relationshipVibe: String(fp.relationshipVibe ?? "Devoted Girlfriend"),
        },
        activeForgeTab: typeof body.activeForgeTab === "string" ? body.activeForgeTab : undefined,
        forgeThemeLine: typeof body.forgeThemeLine === "string" ? body.forgeThemeLine : undefined,
        artStyle: typeof body.artStyle === "string" ? body.artStyle : undefined,
        sceneAtmosphere: typeof body.sceneAtmosphere === "string" ? body.sceneAtmosphere : undefined,
        bodyType: typeof body.bodyType === "string" ? body.bodyType : undefined,
        ethnicity: typeof body.ethnicity === "string" ? body.ethnicity : undefined,
        traits: Array.isArray(body.traits) ? body.traits.map(String) : undefined,
        namePrefix: typeof body.namePrefix === "string" ? body.namePrefix : undefined,
        tagline: typeof body.tagline === "string" ? body.tagline : undefined,
        narrativeAppearance: typeof body.narrativeAppearance === "string"
          ? body.narrativeAppearance
          : undefined,
      });
    }

    const xaiKey = resolveXaiApiKey((n) => Deno.env.get(n));
    if (!xaiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Naming service not configured. Set Edge Function secret XAI_API_KEY or GROK_API_KEY.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const system = [
      NAMING_SYSTEM,
      avoidList.length
        ? `Do not output any name that equals (case-insensitive, collapse spaces) an entry in this JSON array. Invent a clearly different label:\n${avoidJson}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const user = buildUserPrompt(gender, namingBrief);
    const model = defaultGrokEdgeChatModel((n) => Deno.env.get(n) ?? undefined);

    const r = await grokChatCompletionRaw(
      {
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.85,
        max_tokens: 96,
      },
      xaiKey,
    );

    if (!r.ok) {
      return new Response(
        JSON.stringify({
          error: "Naming request failed",
          details: typeof r.rawText === "string" ? r.rawText.slice(0, 500) : "",
        }),
        { status: r.status || 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const text = extractGrokAssistantText(r.json);
    const name = parseSingleNameFromAssistant(text);
    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ error: "Naming service returned an empty name" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nk = normalizeNameKey(name);
    if (avoidList.some((a) => normalizeNameKey(a) === nk)) {
      return new Response(JSON.stringify({ error: "Naming service returned a forbidden duplicate name" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ name }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg || "generate-forge-companion-name failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
