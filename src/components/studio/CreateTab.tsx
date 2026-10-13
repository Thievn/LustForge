import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { pollStudioJobs, stashStudioEdit, studioEnhance, studioGenerate, StudioError, type StudioJob } from "@/lib/studio/api";
import { STUDIO_SCENES, STUDIO_STYLES, type StudioStyleId } from "@/lib/studio/options";
import { renderPosePng, type StudioPose } from "@/lib/studio/poses";
import { Chip } from "@/components/studio/Sheet";
import { PoseSheet } from "@/components/studio/PoseSheet";
import { StudioEditWand } from "@/components/studio/EditWand";
import { supabase } from "@/integrations/supabase/client";

type Result = StudioJob & { imageUrl: string };

export function CreateTab() {
  const preview = usePhonePreview();
  const navigate = useNavigate();
  const { companions, limits, user } = usePhoneRoster(preview);
  const [companionId, setCompanionId] = useState<string | null>(companions[0]?.id ?? null);
  const companionTouched = useRef(Boolean(companions[0]));
  const [styleId, setStyleId] = useState<StudioStyleId>("photoreal");
  const [sceneId, setSceneId] = useState<string>("portrait");
  const [prompt, setPrompt] = useState("");
  const [pose, setPose] = useState<StudioPose | null>(null);
  const [poseOpen, setPoseOpen] = useState(false);
  const [variations, setVariations] = useState(1);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const q = preview ? "?preview=1" : "";
  const scene = STUDIO_SCENES.find((item) => item.id === sceneId) ?? STUDIO_SCENES[0];

  useEffect(() => {
    if (companionTouched.current || companionId || !companions[0]) return;
    setCompanionId(companions[0].id);
  }, [companionId, companions]);

  async function enhance() {
    if (preview) {
      setNotice("Preview only. Sign in to use Grok Enhance.");
      return;
    }
    setBusy("Enhancing…");
    setNotice(null);
    try {
      const next = await studioEnhance([scene.text, pose?.hint, prompt].filter(Boolean).join(", "), "create");
      if (next.prompt) setPrompt(next.prompt);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Enhance failed");
    } finally {
      setBusy("");
    }
  }

  async function generate() {
    if (preview) {
      setNotice("Preview only. Sign in to generate.");
      return;
    }
    setBusy("Starting the GPU…");
    setNotice(null);
    try {
      const poseDataUrl = pose ? await renderPosePng(pose) : null;
      const started = await studioGenerate({
        companionId,
        styleId,
        scene: scene.text,
        poseId: pose?.id ?? null,
        poseHint: pose?.hint ?? "",
        poseDataUrl,
        prompt,
        variations,
      });
      const ids = (started.jobs ?? []).map((job) => job.id);
      if (!ids.length) throw new StudioError("No job was started");
      setBusy("Queued, GPU waking…");
      const finished = await pollStudioJobs(ids, (label) => setBusy(label === "done" ? "Saving…" : label));
      const ok = finished.filter((job): job is Result => job.status === "COMPLETED" && Boolean(job.imageUrl));
      const failed = finished.find((job) => job.error);
      if (!ok.length) throw new StudioError(failed?.error || "Nothing came back");
      setResults(ok);
      if (failed?.error) setNotice(failed.error);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setBusy("");
    }
  }

  function openEdit(result: Result) {
    stashStudioEdit({
      imageUrl: result.imageUrl,
      storageUrl: result.storageUrl,
      companionId,
      assetId: result.assetId,
      tag: result.tag,
      source: "lab",
    });
    navigate(preview ? "/lab?tab=edit&preview=1" : "/lab?tab=edit");
  }

  async function sendToChat(result: Result) {
    if (!user || !companionId) {
      setNotice("Pick a companion, then send it to her chat.");
      return;
    }
    const row = {
      user_id: user.id,
      companion_id: companionId,
      role: "assistant",
      content: "Made this for you.",
      image_url: result.storageUrl || result.imageUrl,
      kind: "image",
      origin: "studio",
    };
    const first = await supabase.from("chat_messages").insert(row as never);
    if (first.error) {
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        companion_id: companionId,
        role: "assistant",
        content: "Made this for you.",
        image_url: result.storageUrl || result.imageUrl,
      });
    }
    navigate(`/messages/${companionId}`);
  }

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-28">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-primary">Companion</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                companionTouched.current = true;
                setCompanionId(null);
              }}
              className={`h-16 w-16 shrink-0 rounded-2xl border text-xs ${companionId === null ? "border-primary bg-primary/20" : "border-border bg-card/70"}`}
            >
              Blank
            </button>
            {companions.map((companion) => (
              <button
                key={companion.id}
                type="button"
                onClick={() => {
                  companionTouched.current = true;
                  setCompanionId(companion.id);
                }}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border ${companionId === companion.id ? "border-primary shadow-[0_0_16px_hsl(var(--primary)/0.35)]" : "border-border"}`}
              >
                {companion.portraitUrl ? (
                  <img src={companion.portraitUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-xs" style={{ background: companion.gradientFrom }}>{companion.name.slice(0, 1)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-primary">Style</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STUDIO_STYLES.map((style) => (
              <Chip key={style.id} on={styleId === style.id} onClick={() => setStyleId(style.id)}>{style.label}</Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-primary">Scene</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STUDIO_SCENES.map((item) => (
              <Chip key={item.id} on={sceneId === item.id} onClick={() => setSceneId(item.id)}>{item.label}</Chip>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-primary">Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            placeholder="Evening light, looking back over her shoulder"
            className="w-full rounded-2xl border border-border bg-card/80 px-3 py-3 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => void enhance()} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 text-sm">
            <Sparkles className="h-4 w-4 text-primary" /> Grok Enhance
          </button>
          <button type="button" onClick={() => setPoseOpen(true)} className="h-12 flex-1 rounded-2xl border border-border bg-card/80 text-sm">
            {pose ? pose.name : "Pose"}
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Variations</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((count) => (
              <button key={count} type="button" onClick={() => setVariations(count)} className={`h-11 w-11 rounded-xl border ${variations === count ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                {count}
              </button>
            ))}
          </div>
        </div>
        {results.length ? (
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {results.map((result) => (
              <article key={result.id} className="relative w-[78%] shrink-0 snap-center overflow-hidden rounded-[1.4rem] border border-white/15 bg-card/80">
                <img src={result.imageUrl} alt="" className="aspect-[3/4] w-full object-cover" />
                <StudioEditWand imageUrl={result.imageUrl} storageUrl={result.storageUrl} companionId={companionId} assetId={result.assetId} tag={result.tag} source="lab" />
                <div className="grid grid-cols-3 gap-1 p-2 text-xs">
                  <button type="button" className="h-11 rounded-xl bg-primary/15" onClick={() => setNotice("Saved to your gallery.")}>Save</button>
                  <button type="button" className="h-11 rounded-xl bg-primary/15" onClick={() => void sendToChat(result)}>Chat</button>
                  <button type="button" className="h-11 rounded-xl bg-primary text-primary-foreground" onClick={() => openEdit(result)}>Edit</button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {limits.catalogOwner ? "Admin · credits stay put." : `${limits.credits} credits. Free accounts get 3 Studio tries, then a plan.`} 1 credit each.
        </p>
        <Link to={`/lab/new${q}`} className="block text-center text-sm text-primary">New companion</Link>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        {notice ? <p className="mb-2 text-center text-xs text-foreground">{notice} {notice.includes("credit") || notice.includes("Upgrade") ? <Link to={`/plans${q}`} className="text-primary underline">Plans</Link> : null}</p> : null}
        <button type="button" disabled={Boolean(busy)} onClick={() => void generate()} className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[0_0_28px_hsl(var(--primary)/0.35)] disabled:opacity-60">
          {busy || `Generate · ${variations}`}
        </button>
      </div>
      <PoseSheet open={poseOpen} selected={pose?.id ?? null} onClose={() => setPoseOpen(false)} onPick={(next) => { setPose(next); setPoseOpen(false); }} />
    </>
  );
}
