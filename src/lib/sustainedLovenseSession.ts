import { sendCommand, type LovenseCommand } from "@/lib/lovense";

/** Matches `send-device-command` clamp: Lovense `timeSec` max 30. */
export const LOVENSE_MAX_SEGMENT_MS = 30_000;

/** Re-fire before the hardware segment ends so sensation stays continuous. */
const REFRESH_INTERVAL_MS = 25_000;

export type SustainedLovenseSessionOptions = {
  /** Called when a refresh tick fails (not the initial send). Session auto-stops. */
  onRefreshError?: (err: Error) => void;
};

function segmentCommand(cmd: LovenseCommand): LovenseCommand {
  return {
    ...cmd,
    duration: LOVENSE_MAX_SEGMENT_MS,
  };
}

/**
 * Keeps a vibrate/pattern command active by re-sending until `stop()` (safe word, emergency, or user toggle).
 * The Lovense API caps a single segment at 30s; this bridges longer sessions.
 * Awaits the first send so callers can surface errors before showing "On" UI state.
 */
export async function createSustainedLovenseSession(
  userId: string,
  command: LovenseCommand,
  opts?: SustainedLovenseSessionOptions,
): Promise<{ stop: () => Promise<void> }> {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  const stopInternal = async () => {
    if (stopped) return;
    stopped = true;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    try {
      await sendCommand(userId, {
        command: "stop",
        intensity: 0,
        duration: 0,
        toyId: command.toyId,
      });
    } catch {
      /* still clear local state */
    }
  };

  const sendSegment = async (isFirst: boolean) => {
    try {
      await sendCommand(userId, segmentCommand(command));
    } catch (err) {
      if (isFirst) throw err;
      opts?.onRefreshError?.(err instanceof Error ? err : new Error(String(err)));
      await stopInternal();
    }
  };

  await sendSegment(true);
  intervalId = setInterval(() => {
    void sendSegment(false);
  }, REFRESH_INTERVAL_MS);

  return {
    stop: stopInternal,
  };
}
