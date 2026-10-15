import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneEmpty, PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import { fetchRosterCompanionById, usePhoneRoster, type RosterCompanion } from "@/lib/phone/usePhoneRoster";

type PreviewRow = { companionId: string; content: string; at: string };

export default function MessagesList() {
  const preview = usePhonePreview();
  const { companions, user, loading } = usePhoneRoster(preview);
  const [previews, setPreviews] = useState<Record<string, PreviewRow>>({});
  const [threadOnly, setThreadOnly] = useState<RosterCompanion[]>([]);

  useEffect(() => {
    if (preview || !user) return;
    let cancelled = false;
    void supabase
      .from("chat_messages")
      .select("companion_id, content, created_at, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next: Record<string, PreviewRow> = {};
        for (const row of data) {
          if (next[row.companion_id]) continue;
          next[row.companion_id] = {
            companionId: row.companion_id,
            content: row.content,
            at: row.created_at,
          };
        }
        setPreviews(next);
      });
    return () => {
      cancelled = true;
    };
  }, [preview, user]);

  useEffect(() => {
    const known = new Set(companions.map((item) => item.id));
    const missing = Object.keys(previews).filter((id) => !known.has(id));
    if (missing.length === 0) {
      setThreadOnly([]);
      return;
    }
    let cancelled = false;
    void Promise.all(missing.map((id) => fetchRosterCompanionById(id))).then((rows) => {
      if (cancelled) return;
      setThreadOnly(rows.filter((row): row is RosterCompanion => row != null));
    });
    return () => {
      cancelled = true;
    };
  }, [previews, companions]);

  const inbox = useMemo(() => {
    const seen = new Set(companions.map((item) => item.id));
    return [...companions, ...threadOnly.filter((item) => !seen.has(item.id))];
  }, [companions, threadOnly]);

  const q = preview ? "?preview=1" : "";

  return (
    <PhoneStage layout="app">
      <header className="flex items-center gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={`/dashboard${q}`} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-primary" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-gothic text-2xl text-foreground">Messages</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-3 pb-[max(6rem,env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : inbox.length === 0 ? (
          <PhoneEmpty title="Quiet inbox" body="When a companion is on your home screen, her thread lives here." />
        ) : (
          <ul className="space-y-2">
            {inbox.map((companion) => {
              const last = preview
                ? { content: companion.tagline, at: new Date().toISOString() }
                : previews[companion.id];
              return (
                <li key={companion.id}>
                  <Link
                    to={`/messages/${companion.id}${q}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-3 py-3 transition hover:border-primary/35 active:scale-[0.99]"
                  >
                    {companion.portraitUrl ? (
                      <img src={companion.portraitUrl} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
                    ) : (
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-gothic text-white"
                        style={{ background: `linear-gradient(135deg, ${companion.gradientFrom}, ${companion.gradientTo})` }}
                      >
                        {companion.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-semibold text-foreground">{companion.name}</p>
                        <time className="shrink-0 text-[10px] text-muted-foreground">
                          {last ? formatShort(last.at) : ""}
                        </time>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{last?.content || companion.tagline || "Say hello"}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PhoneStage>
  );
}

function formatShort(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
