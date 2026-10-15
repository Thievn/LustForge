import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Phone, Sparkles, Users } from "lucide-react";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { fetchRosterCompanionById, usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { ComingSoon } from "@/components/shell/ComingSoon";
import { subscribeCurrentDeviceToWebPush } from "@/lib/webPushUserRegistration";
import { supabase } from "@/integrations/supabase/client";
import { moodFor } from "@/lib/bond/logic";

type Missed = { id: string; name: string; text: string; at: string; portrait?: string | null };
type Pic = { id: string; url: string; name: string };

function presence(at: string | null) {
  if (!at) return "last seen earlier";
  const age = Date.now() - new Date(at).getTime();
  if (age < 90_000) return "typing";
  if (age < 15 * 60_000) return "online";
  const mins = Math.round(age / 60_000);
  if (mins < 60) return `last seen ${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours < 36 ? `last seen ${hours}h ago` : "last seen earlier";
}

export default function HomeDashboard() {
  const preview = usePhonePreview();
  const { companions, limits, user, loading } = usePhoneRoster(preview);
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});
  const [missed, setMissed] = useState<Missed[]>([]);
  const [pics, setPics] = useState<Pic[]>([]);
  const [pushNote, setPushNote] = useState<string | null>(null);
  const q = preview ? "?preview=1" : "";
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (preview || !user) return;
    let cancelled = false;
    void supabase
      .from("chat_messages")
      .select("id, companion_id, content, created_at, role, image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(240)
      .then(async ({ data }) => {
        if (cancelled || !data) return;
        const known = new Map(companions.map((item) => [item.id, item]));
        const missing = new Set<string>();
        for (const row of data) {
          if (row.companion_id && !known.has(row.companion_id)) missing.add(row.companion_id);
        }
        if (missing.size > 0) {
          const extras = await Promise.all([...missing].map((id) => fetchRosterCompanionById(id)));
          if (cancelled) return;
          for (const extra of extras) {
            if (extra) known.set(extra.id, extra);
          }
        }
        const seen: Record<string, string> = {};
        const missedRows: Missed[] = [];
        const picRows: Pic[] = [];
        const answered = new Set<string>();
        for (const row of data) {
          if (!seen[row.companion_id] && row.role === "assistant") seen[row.companion_id] = row.created_at;
          if (row.role === "user") answered.add(row.companion_id);
          if (row.role === "assistant" && !answered.has(row.companion_id) && missedRows.length < 4 && !missedRows.some((item) => item.id === row.companion_id)) {
            const companion = known.get(row.companion_id);
            missedRows.push({
              id: row.companion_id,
              name: companion?.name ?? "Her",
              text: row.content || "She sent something.",
              at: row.created_at,
              portrait: companion?.portraitUrl,
            });
          }
          if (row.image_url && picRows.length < 6) {
            const companion = known.get(row.companion_id);
            picRows.push({ id: row.id, url: row.image_url, name: companion?.name ?? "Her" });
          }
        }
        setLastSeen(seen);
        setMissed(missedRows);
        setPics(picRows);
      });
    return () => {
      cancelled = true;
    };
  }, [preview, user, companions]);

  async function enablePush() {
    const result = await subscribeCurrentDeviceToWebPush();
    if (!result.ok) {
      setPushNote("error" in result ? result.error : "Notifications did not turn on.");
      return;
    }
    if (user) {
      await (supabase as unknown as { from: (t: string) => { upsert: (v: Record<string, unknown>) => Promise<unknown> } })
        .from("notification_prefs")
        .upsert({ user_id: user.id, push_opt_in: true, messages: true, moments: true, calls: true });
    }
    setPushNote("She can reach you when the app is closed.");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-28 lg:px-8 lg:pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary">{hello}</p>
          <h1 className="font-gothic text-4xl">{limits.displayName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {limits.catalogOwner ? "Unlimited. Stay as long as you like." : `${limits.credits} credits · ${limits.textsLeft} texts left today`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/create-companion${q}`} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Users className="h-4 w-4" /> New companion</Link>
          <Link to={`/lab${q}`} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border px-4 text-sm"><Sparkles className="h-4 w-4 text-primary" /> Create pic</Link>
          <Link to={`/lab?tab=edit${preview ? "&preview=1" : ""}`} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border px-4 text-sm"><ImagePlus className="h-4 w-4 text-primary" /> Edit pic</Link>
        </div>
      </header>

      <section>
        <h2 className="mb-3 font-gothic text-2xl">With you</h2>
        {loading ? <p className="text-sm text-muted-foreground">Looking for her…</p> : null}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {companions.map((companion) => (
            <Link key={companion.id} to={`/companions/${companion.id}/bond${q}`} className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-card/80 p-3">
              {companion.portraitUrl ? (
                <img src={companion.portraitUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/20 font-gothic text-2xl">{companion.name.slice(0, 1)}</span>
              )}
              <span>
                <span className="block font-medium">{companion.name}</span>
                <span className="block text-xs text-primary">{presence(lastSeen[companion.id] ?? null)}</span>
                <span className="block text-xs text-muted-foreground">{moodFor({ hour, streak: 0 })}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-primary/25 bg-card/70 p-4">
        <h2 className="font-gothic text-2xl">Missed from her</h2>
        {missed.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing waiting. She will notice when you do.</p> : null}
        <ul className="mt-3 space-y-3">
          {missed.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/messages/${item.id}${q}`} className="h-10 rounded-xl bg-primary px-3 text-sm leading-10 text-primary-foreground">Reply</Link>
                <Link to={`/live-call/${item.id}`} className="inline-flex h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm"><Phone className="h-4 w-4" /> Call back</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-gothic text-2xl">Recent pics</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {pics.length === 0 ? <p className="text-sm text-muted-foreground">No pictures yet.</p> : null}
          {pics.map((pic) => (
            <img key={pic.id} src={pic.url} alt={pic.name} className="h-40 w-28 shrink-0 rounded-2xl object-cover" />
          ))}
        </div>
      </section>

      <button type="button" onClick={() => void enablePush()} className="h-11 rounded-2xl border border-primary/40 text-sm text-primary">
        Let her text you when you are away
      </button>
      {pushNote ? <p className="text-sm text-muted-foreground" role="status">{pushNote}</p> : null}
      <ComingSoon />
    </div>
  );
}
