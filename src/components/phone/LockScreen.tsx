import { motion } from "framer-motion";
import { CompanionAvatar } from "@/components/phone/CompanionAvatar";

export function LockScreen({
  name,
  from,
  to,
  src,
  message,
  timeLabel,
  onOpen,
  onUnlock,
}: {
  name: string;
  from: string;
  to: string;
  src?: string | null;
  message: string;
  timeLabel: string;
  onOpen: () => void;
  onUnlock: () => void;
}) {
  const now = new Date();
  const clock = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -24 }}
      className="absolute inset-0 z-30 flex flex-col bg-background/55 px-6 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] text-left backdrop-blur-xl"
    >
      <p className="text-center text-sm text-white/80">{date}</p>
      <p className="mt-1 text-center font-gothic text-6xl text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">{clock}</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-10 rounded-[1.4rem] border border-white/25 bg-white/15 p-4 text-left text-white shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <CompanionAvatar name={name} from={from} to={to} src={src} size="sm" presence="typing" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-semibold">{name}</p>
              <time className="text-[11px] text-white/75">{timeLabel}</time>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/90">{message}</p>
          </div>
        </div>
      </button>
      <button type="button" onClick={onUnlock} className="mt-auto text-center text-xs uppercase tracking-[0.22em] text-white/80">
        Unlock home
      </button>
    </motion.div>
  );
}
