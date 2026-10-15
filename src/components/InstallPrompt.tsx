import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { trackPwaGaAndDb } from "@/lib/pwaTelemetry";
import {
  getDeferredInstallPrompt,
  installDismissed,
  isIosLike,
  isStandalonePwa,
  rememberInstallDismissed,
  runInstallPrompt,
  subscribeInstallPrompt,
} from "@/lib/pwaInstall";

export default function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [ios, setIos] = useState(false);
  const loggedShownRef = useRef(false);

  useEffect(() => {
    setIos(isIosLike());
    setReady(Boolean(getDeferredInstallPrompt()));
    if (isStandalonePwa()) return;
    return subscribeInstallPrompt((event) => {
      const canInstall = Boolean(event);
      setReady(canInstall);
      if (canInstall && !installDismissed()) setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (isStandalonePwa() || installDismissed() || !isIosLike()) return;
    const timer = window.setTimeout(() => setOpen(true), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onHint = () => {
      if (isStandalonePwa()) return;
      setOpen(true);
    };
    window.addEventListener("lustforge-request-install-hint", onHint);
    return () => window.removeEventListener("lustforge-request-install-hint", onHint);
  }, []);

  useEffect(() => {
    if (!open || loggedShownRef.current) return;
    loggedShownRef.current = true;
    trackPwaGaAndDb("install_prompt_shown");
  }, [open]);

  const dismiss = useCallback(() => {
    trackPwaGaAndDb("install_prompt_dismiss");
    rememberInstallDismissed();
    setOpen(false);
  }, []);

  const install = async () => {
    const outcome = await runInstallPrompt();
    if (outcome === "accepted") {
      trackPwaGaAndDb("install_prompt_accept");
      setReady(false);
      setOpen(false);
      return;
    }
    if (outcome === "dismissed") setOpen(false);
  };

  if (typeof window !== "undefined" && isStandalonePwa()) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[95] flex justify-center px-3 pt-2 pointer-events-none"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div
            className="pointer-events-auto w-full max-w-md rounded-t-3xl border border-[#D6336C]/40 bg-[#1B1620]/[0.97] px-4 pb-4 pt-3 shadow-[0_-8px_48px_rgba(214,51,108,0.35)] backdrop-blur-xl sm:rounded-3xl sm:border sm:shadow-[0_0_48px_rgba(214,51,108,0.28)]"
            role="dialog"
            aria-labelledby="lf-install-title"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#3A1C32] to-[#1B1620]">
                  <Download className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div className="min-w-0">
                  <p id="lf-install-title" className="font-gothic text-base tracking-wide text-white">
                    Install LustForge
                  </p>
                  <p className="text-[11px] leading-snug text-white/70">
                    Keep her close. One tap from your home screen.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="shrink-0 rounded-lg p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Not now"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {ready ? (
              <button
                type="button"
                onClick={() => void install()}
                className="w-full rounded-xl bg-gradient-to-r from-[#D6336C] to-[#8E2348] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#D6336C]/25 transition-transform active:scale-[0.98]"
              >
                Install LustForge
              </button>
            ) : ios ? (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-white/70">
                <Share className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                <span>
                  Tap <strong className="text-white">Share</strong>, then{" "}
                  <strong className="text-white">Add to Home Screen</strong>.
                </span>
              </p>
            ) : (
              <p className="text-xs leading-relaxed text-white/70">
                Open your browser menu and choose <strong className="text-white">Install LustForge</strong>.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
