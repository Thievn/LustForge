import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Phone, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { DATE_SCENES, searchScenes } from "@/lib/bond/scenes";
import { STORYLINES, searchStorylines } from "@/lib/bond/storylines";
import { awardMessageXp, applyStoryChoice, dailyLine, moodFor, nextStreak, tierForXp } from "@/lib/bond/logic";
import { invokeWebPushSend } from "@/lib/invokeWebPushSend";
import { studioGenerate } from "@/lib/studio/api";
import { renderPosePngForId } from "@/lib/studio/poses";
import { StyleHer } from "@/components/vault/StyleHer";

type Memory = { id: string; body: string; feeling: string };
type Outfit = { id: string; name: string; neutral: string; active: boolean };
type Post = { id: string; caption: string; image_url: string | null };

const TABS = ["Her", "Memory", "Stories", "Dates", "Style Her", "Phone"] as const;

function loose() {
  return supabase as unknown as {
    from: (table: string) => {
      select: (cols?: string) => LooseQuery;
      insert: (value: Record<string, unknown> | Record<string, unknown>[]) => Promise<{ error: { message: string } | null }>;
      update: (value: Record<string, unknown>) => LooseFilter;
      delete: () => LooseFilter;
      upsert: (value: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    functions: typeof supabase.functions;
  };
}

type LooseQuery = {
  eq: (col: string, val: string) => LooseQuery;
  order: (col: string, opts?: { ascending: boolean }) => LooseQuery;
  limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null }>;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>;
};

type LooseFilter = {
  eq: (col: string, val: string) => LooseFilter;
  then: Promise<{ error: { message: string } | null }>["then"];
};

export default function CompanionBond() {
  const { id = "" } = useParams();
  const preview = usePhonePreview();
  const navigate = useNavigate();
  const { companions, user } = usePhoneRoster(preview);
  const companion = companions.find((item) => item.id === id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Her");
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryBody, setMemoryBody] = useState("");
  const [memoryFeel, setMemoryFeel] = useState("");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pics, setPics] = useState<string[]>([]);
  const [storyQuery, setStoryQuery] = useState("");
  const [sceneQuery, setSceneQuery] = useState("");
  const [sceneTitle, setSceneTitle] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [storyIndex, setStoryIndex] = useState<Record<string, number>>({});
  const q = preview ? "?preview=1" : "";
  const tier = tierForXp(xp);
  const mood = moodFor({ hour: new Date().getHours(), streak });
  const stories = useMemo(() => searchStorylines(storyQuery), [storyQuery]);
  const scenes = useMemo(() => searchScenes(sceneQuery), [sceneQuery]);

  useEffect(() => {
    if (!user || !id) return;
    const client = loose();
    void client.from("companion_bonds").select("xp, streak, last_day").eq("user_id", user.id).eq("companion_id", id).maybeSingle().then(({ data }) => {
      const today = new Date().toISOString().slice(0, 10);
      const next = nextStreak(Number(data?.streak ?? 0), data?.last_day ? String(data.last_day) : null, today);
      setXp(Number(data?.xp ?? 0));
      setStreak(next.streak);
      if (next.changed) {
        void client.from("companion_bonds").upsert({
          user_id: user.id,
          companion_id: id,
          xp: Number(data?.xp ?? 0),
          streak: next.streak,
          last_day: today,
          mood,
        });
      }
    });
    void client.from("companion_memories").select("id, body, feeling").eq("user_id", user.id).eq("companion_id", id).order("updated_at", { ascending: false }).limit(40).then(({ data }) => {
      setMemories((data ?? []).map((row) => ({ id: String(row.id), body: String(row.body), feeling: String(row.feeling ?? "") })));
    });
    void client.from("companion_outfits").select("id, name, neutral, active").eq("user_id", user.id).eq("companion_id", id).limit(40).then(({ data }) => {
      setOutfits((data ?? []).map((row) => ({ id: String(row.id), name: String(row.name), neutral: String(row.neutral ?? ""), active: Boolean(row.active) })));
    });
    void client.from("companion_posts").select("id, caption, image_url").eq("user_id", user.id).eq("companion_id", id).order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      setPosts((data ?? []).map((row) => ({ id: String(row.id), caption: String(row.caption), image_url: row.image_url ? String(row.image_url) : null })));
    });
    void client.from("companion_scenes").select("scene_title").eq("user_id", user.id).eq("companion_id", id).maybeSingle().then(({ data }) => {
      setSceneTitle(data?.scene_title ? String(data.scene_title) : null);
    });
    void supabase.from("chat_messages").select("image_url").eq("user_id", user.id).eq("companion_id", id).order("created_at", { ascending: false }).limit(24).then(({ data }) => {
      setPics((data ?? []).map((row) => row.image_url).filter((url): url is string => Boolean(url)));
    });
  }, [user, id, mood]);

  async function saveMemory() {
    if (!user || !memoryBody.trim()) return;
    const client = loose();
    const { error } = await client.from("companion_memories").insert({
      user_id: user.id,
      companion_id: id,
      body: memoryBody.trim(),
      feeling: memoryFeel.trim(),
    });
    if (error) {
      setNotice(error.message);
      return;
    }
    setMemoryBody("");
    setMemoryFeel("");
    setMemories((current) => [{ id: crypto.randomUUID(), body: memoryBody.trim(), feeling: memoryFeel.trim() }, ...current]);
  }

  async function removeMemory(memoryId: string) {
    await loose().from("companion_memories").delete().eq("id", memoryId).eq("user_id", user?.id ?? "");
    setMemories((current) => current.filter((item) => item.id !== memoryId));
  }

  async function wear(name: string, neutral: string) {
    if (!user) return;
    await loose().from("companion_style").upsert({
      user_id: user.id,
      companion_id: id,
      outfit_name: name,
      outfit_neutral: neutral,
      updated_at: new Date().toISOString(),
    });
    setNotice(`${companion?.name ?? "She"} is wearing ${name}.`);
  }

  async function pickScene(scene: (typeof DATE_SCENES)[number]) {
    if (!user) return;
    await loose().from("companion_scenes").upsert({
      user_id: user.id,
      companion_id: id,
      scene_id: scene.id,
      scene_title: scene.title,
      setting: scene.setting,
    });
    await loose().from("companion_style").upsert({
      user_id: user.id,
      companion_id: id,
      scene_name: scene.title,
      scene_neutral: scene.imageHint,
      updated_at: new Date().toISOString(),
    });
    setSceneTitle(scene.title);
  }

  async function chooseStory(storyId: string, chapterCount: number, choice: { id: string; label: string; reply: string; unlocks?: string }) {
    if (!user) return;
    const current = storyIndex[storyId] ?? 0;
    const next = applyStoryChoice({ chapterCount, chapterIndex: current, choice });
    setStoryIndex((map) => ({ ...map, [storyId]: next.chapterIndex }));
    await loose().from("storyline_progress").upsert({
      user_id: user.id,
      companion_id: id,
      storyline_id: storyId,
      chapter_index: next.chapterIndex,
      completed: next.completed,
      unlocked: next.unlocked ? [next.unlocked] : [],
      updated_at: new Date().toISOString(),
    });
    setNotice(next.completed ? "She keeps that ending." : choice.reply);
  }

  async function sendMoment(kind: "morning" | "night" | "thinking") {
    if (!user || !companion) return;
    const body = dailyLine({ kind, name: companion.name, mood, streak });
    await loose().from("daily_moments").insert({ user_id: user.id, companion_id: id, kind, body });
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      companion_id: id,
      role: "assistant",
      content: body,
    });
    void invokeWebPushSend({ title: companion.name, body, url: `/messages/${id}`, kind: "moment", tag: `moment-${id}` });
    setXp((value) => awardMessageXp(value));
    setNotice(body);
  }

  async function askPicture() {
    if (!user || !companion) return;
    setNotice("She is choosing something to wear…");
    const picked = await supabase.functions.invoke("velvet-vault", {
      body: { action: "picture", companionId: id, artLabel: companion.appearance || "Photorealistic" },
    });
    const payload = picked.data as { prompt?: string; poseId?: string | null; error?: string } | null;
    if (picked.error || !payload?.prompt) {
      setNotice(payload?.error || "She has nothing to wear yet.");
      return;
    }
    const poseDataUrl = payload.poseId ? await renderPosePngForId(payload.poseId) : null;
    const started = await studioGenerate({
      companionId: id,
      builtPrompt: payload.prompt,
      poseId: payload.poseId,
      poseDataUrl,
      variations: 1,
      prompt: "",
    });
    setNotice(started.jobs?.length ? "One credit. The picture is on its way in Studio." : "The picture did not start.");
  }

  async function postPic(url: string) {
    const spent = await supabase.functions.invoke("velvet-vault", {
      body: { action: "post", companionId: id, imageUrl: url, caption: "For you." },
    });
    const payload = spent.data as { error?: string } | null;
    if (spent.error || payload?.error) {
      setNotice(payload?.error || "That post did not go up.");
      return;
    }
    setPosts((current) => [{ id: crypto.randomUUID(), caption: "For you.", image_url: url }, ...current]);
    setNotice("Posted. One credit.");
  }

  if (!companion && !preview) {
    return <p className="p-8 text-sm text-muted-foreground">She is not on this account.</p>;
  }

  const name = companion?.name ?? "Her";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 lg:px-8 lg:pb-10">
      <Link to={`/companions${q}`} className="text-sm text-primary">Back to them</Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {companion?.portraitUrl ? <img src={companion.portraitUrl} alt="" className="h-24 w-20 rounded-2xl object-cover" /> : null}
          <div>
            <h1 className="font-gothic text-4xl">{name}</h1>
            <p className="text-sm text-primary">{tier.name} · {mood} · {streak} day streak</p>
            <p className="max-w-xl text-sm text-muted-foreground">{companion?.backstory || companion?.bio}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/messages/${id}${q}`} className="h-11 rounded-2xl bg-primary px-4 text-sm font-semibold leading-[2.75rem] text-primary-foreground">Chat</Link>
          <Link to={`/live-call/${id}`} className="h-11 rounded-2xl border border-border px-4 text-sm leading-[2.75rem]">Call</Link>
          <button type="button" onClick={() => setCalling(true)} className="h-11 rounded-2xl border border-primary/40 px-4 text-sm text-primary">Incoming</button>
        </div>
      </header>
      <p className="mt-3 text-sm text-muted-foreground">{companion?.personality}</p>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`h-10 shrink-0 rounded-full px-4 text-sm ${tab === item ? "bg-primary text-primary-foreground" : "border border-border"}`}>{item}</button>
        ))}
      </div>
      {notice ? <p className="mt-4 text-sm" role="status">{notice}</p> : null}

      {tab === "Her" ? (
        <section className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">{sceneTitle ? `You are in ${sceneTitle}.` : "No date set. She is wherever you left her."}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="h-11 rounded-2xl border border-border px-4 text-sm" onClick={() => void sendMoment("morning")}>Good morning</button>
            <button type="button" className="h-11 rounded-2xl border border-border px-4 text-sm" onClick={() => void sendMoment("night")}>Goodnight</button>
            <button type="button" className="h-11 rounded-2xl border border-border px-4 text-sm" onClick={() => void sendMoment("thinking")}>Thinking of you</button>
            <button type="button" className="h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={() => void askPicture()}>She sends a pic · 1 credit</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(companion?.tags ?? []).map((tag) => <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs">{tag}</span>)}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {pics.slice(0, 6).map((url) => <img key={url} src={url} alt="" className="aspect-[3/4] rounded-2xl object-cover" />)}
          </div>
        </section>
      ) : null}

      {tab === "Memory" ? (
        <section className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Things she remembers. She keeps how they feel.</p>
          <textarea value={memoryBody} onChange={(event) => setMemoryBody(event.target.value)} rows={2} placeholder="You take your coffee black." className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm" />
          <input value={memoryFeel} onChange={(event) => setMemoryFeel(event.target.value)} placeholder="How she feels about it" className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm" />
          <button type="button" onClick={() => void saveMemory()} className="h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Remember this</button>
          <ul className="space-y-2">
            {memories.map((memory) => (
              <li key={memory.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 p-3">
                <div>
                  <p className="text-sm">{memory.body}</p>
                  {memory.feeling ? <p className="text-xs text-primary">She feels {memory.feeling}</p> : null}
                </div>
                <button type="button" className="text-xs text-muted-foreground" onClick={() => void removeMemory(memory.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "Stories" ? (
        <section className="mt-6 space-y-3">
          <input value={storyQuery} onChange={(event) => setStoryQuery(event.target.value)} placeholder="Search stories" className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm" />
          <p className="text-xs text-muted-foreground">{STORYLINES.length} stories</p>
          {stories.slice(0, 12).map((story) => (
            <article key={story.id} className="rounded-2xl border border-white/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary">{story.category}</p>
              <h3 className="font-gothic text-2xl">{story.title}</h3>
              <p className="text-sm text-muted-foreground">{story.blurb}</p>
              <p className="mt-2 text-sm">{story.chapters[storyIndex[story.id] ?? 0]?.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {story.chapters[storyIndex[story.id] ?? 0]?.choices.map((choice) => (
                  <button key={choice.id} type="button" className="h-10 rounded-xl border border-border px-3 text-xs" onClick={() => void chooseStory(story.id, story.chapters.length, choice)}>{choice.label}</button>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "Dates" ? (
        <section className="mt-6 space-y-3">
          <input value={sceneQuery} onChange={(event) => setSceneQuery(event.target.value)} placeholder="Beach, bar, her apartment" className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm" />
          <p className="text-xs text-muted-foreground">{DATE_SCENES.length} places</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {scenes.slice(0, 16).map((scene) => (
              <button key={scene.id} type="button" onClick={() => void pickScene(scene)} className={`rounded-2xl border p-4 text-left ${sceneTitle === scene.title ? "border-primary" : "border-white/10"}`}>
                <p className="text-[10px] uppercase tracking-[0.16em] text-primary">{scene.category}</p>
                <p className="font-medium">{scene.title}</p>
                <p className="text-sm text-muted-foreground">{scene.setting}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "Style Her" ? (
        <>
          <StyleHer companionId={id} userId={user?.id ?? null} preview={preview} name={name} />
          {outfits.length ? (
            <section className="mt-6 grid gap-3 sm:grid-cols-2">
              <h3 className="sm:col-span-2 font-gothic text-2xl">Notes she kept</h3>
              {outfits.map((outfit) => (
                <button key={outfit.id} type="button" onClick={() => void wear(outfit.name, outfit.neutral)} className="rounded-2xl border border-white/10 p-4 text-left">
                  <p className="font-medium">{outfit.name}</p>
                  <p className="text-sm text-muted-foreground">{outfit.neutral}</p>
                </button>
              ))}
            </section>
          ) : null}
        </>
      ) : null}

      {tab === "Phone" ? (
        <section className="mt-6 space-y-4">
          <h2 className="font-gothic text-2xl">Her camera roll</h2>
          <div className="grid grid-cols-3 gap-2">
            {pics.map((url) => (
              <button key={url} type="button" onClick={() => void postPic(url)} className="text-left">
                <img src={url} alt="" className="aspect-square w-full rounded-xl object-cover" />
                <span className="text-[10px] text-primary">Post · 1 credit</span>
              </button>
            ))}
          </div>
          <h2 className="font-gothic text-2xl">Her posts</h2>
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl border border-white/10">
              {post.image_url ? <img src={post.image_url} alt="" className="max-h-80 w-full object-cover" /> : null}
              <p className="p-3 text-sm">{post.caption}</p>
            </article>
          ))}
        </section>
      ) : null}

      {calling ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 px-6 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary">Incoming</p>
            <h2 className="mt-2 font-gothic text-5xl">{name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{mood}. She wants you now.</p>
            <div className="mt-8 flex justify-center gap-4">
              <button type="button" className="grid h-16 w-16 place-items-center rounded-full bg-red-600" aria-label="Decline" onClick={() => { setCalling(false); void invokeWebPushSend({ title: name, body: "You missed her.", url: `/companions/${id}/bond`, kind: "call", tag: `lf-incoming-${id}` }); }}><PhoneOff /></button>
              <button type="button" className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500" aria-label="Accept" onClick={() => navigate(`/live-call/${id}`)}><Phone /></button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
