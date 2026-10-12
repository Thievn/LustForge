import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Images, MessageCircle, Phone, Settings, Sparkles, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PhoneEmpty, PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { PHONE_SKINS, readPhoneSkin, writePhoneSkin, type PhoneSkinId } from "@/lib/phone/skin";
import { cn } from "@/lib/utils";

const ICONS = [
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/lab", label: "Lab", icon: Sparkles },
  { to: "/gallery", label: "Gallery", icon: Images },
  { to: "/calls", label: "Calls", icon: Phone },
  { to: "/plans", label: "Plans", icon: Wallet },
] as const;

function withPreview(path: string, preview: boolean) {
  return preview ? `${path}?preview=1` : path;
}

export default function PhoneHome() {
  const preview = usePhonePreview();
  const { companions, limits, loading } = usePhoneRoster(preview);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skin, setSkin] = useState<PhoneSkinId>(() => readPhoneSkin());
  const featured = companions[0];
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <PhoneStage>
      <header className="flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">LustForge</p>
          <h1 className="font-gothic text-3xl leading-none text-foreground">{hello}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{limits.displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/80 text-foreground shadow-sm transition hover:border-primary/40"
            aria-label="Phone settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-[max(6.5rem,env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="space-y-3 pt-4">
            <div className="h-28 animate-pulse rounded-[1.4rem] bg-card" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-card" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {featured ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Link
                  to={withPreview(`/messages/${featured.id}`, preview)}
                  className="block rounded-[1.4rem] border border-primary/30 bg-card/90 p-4 shadow-[0_18px_44px_hsl(var(--primary)/0.12)] transition hover:-translate-y-0.5"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Latest</p>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar name={featured.name} from={featured.gradientFrom} to={featured.gradientTo} src={featured.portraitUrl} />
                    <div className="min-w-0">
                      <p className="truncate font-gothic text-xl text-foreground">{featured.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{featured.tagline || "Open the thread"}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <PhoneEmpty
                title="No one here yet"
                body="The Lab forges your first companion. She shows up on this screen when she is ready."
                action={
                  <Link to={withPreview("/lab", preview)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                    Open the Lab
                  </Link>
                }
              />
            )}

            <div className="grid grid-cols-4 gap-3">
              {ICONS.map((item, index) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <Link
                    to={withPreview(item.to, preview)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/80 px-2 py-3 text-center transition hover:border-primary/40 hover:shadow-[0_10px_30px_hsl(var(--primary)/0.12)] active:scale-[0.98]"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <section>
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Companions</h2>
                <span className="text-[11px] text-muted-foreground">{companions.length}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {companions.map((companion) => (
                  <Link key={companion.id} to={withPreview(`/messages/${companion.id}`, preview)} className="w-16 shrink-0 text-center">
                    <Avatar name={companion.name} from={companion.gradientFrom} to={companion.gradientTo} src={companion.portraitUrl} />
                    <p className="mt-1 truncate text-[11px] text-foreground">{companion.name}</p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {settingsOpen ? (
        <div className="absolute inset-0 z-20 bg-black/40" onClick={() => setSettingsOpen(false)}>
          <div
            className="absolute inset-x-3 bottom-3 rounded-[1.4rem] border border-border bg-card p-4 text-left shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-gothic text-lg text-foreground">Thread skin</p>
            <p className="mt-1 text-xs text-muted-foreground">LustForge is the default. The others only change the chat bubbles.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PHONE_SKINS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSkin(option.id);
                    writePhoneSkin(option.id);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm",
                    skin === option.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Link to="/settings" className="mt-3 block text-sm font-semibold text-primary">
              Account settings
            </Link>
            <Link to="/vault" className="mt-2 block text-sm text-muted-foreground">
              Classic vault
            </Link>
          </div>
        </div>
      ) : null}
    </PhoneStage>
  );
}

function Avatar({ name, from, to, src }: { name: string; from: string; to: string; src?: string | null }) {
  if (src) {
    return <img src={src} alt="" className="mx-auto h-14 w-14 rounded-2xl object-cover shadow-[0_8px_24px_hsl(var(--primary)/0.25)]" />;
  }
  return (
    <div
      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl font-gothic text-lg text-white shadow-[0_8px_24px_hsl(var(--primary)/0.25)]"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {name.slice(0, 1)}
    </div>
  );
}
