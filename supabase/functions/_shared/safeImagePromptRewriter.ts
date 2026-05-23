/**
 * @deprecated Import from `sanitizeForGrokImagine.ts` instead.
 * Re-exports for backward compatibility during migration.
 */
export {
  GROK_IMAGINE_UNIFIED_REWRITER_SYSTEM,
  rewritePromptForImagine,
  sanitizeForGrokImagine,
  type GrokSanitizeMode,
  type ImagineRewriteMode,
  type SanitizeForGrokImagineArgs,
} from "./sanitizeForGrokImagine.ts";

export const CHAT_SESSION_IMAGE_REWRITER_SYSTEM = "See GROK_IMAGINE_UNIFIED_REWRITER_SYSTEM in sanitizeForGrokImagine.ts";
export const PORTRAIT_IMAGE_REWRITER_SYSTEM = CHAT_SESSION_IMAGE_REWRITER_SYSTEM;
export const TASTEFUL_ADULT_BRIEF_REWRITER_SYSTEM = CHAT_SESSION_IMAGE_REWRITER_SYSTEM;
export const SAFE_IMAGE_REWRITER_SYSTEM = CHAT_SESSION_IMAGE_REWRITER_SYSTEM;
export const CHAT_IMAGE_ARTISTIC_STYLE_ANCHOR = "";
