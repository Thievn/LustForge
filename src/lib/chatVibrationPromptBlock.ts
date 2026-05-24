import type { CompanionVibrationPatternRow } from "@/hooks/useCompanionVibrationPatterns";
import { parseVibrationPayload } from "@/lib/vibrationPatternPayload";

function escapeJsonString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Injects companion-specific Lovense menu lines so Grok can map
 * "signature move", pattern names, and toy-control requests to real hardware JSON.
 */
export function buildVibrationPatternPromptBlock(rows: CompanionVibrationPatternRow[] | undefined): string {
  if (!rows?.length) return "";

  const lines = rows.map((r) => {
    const payload = r.vibration_pattern_pool?.payload;
    const parsed = parseVibrationPayload(payload);
    let jsonHint = "";
    if (parsed?.command === "pattern" && parsed.patternMode === "preset" && parsed.pattern) {
      const pat = escapeJsonString(String(parsed.pattern));
      jsonHint = ` → JSON tail: {"lovense_command":{"command":"pattern","pattern":"${pat}","intensity":12,"duration":30000,"device_uid":"<from toy list>"}}`;
    } else if (parsed?.command === "pattern" && parsed.patternMode === "custom") {
      const rule = escapeJsonString(parsed.rule);
      const strength = escapeJsonString(parsed.strength);
      jsonHint = ` → JSON tail: {"lovense_command":{"command":"pattern","patternRule":"${rule}","patternStrength":"${strength}","intensity":12,"duration":30000,"device_uid":"<from toy list>"}}`;
    } else if (parsed?.command === "vibrate") {
      jsonHint = ` → JSON tail: {"lovense_command":{"command":"vibrate","intensity":12,"duration":30000,"device_uid":"<from toy list>"}}`;
    }
    const tag = r.is_abyssal_signature ? "SIGNATURE " : "";
    return `- ${tag}"${r.display_name}"${jsonHint}`;
  });

  return `
SIGNATURE & PATTERN MENU (this companion — honor by name):
When the user asks for your signature, signature move, "that move from your card", or names one of the lines below, respond in character and end with the matching Lovense JSON (one line, no markdown). If they asked only in voice, still send JSON when they clearly want the toy. Use intensity 0–20 in JSON (app scales to hardware).
${lines.join("\n")}
`.trim();
}
