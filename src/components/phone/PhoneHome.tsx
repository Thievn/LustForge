import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppIconTile } from "@/components/phone/AppIcon";
import { CompanionAvatar } from "@/components/phone/CompanionAvatar";
import { HomeWallpaper } from "@/components/phone/HomeWallpaper";
import { LockScreen } from "@/components/phone/LockScreen";
import { PhoneEmpty, PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { PREVIEW_THREAD } from "@/lib/phone/previewData";
import { PHONE_SKINS, readPhoneSkin, writePhoneSkin, type PhoneSkinId } from "@/lib/phone/skin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ICONS = [
  { to: "/messages", label: "Messages", name: "messages" },
  { to: "/lab", label: "Studio", name: "lab" },
  { to: "/gallery", label: "Gallery", name: "gallery" },
  { to: "/calls", label: "Calls", name: "calls" },
  { to: "/plans", label: "Plans", name: "plans" },
  { to: "/settings", label: "Settings", name: "settings" },
  { to: "/toys", label: "Toys", name: "toys" },
] as const;

function withPreview(path: string, preview: boolean) {
  return preview ? `${path}?preview=1` : path;
}

export default function PhoneHome() {
  const preview = usePhonePreview();
  const navigate = useNavigate();
  const { companions, limits, loading, user } = usePhoneRoster(preview);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skin, setSkin] = useState<PhoneSkinId>(() => readPhoneSkin());
  const [locked, setLocked] = useState(() => sessionStorage.getItem("lf-phone-unlocked") !== "1");
  const [note, setNote] = useState<{ text: string; time: string } | null>(
    preview ? { text: PREVIEW_THREAD[PREVIEW_THREAD.length - 1]?.content ?? "Open me.", time: "now" } : null,
  );
  const featured = companions[0];
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (preview || !user || !featured) return;
    let cancelled = false;
    void supabase
      .from("chat_messages")
      .select("content, created_at")
      .eq("user_id", user.id)
      .eq("companion_id", featured.id)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (cancelled || !data?.[0]) return;
        const row = data[0];
        setNote({
          text: row.content || "Sent a photo.",
          time: new Date(row.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [preview, user, featured]);

  function markUnlocked() {
    sessionStorage.setItem("lf-phone-unlocked", "1");
    setLocked(false);
  }

  function unlockToChat() {
    markUnlocked();
    if (featured) navigate(withPreview(`/messages/${featured.id}`, preview));
  }

  return (
    <PhoneStage>
      <HomeWallpaper image={featured?.portraitUrl} video={featured?.loopVideoUrl} />
      <header className="relative z-10 flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">LustForge</p>
          <h1 className="font-gothic text-3xl leading-none text-foreground">{hello}</h1>
          <p className="mt-1 text-sm text-white/80 drop-shadow-sm">{limits.displayName}</p>
        </div>
      </header>

      <div className="relative z-10 flex-1 space-y-5 overflow-y-auto px-4 pb-[max(6.5rem,env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="space-y-3 pt-4">
            <div className="h-28 animate-pulse rounded-[1.6rem] bg-white/10" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="mx-auto h-16 w-16 animate-pulse rounded-[1.15rem] bg-white/10" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {featured ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}>
                <Link
                  to={withPreview(`/messages/${featured.id}`, preview)}
                  className="block rounded-[1.6rem] border border-white/25 bg-white/10 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl transition active:scale-[0.99]"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-primary">She is online</p>
                  <div className="mt-3 flex items-center gap-3">
                    <CompanionAvatar
                      name={featured.name}
                      from={featured.gradientFrom}
                      to={featured.gradientTo}
                      src={featured.portraitUrl}
                      presence="typing"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-gothic text-xl text-foreground">{featured.name}</p>
                      <p className="truncate text-sm text-foreground/75">{featured.tagline || "Open the thread"}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <PhoneEmpty title="Your phone is empty" body="Create a companion in Studio. She will land on this screen." />
            )}

            <div className="grid grid-cols-4 gap-y-5">
              {ICONS.map((item, index) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  {item.name === "settings" ? (
                    <button type="button" onClick={() => setSettingsOpen(true)} className="w-full active:scale-95">
                      <AppIconTile name={item.name} label={item.label} />
                    </button>
                  ) : (
                    <Link to={withPreview(item.to, preview)} className="block active:scale-95">
                      <AppIconTile name={item.name} label={item.label} />
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-3 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-foreground/70">
                <span>{limits.plan} plan</span>
                <span>{limits.credits} credits</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {companions.map((companion) => (
                  <Link key={companion.id} to={withPreview(`/messages/${companion.id}`, preview)} className="w-16 shrink-0 text-center">
                    <CompanionAvatar
                      name={companion.name}
                      from={companion.gradientFrom}
                      to={companion.gradientTo}
                      src={companion.portraitUrl}
                      size="sm"
                      presence={companion.id === featured?.id ? "online" : "idle"}
                    />
                    <p className="mt-2 truncate text-[11px] text-foreground">{companion.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {locked && featured && !loading ? (
          <LockScreen
            name={featured.name}
            from={featured.gradientFrom}
            to={featured.gradientTo}
            src={featured.portraitUrl}
            message={note?.text || featured.tagline || "Thinking of you."}
            timeLabel={note?.time || "now"}
            onOpen={unlockToChat}
            onUnlock={markUnlocked}
          />
        ) : null}
      </AnimatePresence>

      {settingsOpen ? (
        <div className="absolute inset-0 z-40 flex items-end bg-black/45" onClick={() => setSettingsOpen(false)}>
          <div
            className="w-full rounded-t-[1.6rem] border border-border bg-card/95 p-5 backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-gothic text-2xl text-foreground">Phone</p>
            <p className="mt-1 text-sm text-foreground/70">LustForge is the default look. The other skins only change the chat frame.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {PHONE_SKINS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    writePhoneSkin(item.id);
                    setSkin(item.id);
                  }}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left text-sm",
                    skin === item.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground/80",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Link to="/account" className="mt-4 block text-sm text-primary" onClick={() => setSettingsOpen(false)}>
              Account and credits
            </Link>
          </div>
        </div>
      ) : null}
    </PhoneStage>
  );
}
