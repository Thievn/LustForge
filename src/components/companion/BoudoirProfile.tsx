import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, ChevronDown, Expand, Lock, MessageCircle, Phone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BOND_TIERS, moodFor, tierForXp } from "@/lib/bond/logic";
import { deriveVoiceCopy, persistVoiceCopy, type VoiceSource } from "@/lib/companionVoiceCopy";
import type { Companion } from "@/data/companions";

type GalleryShot = { id: string; url: string };

type VaultItem = { id: string; name: string; imageUrl: string };

type Props = {
  companion: Companion;
  userId?: string | null;
  canEditVoice: boolean;
  portraitUrl: string | null;
  gallery: GalleryShot[];
  locked: boolean;
  onBack: () => void;
  onChat: () => void;
  onCall: () => void;
  onIncoming: () => void;
  acquire?: { label: string; onClick: () => void } | null;
  extras?: ReactNode;
};

function clip(text: string, max = 88): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

function lookRows(companion: Companion): { label: string; value: string }[] {
  const bits = (companion.appearance || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const skin = bits.find((s) => /skin|scale|tattoo|complexion|horn|tail|hair|eye/i.test(s));
  const rows: { label: string; value: string }[] = [];
  if (bits[0]) rows.push({ label: "Features", value: clip(bits[0], 96) });
  if (skin && skin !== bits[0]) rows.push({ label: "Skin", value: clip(skin, 96) });
  if (companion.role?.trim()) rows.push({ label: "Style", value: companion.role.trim() });
  if (companion.tagline?.trim()) rows.push({ label: "Signature", value: clip(companion.tagline, 72) });
  return rows;
}

export function BoudoirProfile({
  companion,
  userId,
  canEditVoice,
  portraitUrl,
  gallery,
  locked,
  onBack,
  onChat,
  onCall,
  onIncoming,
  acquire,
  extras,
}: Props) {
  const [params] = useSearchParams();
  const bondTo = `/companions/${companion.id}/bond${params.get("preview") === "1" ? "?preview=1" : ""}`;
  const source: VoiceSource = {
    name: companion.name,
    tagline: companion.tagline,
    bio: companion.bio,
    backstory: companion.backstory,
    personality: companion.personality,
    appearance: companion.appearance,
    role: companion.role,
  };
  const initial = deriveVoiceCopy(source, { teaser: companion.voiceTeaser, story: companion.voiceStory });
  const [teaser, setTeaser] = useState(initial.teaser);
  const [story, setStory] = useState(initial.story);
  const [bioOpen, setBioOpen] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>("story");
  const [editing, setEditing] = useState(false);
  const [draftTeaser, setDraftTeaser] = useState(initial.teaser);
  const [draftStory, setDraftStory] = useState(initial.story);
  const [saving, setSaving] = useState(false);
  const [lb, setLb] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [bondPct, setBondPct] = useState(8);
  const [bondLabel, setBondLabel] = useState("Level 1");
  const [vault, setVault] = useState<VaultItem[]>([]);

  const shots = useMemo(() => {
    const list: GalleryShot[] = [];
    if (portraitUrl) list.push({ id: "portrait", url: portraitUrl });
    for (const shot of gallery) {
      if (!shot.url || list.some((s) => s.url === shot.url)) continue;
      if (/\.mp4(\?|$)/i.test(shot.url)) continue;
      list.push(shot);
    }
    return list;
  }, [gallery, portraitUrl]);

  const mood = moodFor({ hour: new Date().getHours(), streak });
  const tags = [...companion.tags, companion.role, companion.gender].map((t) => t?.trim()).filter(Boolean);
  const uniqueTags = [...new Set(tags)].slice(0, 8);
  const chronicle = (companion.backstory || companion.bio || story || "").trim();

  useEffect(() => {
    const next = deriveVoiceCopy(source, { teaser: companion.voiceTeaser, story: companion.voiceStory });
    setTeaser(next.teaser);
    setStory(next.story);
    setDraftTeaser(next.teaser);
    setDraftStory(next.story);
    // Refresh when the companion row changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companion.id, companion.voiceTeaser, companion.voiceStory, companion.bio, companion.backstory]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: string) => {
              maybeSingle: () => Promise<{ data: { xp?: number | null; streak?: number | null } | null }>;
            };
            limit: (n: number) => Promise<{
              data: Array<{
                item_id: string;
                collectible_items:
                  | { name?: string | null; image_url?: string | null; thumb_url?: string | null }
                  | Array<{ name?: string | null; image_url?: string | null; thumb_url?: string | null }>
                  | null;
              }> | null;
            }>;
          };
        };
      };
    };
    void db
      .from("companion_bonds")
      .select("xp, streak")
      .eq("user_id", userId)
      .eq("companion_id", companion.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const xp = Number(data.xp ?? 0);
        const tier = tierForXp(xp);
        const next = BOND_TIERS.find((row) => row.xp > tier.xp);
        setStreak(Number(data.streak ?? 0));
        setBondLabel(tier.name || `Level ${tier.level}`);
        const span = Math.max(1, (next?.xp ?? tier.xp + 40) - tier.xp);
        setBondPct(Math.max(6, Math.min(100, Math.round(((xp - tier.xp) / span) * 100))));
      });
    void db
      .from("user_collectibles")
      .select("item_id, collectible_items(name, image_url, thumb_url)")
      .eq("user_id", userId)
      .limit(8)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const items: VaultItem[] = [];
        for (const row of data) {
          const raw = row.collectible_items;
          const item = Array.isArray(raw) ? raw[0] : raw;
          const imageUrl = item?.thumb_url || item?.image_url || "";
          if (!item?.name || !imageUrl) continue;
          items.push({ id: row.item_id, name: item.name, imageUrl });
        }
        setVault(items);
      });
    return () => {
      cancelled = true;
    };
  }, [companion.id, userId]);

  useEffect(() => {
    if (lb == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLb(null);
      if (e.key === "ArrowRight") setLb((i) => (i == null ? i : (i + 1) % shots.length));
      if (e.key === "ArrowLeft") setLb((i) => (i == null ? i : (i - 1 + shots.length) % shots.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb, shots.length]);

  const toggle = (id: string) => setOpenCard((cur) => (cur === id ? null : id));

  const saveVoice = async () => {
    setSaving(true);
    const table = companion.id.startsWith("cc-") ? "custom_characters" : "companions";
    const id = companion.id.startsWith("cc-") ? companion.id.slice(3) : companion.id;
    const copy = { teaser: draftTeaser.trim(), story: draftStory.trim() };
    const result = await persistVoiceCopy(table, id, copy);
    setSaving(false);
    if (!result.ok) return;
    setTeaser(copy.teaser);
    setStory(copy.story);
    setEditing(false);
  };

  const onTouch = useMemo(() => {
    let x = 0;
    return {
      start(e: React.TouchEvent) {
        x = e.changedTouches[0]?.clientX ?? 0;
      },
      end(e: React.TouchEvent) {
        const dx = (e.changedTouches[0]?.clientX ?? 0) - x;
        if (Math.abs(dx) < 40) return;
        setLb((i) => {
          if (i == null || shots.length < 2) return i;
          return dx < 0 ? (i + 1) % shots.length : (i - 1 + shots.length) % shots.length;
        });
      },
    };
  }, [shots.length]);

  return (
    <div className="lf-boudoir min-h-[100dvh]">
      <div className="pf">
        <section
          className="hero"
          aria-label={`${companion.name}'s portrait, tap to view full screen`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a,button")) return;
            if (shots[0]) setLb(0);
          }}
        >
          {portraitUrl ? (
            <img src={portraitUrl} alt={`${companion.name} portrait`} />
          ) : (
            <div className="grid h-full place-items-center font-[Cinzel_Decorative,serif] text-6xl text-white/80">
              {companion.name.charAt(0)}
            </div>
          )}
          <div className="pf-float">
            <button type="button" className="ib2" aria-label="Back" onClick={onBack}>
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <Link className="wordmark" to="/">Lust<b>Forge</b></Link>
            <Link className="ib2" to={userId ? "/calls" : "/auth"} aria-label="Calls">
              <Bell className="i" />
            </Link>
          </div>
          <span className="fs-hint">
            <Expand className="i s" />
            Tap to view full screen
          </span>
          <div className="over">
            <span className="mood-line">
              <i className="glow-dot" />
              Online · feeling {mood}
            </span>
            <h1>{companion.name}</h1>
            <p className="tag">{companion.tagline}</p>
          </div>
        </section>

        <main className="pf-body">
          <div className="cta">
            <button type="button" className="btn" onClick={onChat} disabled={locked && !acquire}>
              <MessageCircle className="i s" /> Chat
            </button>
            <button type="button" className="btn glass" onClick={onCall}>
              <Phone className="i s" /> Call
            </button>
            <button type="button" className="btn glass" onClick={onIncoming}>
              <Bell className="i s" /> Incoming
            </button>
          </div>
          <Link className="bond-jump" to={bondTo}>Bond</Link>
          {acquire ? (
            <button type="button" className="btn" style={{ width: "100%", marginBottom: 16 }} onClick={acquire.onClick}>
              {acquire.label}
            </button>
          ) : null}

          <div className={`bio${bioOpen ? " open" : ""}`} id="bio">
            <p>{teaser}</p>
            <div className="more">
              <p>{story}</p>
            </div>
            <button
              type="button"
              className="link"
              aria-expanded={bioOpen}
              onClick={() => setBioOpen((v) => !v)}
            >
              {bioOpen ? "Show less" : "Read more"}
            </button>
            {canEditVoice ? (
              editing ? (
                <div className="editbox">
                  <textarea value={draftTeaser} maxLength={180} rows={3} aria-label="Short introduction" onChange={(e) => setDraftTeaser(e.target.value)} />
                  <textarea value={draftStory} rows={5} aria-label="Her story in her voice" onChange={(e) => setDraftStory(e.target.value)} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn" disabled={saving || !draftTeaser.trim() || !draftStory.trim()} onClick={() => void saveVoice()}>
                      {saving ? "Saving…" : "Save her words"}
                    </button>
                    <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="link" onClick={() => setEditing(true)}>Edit her words</button>
              )
            ) : null}
          </div>

          <div className="tags">
            {uniqueTags.map((tag) => (
              <span className="chip" key={tag}>{tag}</span>
            ))}
          </div>

          <Accordion id="story" title="Her story" open={openCard === "story"} onToggle={toggle}>
            <p>{chronicle}</p>
          </Accordion>

          <Accordion id="looks" title="Looks & Vault items" open={openCard === "looks"} onToggle={toggle}>
            <div className="rows">
              {lookRows(companion).map((row) => (
                <div className="r" key={row.label}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
            {vault.length > 0 ? (
              <div className="vitems">
                {vault.map((item) => (
                  <figure key={item.id}>
                    <img src={item.imageUrl} alt="" />
                    <span>{item.name}</span>
                  </figure>
                ))}
              </div>
            ) : null}
          </Accordion>

          <Accordion id="gallery" title="Gallery" open={openCard === "gallery"} onToggle={toggle}>
            <div className="gal">
              {shots.slice(0, 6).map((shot, index) => (
                <button type="button" key={shot.id} onClick={() => setLb(index)}>
                  <img src={shot.url} alt="" />
                </button>
              ))}
              {shots.length < 3
                ? Array.from({ length: 3 - Math.min(shots.length, 3) }).map((_, i) => (
                    <div className="locked" key={`lock-${i}`}>
                      <span><Lock className="i s" /> Chat to unlock</span>
                    </div>
                  ))
                : null}
            </div>
          </Accordion>

          <Accordion id="rel" title="Relationship" open={openCard === "rel"} onToggle={toggle}>
            <div className="relg">
              <div className="box">
                <b>{streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "New"}</b>
                <span>{streak > 0 ? "Streak — keep it going" : "Streak starts when you talk"}</span>
              </div>
              <div className="box">
                <b style={{ textTransform: "capitalize" }}>{mood}</b>
                <span>Her mood tonight</span>
              </div>
            </div>
            <div className="bond" role="img" aria-label={`Bond ${bondPct} percent`}>
              <i style={{ width: `${bondPct}%` }} />
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Bond · {bondLabel}</p>
          </Accordion>

          {extras}
        </main>
      </div>

      <div
        className={`lb${lb != null ? " on" : ""}`}
        onClick={() => setLb(null)}
        onTouchStart={onTouch.start}
        onTouchEnd={onTouch.end}
      >
        <button type="button" className="ib2 x" aria-label="Close" onClick={() => setLb(null)}>
          <X className="i" />
        </button>
        {lb != null && shots[lb] ? <img src={shots[lb].url} alt="" /> : null}
      </div>
    </div>
  );
}

function Accordion({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={`acc${open ? " open" : ""}`}>
      <button type="button" aria-expanded={open} onClick={() => onToggle(id)}>
        {title}
        <ChevronDown className="i" />
      </button>
      <div className="pn">
        <div>
          <div className="in">{children}</div>
        </div>
      </div>
    </div>
  );
}
