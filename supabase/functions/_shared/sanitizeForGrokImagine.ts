/**
 * Unified Grok chat rewriter for **all** Imagine still + I2V prompts.
 * One system prompt; small mode suffixes for video vs portrait vs chat.
 */
import { sanitizeGrokImagineLexicon } from "./momentsPromptSanitize.ts";
import { resolveXaiApiKey } from "./resolveXaiApiKey.ts";
import { defaultGrokRewriteModel, grokSingleChatAssistantText } from "./xaiGrokChatRaw.ts";
import {
  I2V_MOUTH_STILL_DIRECTIVE_SHORT,
} from "./profileLoopVideoPrompt.ts";

const getEnv = (name: string) => Deno.env.get(name);

export type GrokSanitizeMode =
  | "chat_moment"
  | "forge_portrait"
  | "nexus_portrait"
  | "profile_loop"
  | "chat_clip"
  | "motion_notes_only";

export const GROK_IMAGINE_UNIFIED_REWRITER_SYSTEM = `You rewrite user text into a **single final English prompt** for xAI Grok Imagine (still image or image-to-video).

RULES (mandatory):
1. **Companion likeness first** — face, hair, body type, tattoos, species marks, and art style from COMPANION_DESCRIPTION must appear at the start of your output before scene, outfit, or motion.
2. Take USER_INPUT and produce a **highly suggestive but safe** prompt that will not trigger Grok content moderation.
3. Replace explicit/NSFW wording with tasteful sensual alternatives: lingerie, sheer fabric, seductive pose, wet skin, silk sheets, teasing, alluring, sensual silhouette, steamy, elegant boudoir, perfume-ad editorial, etc.
4. Preserve the user's **intent** (pose, mood, setting, outfit vibe) even when they used crude language — translate, do not delete the scene.
5. **Never** direct nudity, visible genitals, explicit sex acts, porn staging, or degrading angles.
6. Output **only** the final cleaned prompt — no markdown, no quotes, no commentary, no JSON.

Allowed: strong tease, lingerie, sheer fabric with coverage, sensual poses, romantic tension, smoldering eyes, fabric-led tease, cinematic boudoir **with tasteful coverage**.`;

const MODE_SUFFIX: Record<GrokSanitizeMode, string> = {
  chat_moment:
    "MODE: Chat Moments still. New pose/wardrobe/environment per USER_INPUT; **same person** as COMPANION_DESCRIPTION. Do not copy a catalog card sofa/room unless requested.",
  forge_portrait:
    "MODE: Forge catalog card portrait. **Strictly SFW** pin-up / fashion editorial — no nipples, no genitals, no explicit acts. Vertical 2:3 card.",
  nexus_portrait:
    "MODE: Nexus hybrid forge card portrait. Same SFW catalog rules as forge_portrait.",
  profile_loop:
    `MODE: Profile looping portrait video (I2V). Vertical 2:3, ~8–10s seamless loop from reference still. ${I2V_MOUTH_STILL_DIRECTIVE_SHORT} Motion only — same person and scene as the still; loop must close. Use positive editorial language only (lingerie, sheer layers, perfume-ad tease) — never mention forbidden anatomy or negated policy phrases.`,
  chat_clip:
    `MODE: Short in-chat companion video clip. ${I2V_MOUTH_STILL_DIRECTIVE_SHORT} Suggestive SFW motion; same identity as still.`,
  motion_notes_only:
    "MODE: Rewrite **only** the user's custom motion notes (1–3 sentences). Output motion direction only — no full video prompt wrapper. SFW suggestive tease; no nudity or explicit acts.",
};

function compactPromptText(input: string, maxChars: number): string {
  const normalized = input.replace(/\s+/g, " ").replace(/\s*([,.;:!?])\s*/g, "$1 ").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}…`;
}

function stripCodeFences(text: string): string {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```[a-z0-9_-]*\s*/i, "");
    const idx = s.lastIndexOf("```");
    if (idx > 0) s = s.slice(0, idx);
    s = s.trim();
  }
  return s.trim();
}

export type SanitizeForGrokImagineArgs = {
  userInput: string;
  companionDescription: string;
  mode?: GrokSanitizeMode;
  anatomyPolicy?: string;
  /** Skip Grok chat (caller already assembled a safe prompt). */
  skipChatRewrite?: boolean;
  chatModel?: string;
};

/**
 * Rewrites user/scene text + companion context into a Grok-Imagine-ready prompt.
 */
export async function sanitizeForGrokImagine(args: SanitizeForGrokImagineArgs): Promise<string> {
  const userInput = (args.userInput || "").trim();
  if (!userInput) {
    throw new Error("sanitizeForGrokImagine: empty userInput.");
  }

  const lexiconOnly = sanitizeGrokImagineLexicon(userInput);
  if (args.skipChatRewrite) {
    return compactPromptText(lexiconOnly, 3800);
  }

  const apiKey = resolveXaiApiKey(getEnv);
  if (!apiKey) {
    throw new Error("sanitizeForGrokImagine: set XAI_API_KEY or GROK_API_KEY.");
  }

  const mode: GrokSanitizeMode = args.mode ?? "chat_moment";
  const system = `${GROK_IMAGINE_UNIFIED_REWRITER_SYSTEM}\n\n${MODE_SUFFIX[mode]}`;
  const model = (args.chatModel && args.chatModel.trim()) || defaultGrokRewriteModel(getEnv);
  const companionDescription = (args.companionDescription || "").trim().slice(0, 6000);
  const anatomy = (args.anatomyPolicy || "").trim();

  const userContent = [
    anatomy ? `ANATOMY_POLICY (obey):\n${anatomy}\n` : "",
    "USER_INPUT:",
    userInput.slice(0, 12000),
    "",
    "COMPANION_DESCRIPTION (likeness lock — lead your output with this identity):",
    companionDescription || "(none — derive from USER_INPUT only)",
  ]
    .filter(Boolean)
    .join("\n");

  let content: string;
  try {
    content = stripCodeFences(
      await grokSingleChatAssistantText({
        model,
        system,
        user: userContent,
        temperature: mode === "motion_notes_only" ? 0.55 : mode === "profile_loop" ? 0.55 : 0.88,
        max_tokens: mode === "motion_notes_only" ? 400 : 900,
      }),
    );
  } catch (e) {
    console.warn("sanitizeForGrokImagine: Grok rewrite failed, lexicon fallback.", e);
    content = lexiconOnly;
  }

  if (content.trim().length < 12) {
    content = lexiconOnly;
  }

  const maxChars =
    mode === "motion_notes_only" ? 800 : mode === "forge_portrait" || mode === "nexus_portrait" ? 2600 : 3400;
  return sanitizeGrokImagineLexicon(compactPromptText(content, maxChars));
}

/** @deprecated Use sanitizeForGrokImagine — kept for existing imports. */
export type ImagineRewriteMode = "chat_session" | "portrait_card" | "tasteful_adult_brief";

export async function rewritePromptForImagine(args: {
  raw: string;
  context?: string;
  anatomyPolicy?: string;
  chatModel?: string;
  rewriteMode?: ImagineRewriteMode;
}): Promise<string> {
  const mode: GrokSanitizeMode =
    args.rewriteMode === "portrait_card"
      ? "forge_portrait"
      : args.rewriteMode === "tasteful_adult_brief"
        ? "forge_portrait"
        : "chat_moment";
  return sanitizeForGrokImagine({
    userInput: args.raw,
    companionDescription: args.context ?? "",
    mode,
    anatomyPolicy: args.anatomyPolicy,
    chatModel: args.chatModel,
  });
}
