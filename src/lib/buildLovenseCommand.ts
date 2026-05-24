import type { LovenseCommand } from "@/lib/lovense";
import { payloadToLovenseCommand } from "@/lib/vibrationPatternPayload";

export function readIntensityCapPercent(): number {
  try {
    const v = parseInt(localStorage.getItem("lustforge-intensity") || "100", 10);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 100;
  } catch {
    return 100;
  }
}

/** AI prompts use 0–20; DB payloads use 0–100. Scale then apply user cap. */
export function scaleToyIntensity(raw: number, capPercent: number): number {
  let v = Number(raw);
  if (!Number.isFinite(v)) v = 50;
  if (v <= 20) v = v * 5;
  const cap = Number.isFinite(capPercent) ? Math.min(100, Math.max(0, capPercent)) : 100;
  return Math.min(100, Math.max(0, Math.round(v * (cap / 100))));
}

export type BuildLovenseCommandInput = {
  source: "db_payload" | "ai_json" | "direct";
  raw: unknown;
  deviceUid: string;
  intensityCapPercent?: number;
};

/**
 * Single builder for UI pattern clicks, AI lovense_command JSON, and Live Call presets.
 */
export function buildLovenseCommand(input: BuildLovenseCommandInput): LovenseCommand | null {
  const uid = input.deviceUid?.trim();
  if (!uid) return null;

  const cap = input.intensityCapPercent ?? readIntensityCapPercent();

  if (input.source === "db_payload") {
    const cmd = payloadToLovenseCommand(input.raw);
    if (!cmd) return null;
    return {
      ...cmd,
      intensity: scaleToyIntensity(cmd.intensity, cap),
      toyId: uid,
    };
  }

  if (input.source === "direct") {
    const cmd = input.raw as LovenseCommand;
    if (!cmd || typeof cmd !== "object" || !cmd.command) return null;
    return {
      ...cmd,
      intensity: scaleToyIntensity(cmd.intensity ?? 50, cap),
      toyId: uid,
    };
  }

  if (!input.raw || typeof input.raw !== "object") return null;
  const c = input.raw as Record<string, unknown>;
  const baseCmd = String(c.command || "vibrate").toLowerCase();

  if (baseCmd === "stop") {
    return { command: "stop", intensity: 0, duration: 0, toyId: uid };
  }

  const intensity = scaleToyIntensity(Number(c.intensity ?? 50), cap);
  const duration =
    typeof c.duration === "number" && Number.isFinite(c.duration)
      ? c.duration
      : Number(c.duration ?? 5000);

  if (baseCmd === "pattern") {
    const rule =
      (typeof c.patternRule === "string" && c.patternRule.trim()) ||
      (typeof c.rule === "string" && c.rule.trim()) ||
      "";
    const strength =
      (typeof c.patternStrength === "string" && c.patternStrength.trim()) ||
      (typeof c.strength === "string" && c.strength.trim()) ||
      "";
    const pattern = typeof c.pattern === "string" ? c.pattern.trim() : "";

    if (rule && strength) {
      return {
        command: "pattern",
        patternSubtype: "custom",
        patternRule: rule,
        patternStrength: strength,
        intensity,
        duration,
        toyId: uid,
      };
    }
    if (pattern) {
      return {
        command: "pattern",
        patternSubtype: "preset",
        pattern,
        intensity,
        duration,
        toyId: uid,
      };
    }
  }

  if (baseCmd === "thrust" || baseCmd === "rotate") {
    return {
      command: baseCmd,
      intensity,
      duration,
      toyId: uid,
    };
  }

  return {
    command: "vibrate",
    intensity,
    duration,
    toyId: uid,
  };
}
