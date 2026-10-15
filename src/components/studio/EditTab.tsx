import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Brush, Image as ImageIcon, Redo2, Shirt, Smile, Sparkles, Undo2 } from "lucide-react";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { parseStorageRef } from "@/lib/phone/storageUrl";
import { readFileAsJpeg, readStudioEdit, stitchOutfitRefs, studioEdit, studioEnhance, studioImport, StudioError } from "@/lib/studio/api";
import { studioMood } from "@/lib/studio/copy";
import { studioJobOpen, useStudioJobs } from "@/lib/studio/jobs";
import { renderPosePng, studioPoseById, type StudioPose } from "@/lib/studio/poses";
import { poseThumbUrl } from "@/lib/studio/poseThumbs";
import { quoteStackedEdit, stackedEditReady } from "../../../supabase/functions/_shared/stackedEdit";
import { ENHANCE_KEPT_MESSAGE, isEnhanceRefusal } from "../../../supabase/functions/_shared/studioSafety";
import { CompareSlider } from "@/components/studio/CompareSlider";
import { MaskBrush } from "@/components/studio/MaskBrush";
import { PictureComing } from "@/components/studio/PictureComing";
import { PoseSheet } from "@/components/studio/PoseSheet";
import { StudioSheet } from "@/components/studio/Sheet";
import { StudioEditWand } from "@/components/studio/EditWand";
import { VaultPicks, type VaultPick } from "@/components/studio/VaultPicks";
import type { TreasureSlot } from "@/lib/vault/treasures";

type Source = "lab" | "character" | "upload";
type Frame = {
  id: string;
  url: string;
  storageUrl?: string;
  assetId?: string;
  tag?: string;
  source: Source;
  before?: string;
};

const SOURCE_COPY: Record<Source, string> = {
  lab: "Lab image · explicit edits welcome",
  character: "Her picture · explicit edits welcome",
  upload: "Outside picture · explicit edits wait until she's a character",
};

const TRACK_KEY = "lf-studio-tracks";

type Track = { id: string; before: string };

function readTracks(): Track[] {
  try {
    const stored = localStorage.getItem(TRACK_KEY) ?? sessionStorage.getItem(TRACK_KEY);
    const raw = JSON.parse(stored || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    const tracks = raw.filter((item): item is Track => Boolean(item) && typeof item.id === "string" && typeof item.before === "string");
    if (!localStorage.getItem(TRACK_KEY) && tracks.length) writeTracks(tracks);
    return tracks;
  } catch {
    return [];
  }
}

function writeTracks(tracks: Track[]) {
  try {
    localStorage.setItem(TRACK_KEY, JSON.stringify(tracks));
  } catch {
    /* A very large before-picture can miss the store. The job itself still finishes. */
  }
}

async function urlToJpeg(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return null;
  }
}

