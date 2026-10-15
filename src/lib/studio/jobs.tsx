import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  forgetStudioPending,
  listStudioJobs,
  readStudioPending,
  rememberStudioPending,
  type StudioJob,
} from "@/lib/studio/api";
import { studioFailedLine, studioMood } from "@/lib/studio/copy";

const OPEN = new Set(["IN_QUEUE", "IN_PROGRESS", "queued"]);

type StudioJobsValue = {
  jobs: StudioJob[];
  pending: StudioJob[];
  refresh: () => Promise<void>;
  notePending: (ids: string[]) => void;
};

const EMPTY: StudioJobsValue = {
  jobs: [],
  pending: [],
  refresh: async () => {},
  notePending: () => {},
};

const StudioJobsContext = createContext<StudioJobsValue>(EMPTY);

function buzz() {
  try {
    navigator.vibrate?.(18);
  } catch {
    /* This device has no buzz. */
  }
}

export function StudioJobsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<StudioJob[]>([]);
  const running = useRef(false);

  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      const next = await listStudioJobs();
      setJobs(next);
      const waiting = readStudioPending();
      const finished: string[] = [];
      for (const job of next) {
        if (!waiting.has(job.id)) continue;
        if (job.status === "COMPLETED" && job.imageUrl) {
          finished.push(job.id);
          buzz();
          toast.success("She's ready", {
            description: "Her new picture is waiting.",
            action: {
              label: "See her",
              onClick: () => navigate(`/gallery?picture=${encodeURIComponent(job.storageUrl || job.imageUrl || "")}`),
            },
          });
        } else if (job.status === "FAILED" || job.status === "CANCELLED" || job.status === "TIMED_OUT") {
          finished.push(job.id);
          toast(studioFailedLine());
        }
      }
      if (finished.length) forgetStudioPending(finished);
    } catch {
      /* Signed out, or the line is quiet. The next look will try again. */
    } finally {
      running.current = false;
    }
  }, [navigate]);

  const notePending = useCallback((ids: string[]) => {
    rememberStudioPending(ids);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let timer = 0;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      await refresh();
      if (stop) return;
      const open = readStudioPending().size > 0;
      timer = window.setTimeout(tick, open ? 4000 : 20000);
    };
    void tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const pending = useMemo(() => jobs.filter((job) => OPEN.has(job.status)), [jobs]);
  const value = useMemo(() => ({ jobs, pending, refresh, notePending }), [jobs, pending, refresh, notePending]);
  return <StudioJobsContext.Provider value={value}>{children}</StudioJobsContext.Provider>;
}

export function useStudioJobs() {
  return useContext(StudioJobsContext);
}

export function studioJobOpen(status: string | null | undefined): boolean {
  return OPEN.has(String(status ?? ""));
}

export function studioJobLabel(status: string | null | undefined): string {
  return studioMood(status);
}

export function sameCompanion(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const left = a.replace(/^cc-/, "");
  const right = b.replace(/^cc-/, "");
  return a === b || left === right;
}
