import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { pollStudioJobs, stashStudioEdit, studioEnhance, studioGenerate, StudioError, type StudioJob } from "@/lib/studio/api";
import { STUDIO_SCENES } from "@/lib/studio/options";
import { CREATOR_DEFAULTS, CREATOR_FIELDS, CREATOR_STYLES, buildCreatorPrompt, creatorDims, type CreatorLook } from "@/lib/studio/creator";
import { renderPosePng, studioPoseById, type StudioPose } from "@/lib/studio/poses";
import { poseThumbUrl } from "@/lib/studio/poseThumbs";
import { Chip } from "@/components/studio/Sheet";
import { PoseSheet } from "@/components/studio/PoseSheet";
import { StudioEditWand } from "@/components/studio/EditWand";
import { supabase } from "@/integrations/supabase/client";
import { TREASURES, type TreasureSlot } from "@/lib/vault/treasures";
import { loadCompanionLooks, lookSlotId, vaultCall, type LookRow, type VaultPiece } from "@/lib/vault/looks";

type Result = StudioJob & { imageUrl: string };

export function CreateTab() {
  const preview = usePhonePreview();
  const navigate = useNavigate();
  const { companions, limits, user } = usePhoneRoster(preview);
  const [companionId, setCompanionId] = useState<string | null>(companions[0]?.id ?? null);
  const companionTouched = useRef(Boolean(companions[0]));
  const [styleId, setStyleId] = useState("photoreal");
  const [look, setLook] = useState<CreatorLook>(CREATOR_DEFAULTS);
  const [sceneId, setSceneId] = useState<string>("portrait");
  const [prompt, setPrompt] = useState("");
  const [pose, setPose] = useState<StudioPose | null>(null);
  const [poseOpen, setPoseOpen] = useState(false);
  const [vaultPieces, setVaultPieces] = useState<VaultPiece[]>([]);
  const [savedLooks, setSavedLooks] = useState<LookRow[]>([]);
  const [lookId, setLookId] = useState<string>("");
  const [slots, setSlots] = useState<Partial<Record<TreasureSlot, string>>>({});
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

  useEffect(() => {
    void vaultCall({ action: "quote" }).then((res) => {
      const rows = Array.isArray(res.data?.items) ? res.data.items as Array<Record<string, unknown>> : [];
      const next = rows.length
        ? rows.map((item) => ({
          id: String(item.id),
          name: String(item.name ?? ""),
          slot: String(item.slot ?? "outfit") as TreasureSlot,
          kind: String(item.kind ?? ""),
          rarity: String(item.rarity ?? "silk"),
          blurb: String(item.blurb ?? ""),
          owned: Boolean(item.owned),
          isNew: Boolean(item.isNew),
        }))
        : TREASURES.map((item) => ({
          id: item.id,
          name: item.name,
          slot: item.slot,
          kind: item.kind,
          rarity: item.rarity,
          blurb: item.blurb,
          owned: false,
          isNew: item.isNew,
        }));
      setVaultPieces(next);
    });
  }, []);

  useEffect(() => {
    if (!user || !companionId) {
      setSavedLooks([]);
      return;
    }
    void loadCompanionLooks(user.id, companionId).then(setSavedLooks);
  }, [user, companionId]);

  function chooseLook(id: string) {
    setLookId(id);
    const look = savedLooks.find((item) => item.id === id);
    if (!look) {
      setSlots({});
      return;
    }
    const next: Partial<Record<TreasureSlot, string>> = {};
    (["outfit", "accessory", "pose", "scene", "hair", "mood"] as TreasureSlot[]).forEach((slot) => {
      const piece = lookSlotId(look, slot);
      if (piece) next[slot] = piece;
    });
    setSlots(next);
  }

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
      const style = CREATOR_STYLES.find((item) => item.id === styleId) ?? CREATOR_STYLES[0];
      const slotIds = {
        outfitId: slots.outfit || null,
        accessoryId: slots.accessory || null,
        sceneId: slots.scene || null,
        poseId: slots.pose || null,
        hairId: slots.hair || null,
        moodId: slots.mood || null,
      };
      let worn = "";
      let wornPose: string | null = null;
      if (Object.values(slotIds).some(Boolean)) {
        const composed = await vaultCall({ action: "compose", artLabel: style.label, companionId, ...slotIds });
        if (composed.error) throw new StudioError(composed.error);
        worn = String(composed.data?.prompt ?? "");
        wornPose = composed.data?.poseId ? String(composed.data.poseId) : null;
      }
      const poseForSkeleton = pose ?? studioPoseById(wornPose);
      const poseDataUrl = poseForSkeleton ? await renderPosePng(poseForSkeleton) : null;
      const sized = creatorDims(look.aspect);
      const started = await studioGenerate({
        companionId,
        styleId,
        scene: scene.text,
        poseId: poseForSkeleton?.id ?? null,
        poseHint: pose?.hint ?? "",
        poseDataUrl,
        prompt,
        variations,
        builtPrompt: buildCreatorPrompt({ ...look, style: styleId, custom: [prompt, worn].filter(Boolean).join(". ") }, scene.text),
        width: sized.width,
        height: sized.height,
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
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-primary">Look</p>
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            <Chip on={lookId === ""} onClick={() => chooseLook("")}>Slots</Chip>
            {savedLooks.map((item) => (
              <Chip key={item.id} on={lookId === item.id} onClick={() => chooseLook(item.id)}>{item.name}</Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["outfit", "accessory", "pose", "scene", "hair", "mood"] as TreasureSlot[]).map((slot) => {
              const choices = vaultPieces.filter((item) => item.slot === slot && item.owned);
              const locked = vaultPieces.some((item) => item.slot === slot && !item.owned);
              return (
                <label key={slot} className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {slot}
                  <select
                    value={slots[slot] ?? ""}
                    onChange={(event) => {
                      setLookId("");
                      setSlots((current) => ({ ...current, [slot]: event.target.value }));
                    }}
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-2 text-sm capitalize text-foreground"
                  >
                    <option value="">None</option>
                    {choices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  {locked ? <Link to={`/treasures${q}`} className="mt-1 block text-[10px] normal-case tracking-normal text-primary">Find in the Vault</Link> : null}
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-primary">Style</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CREATOR_STYLES.map((style) => (
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
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(CREATOR_FIELDS) as Array<keyof typeof CREATOR_FIELDS>).map((key) => (
            <label key={key} className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {key}
              <select
                value={look[key]}
                onChange={(event) => setLook((current) => ({ ...current, [key]: event.target.value }))}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-2 text-sm capitalize text-foreground"
              >
                {CREATOR_FIELDS[key].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-primary">Extra</span>
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
          <button type="button" onClick={() => setPoseOpen(true)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 text-sm">
            {pose && poseThumbUrl(pose.id) ? <img src={poseThumbUrl(pose.id) ?? ""} alt="" className="h-9 w-7 rounded-md bg-black object-contain" /> : null}
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