export function EditTab() {
  const preview = usePhonePreview();
  const studio = useStudioJobs();
  const { limits } = usePhoneRoster(preview);
  const stashed = readStudioEdit();
  const [frames, setFrames] = useState<Frame[]>(() =>
    stashed?.imageUrl
      ? [{
          id: "start",
          url: stashed.imageUrl,
          storageUrl: stashed.storageUrl,
          assetId: stashed.assetId,
          tag: stashed.tag,
          source: stashed.source ?? "upload",
        }]
      : [],
  );
  const [index, setIndex] = useState(0);
  const [instruction, setInstruction] = useState("");
  const [background, setBackground] = useState("");
  const [strength, setStrength] = useState(1);
  const [pose, setPose] = useState<StudioPose | null>(null);
  const [poseOpen, setPoseOpen] = useState(false);
  const [outfits, setOutfits] = useState<string[]>([]);
  const [mask, setMask] = useState<string | null>(null);
  const [brushOpen, setBrushOpen] = useState(false);
  const [fixOn, setFixOn] = useState(false);
  const [fix, setFix] = useState<"face" | "hands" | "touch">("face");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [vaultIds, setVaultIds] = useState<Partial<Record<TreasureSlot, string>>>({});
  const [vaultPieces, setVaultPieces] = useState<VaultPick[]>([]);
  const [tracks, setTracks] = useState<Track[]>(() => readTracks());
  const folded = useRef(new Set<string>());
  const [importOpen, setImportOpen] = useState(false);
  const [attest, setAttest] = useState(false);
  const [importFile, setImportFile] = useState<string | null>(null);
  const current = frames[index];
  const q = preview ? "?preview=1" : "";
  const quote = quoteStackedEdit({ admin: limits.catalogOwner, stacked: true });
  const openHere = studio.jobs.filter((job) => tracks.some((track) => track.id === job.id) && studioJobOpen(job.status));
  const mood = openHere[0] ? studioMood(openHere[0].status) : "";

  function subjectPayload(frame: Frame) {
    if (frame.assetId) return { assetId: frame.assetId };
    const stored = frame.storageUrl || (parseStorageRef(frame.url) ? frame.url : "");
    if (stored && !frame.url.startsWith("data:")) return { imageUrl: stored };
    return { dataUrl: frame.url, tag: frame.tag };
  }

  async function onUpload(file: File | undefined, into: "subject" | "outfit" | "import") {
    if (!file) return;
    const url = await readFileAsJpeg(file);
    if (into === "subject") {
      setFrames([{ id: crypto.randomUUID(), url, source: "upload" }]);
      setIndex(0);
    } else if (into === "outfit") {
      setOutfits((prev) => [...prev, url].slice(-3));
    } else {
      setImportFile(url);
    }
  }

  useEffect(() => {
    const ready = studio.jobs.filter((job) => tracks.some((track) => track.id === job.id) && job.status === "COMPLETED" && job.imageUrl && !folded.current.has(job.id));
    const failed = studio.jobs.filter((job) => tracks.some((track) => track.id === job.id) && (job.status === "FAILED" || job.status === "CANCELLED" || job.status === "TIMED_OUT"));
    if (failed.length) {
      setNotice(failed[0].error || "She couldn't finish that picture. If it took a credit, it comes back.");
    }
    if (ready.length) {
      for (const job of ready) folded.current.add(job.id);
      setFrames((prev) => {
        const known = new Set(prev.map((frame) => frame.id));
        const extra = ready.filter((job) => !known.has(job.id)).map((job) => ({
          id: job.id,
          url: job.imageUrl!,
          storageUrl: job.storageUrl,
          assetId: job.assetId,
          tag: job.tag,
          source: (job.source ?? "lab") as Source,
          before: tracks.find((track) => track.id === job.id)?.before,
        }));
        if (!extra.length) return prev;
        const next = [...prev, ...extra];
        queueMicrotask(() => setIndex(next.length - 1));
        return next;
      });
    }
    const drop = new Set([...failed, ...ready].map((job) => job.id));
    if (!drop.size) return;
    setTracks((prev) => {
      const next = prev.filter((track) => !drop.has(track.id));
      writeTracks(next);
      return next;
    });
  }, [studio.jobs, tracks]);

  useEffect(() => {
    if (frames.length > 0) return;
    const openTrack = tracks.find((track) => {
      const job = studio.jobs.find((item) => item.id === track.id);
      return !job || studioJobOpen(job.status);
    });
    const openJob = studio.pending.find((job) => job.kind === "edit");
    const url = openTrack?.before || openJob?.subjectUrl;
    if (!url) return;
    const stored = url.startsWith("http") || url.startsWith("storage://") ? url : undefined;
    setFrames([{ id: "resume", url, storageUrl: stored, source: "lab" }]);
  }, [frames.length, studio.jobs, studio.pending, tracks]);

  async function enhance() {
    if (!instruction.trim()) {
      setNotice("Write what should change first.");
      return;
    }
    setNotice(null);
    try {
      const next = await studioEnhance(instruction, "edit");
      if (next.refused || !next.prompt || isEnhanceRefusal(next.prompt)) {
        setNotice(next.notice || ENHANCE_KEPT_MESSAGE);
        return;
      }
      setInstruction(next.prompt);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : ENHANCE_KEPT_MESSAGE);
    }
  }

  function onVault(next: Partial<Record<TreasureSlot, string>>, pieces: VaultPick[]) {
    const posePick = pieces.find((item) => item.slot === "pose" && item.poseId);
    if (posePick?.poseId) setPose(studioPoseById(posePick.poseId));
    else if (vaultIds.pose) {
      const previous = vaultPieces.find((item) => item.slot === "pose");
      setPose((current) => (current && previous?.poseId && current.id === previous.poseId ? null : current));
    }
    setVaultIds(next);
    setVaultPieces(pieces);
  }

  async function runEdit() {
    const ready = stackedEditReady({
      hasImage: Boolean(current),
      instruction,
      outfitCount: outfits.length,
      poseId: pose?.id ?? null,
      mask: Boolean(mask),
      includeFix: fixOn,
      background: Boolean(background.trim()),
      treasureCount: vaultPieces.length,
    });
    if (!ready.ok) {
      setNotice(ready.error);
      return;
    }
    if (preview) {
      setNotice("Preview only. Sign in to edit.");
      return;
    }
    if (openHere.length) {
      setNotice("She's still getting ready.");
      return;
    }
    setBusy(studioMood(null));
    setNotice(null);
    try {
      const treasureUrls: string[] = [];
      for (const piece of vaultPieces) {
        if (piece.slot === "pose" || piece.slot === "mood" || !piece.imageUrl) continue;
        const jpeg = await urlToJpeg(piece.imageUrl);
        if (jpeg) treasureUrls.push(jpeg);
      }
      const outfitSheet = await stitchOutfitRefs([...outfits, ...treasureUrls].slice(0, 3));
      const poseDataUrl = pose ? await renderPosePng(pose) : null;
      const subjectUrl = current?.storageUrl || (current && !current.url.startsWith("data:") ? current.url : "");
      const started = await studioEdit({
        subject: subjectPayload(current!),
        subjectUrl,
        companionId: stashed?.companionId ?? null,
        stacked: true,
        tool: background.trim() ? "background" : "prompt",
        instruction,
        background,
        includeFix: fixOn,
        fix: fixOn ? fix : undefined,
        strength,
        variations: 1,
        poseId: pose?.id ?? null,
        poseDataUrl,
        outfitRefs: outfitSheet ? [{ dataUrl: outfitSheet }] : [],
        maskDataUrl: mask,
        treasureIds: vaultPieces.map((piece) => piece.id),
      });
      const ids = (started.jobs ?? []).map((job) => job.id);
      if (!ids.length) throw new StudioError("She couldn't start that edit.");
      const nextTracks = [...tracks, ...ids.map((id) => ({ id, before: current!.url }))];
      writeTracks(nextTracks);
      setTracks(nextTracks);
      studio.notePending(ids);
    } catch (err) {
      const code = err instanceof StudioError ? err.code : undefined;
      setNotice(err instanceof Error ? err.message : "She couldn't start that edit.");
      if (code === "EXPLICIT_UPLOAD") setImportOpen(true);
    } finally {
      setBusy("");
    }
  }

  async function runImport() {
    if (!importFile) {
      setNotice("Choose the fictional character image.");
      return;
    }
    if (!attest) {
      setNotice("Check the box first.");
      return;
    }
    setBusy("Looking her over…");
    try {
      const saved = await studioImport({ dataUrl: importFile, attestation: true });
      if (!saved.imageUrl || !saved.assetId) throw new StudioError("She didn't stay.");
      const frame: Frame = { id: saved.assetId, url: saved.imageUrl, assetId: saved.assetId, tag: saved.tag, source: "character" };
      setFrames([frame]);
      setIndex(0);
      setImportOpen(false);
      setNotice("She's in as a character now. Explicit edits are welcome on this picture.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "She couldn't come in just yet.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary">{current ? SOURCE_COPY[current.source] : "No image yet"}</p>
            <div className="flex gap-1">
              <button type="button" aria-label="Undo" disabled={index <= 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
              <button type="button" aria-label="Redo" disabled={index >= frames.length - 1} onClick={() => setIndex((value) => Math.min(frames.length - 1, value + 1))} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
            </div>
          </div>
          {openHere.length || busy ? (
            <PictureComing src={current?.url || openHere[0]?.subjectUrl} status={openHere[0]?.status} />
          ) : current ? (
            <div key={current.id} className="relative animate-in fade-in duration-700">
              <CompareSlider before={current.before} after={current.url} />
              <StudioEditWand imageUrl={current.url} storageUrl={current.storageUrl} assetId={current.assetId} tag={current.tag} source={current.source} companionId={stashed?.companionId} />
            </div>
          ) : (
            <label className="grid h-80 cursor-pointer place-items-center rounded-[1.4rem] border border-dashed border-primary/40 bg-card/70 text-center text-sm text-muted-foreground">
              Upload a picture
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => void onUpload(event.target.files?.[0], "subject")} />
            </label>
          )}
          {current ? (
            <label className="mt-3 block text-center text-xs text-primary">
              Replace image
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => void onUpload(event.target.files?.[0], "subject")} />
            </label>
          ) : null}
        </div>

        <aside className="space-y-3 rounded-[1.4rem] border border-white/10 bg-card/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary">This edit</p>
          <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={3} placeholder="What should change?" className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm" />
          <button type="button" className="inline-flex h-10 items-center gap-2 text-sm text-primary" onClick={() => void enhance()}>
            <Sparkles className="h-4 w-4" /> Grok Enhance
          </button>
          <label className="block text-xs text-muted-foreground">
            Background
            <input value={background} onChange={(event) => setBackground(event.target.value)} placeholder="Rainy window, warm lamp" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
          </label>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Shirt className="h-3.5 w-3.5" /> Outfit references</span>
              <span>{outfits.length}/3</span>
            </div>
            <div className="mb-2 flex gap-2">
              {outfits.map((url) => (
                <img key={url.slice(-24)} src={url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ))}
            </div>
            <label className="block text-center text-sm text-primary">
              Add a reference
              <input type="file" accept="image/*" className="sr-only" disabled={outfits.length >= 3} onChange={(event) => void onUpload(event.target.files?.[0], "outfit")} />
            </label>
          </div>
          <VaultPicks picks={vaultIds} onChange={onVault} />
          <button type="button" onClick={() => setPoseOpen(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm">
            {pose && poseThumbUrl(pose.id) ? (
              <img src={poseThumbUrl(pose.id) ?? ""} alt="" className="h-9 w-7 rounded-md bg-black object-contain" />
            ) : (
              <ImageIcon className="h-4 w-4 text-primary" />
            )}
            {pose ? pose.name : "Choose a pose"}
          </button>
          {pose ? <button type="button" className="text-xs text-muted-foreground" onClick={() => setPose(null)}>Clear pose</button> : null}
          <button type="button" disabled={!current} onClick={() => setBrushOpen(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm disabled:opacity-40">
            <Brush className="h-4 w-4 text-primary" />
            {mask ? "Mask saved" : "Paint a mask"}
          </button>
          {mask ? <button type="button" className="text-xs text-muted-foreground" onClick={() => setMask(null)}>Clear mask</button> : null}
          <div>
            <button type="button" onClick={() => setFixOn((value) => !value)} className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-sm ${fixOn ? "border-primary bg-primary/15" : "border-border"}`}>
              <Smile className="h-4 w-4 text-primary" />
              {fixOn ? "Fix is on" : "Add a fix"}
            </button>
            {fixOn ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["face", "hands", "touch"] as const).map((item) => (
                  <button key={item} type="button" onClick={() => setFix(item)} className={`h-11 rounded-xl border capitalize ${fix === item ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{item === "touch" ? "Touch-up" : item}</button>
                ))}
              </div>
            ) : null}
          </div>
          <label className="block text-xs text-muted-foreground">
            Strength {Math.round(strength * 100)}
            <input type="range" min={0.2} max={1} step={0.05} value={strength} onChange={(event) => setStrength(Number(event.target.value))} className="mt-1 w-full" />
          </label>
          {notice ? (
            <p className="text-sm text-foreground" role="alert">
              {notice} {notice.includes("credit") || notice.includes("Upgrade") ? <Link className="text-primary underline" to={`/plans${q}`}>Plans</Link> : null}
            </p>
          ) : null}
          {mood || busy ? <p className="text-center text-xs text-primary" role="status">{mood || busy}</p> : null}
          <p className="text-center text-xs text-muted-foreground">{quote.label}. She takes it when the picture is ready. If it doesn't come through, it comes back.</p>
          <button type="button" disabled={Boolean(busy || mood)} onClick={() => void runEdit()} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
            {mood || busy || "Apply"}
          </button>
        </aside>
      </div>

      <PoseSheet open={poseOpen} selected={pose?.id ?? null} onClose={() => setPoseOpen(false)} onPick={(next) => { setPose(next); setPoseOpen(false); }} />
      {current ? <MaskBrush src={current.url} open={brushOpen} onClose={() => setBrushOpen(false)} onDone={(url) => { setMask(url); setBrushOpen(false); }} /> : null}

      <StudioSheet open={importOpen} title="Import as character" onClose={() => setImportOpen(false)} footer={<button type="button" onClick={() => void runImport()} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground">Import</button>}>
        <p className="text-sm text-muted-foreground">Explicit edits stay off for a picture brought in from outside. Bring her in when she's a fictional adult, not a real photo.</p>
        <label className="mt-3 block text-sm text-primary">
          Choose image
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => void onUpload(event.target.files?.[0], "import")} />
        </label>
        {importFile ? <img src={importFile} alt="" className="mt-3 max-h-40 rounded-xl object-contain" /> : null}
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" checked={attest} onChange={(event) => setAttest(event.target.checked)} className="mt-1 h-5 w-5" />
          I confirm this is a fictional adult, 21 or older, not a real person, and I have the rights to use it.
        </label>
      </StudioSheet>
    </>
  );
}
