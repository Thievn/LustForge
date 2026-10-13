import { useState } from "react";
import { Link } from "react-router-dom";
import { Brush, Image as ImageIcon, Redo2, Shirt, Smile, Sparkles, Undo2 } from "lucide-react";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { parseStorageRef } from "@/lib/phone/storageUrl";
import { pollStudioJobs, readFileAsJpeg, readStudioEdit, stitchOutfitRefs, studioEdit, studioEnhance, studioImport, StudioError } from "@/lib/studio/api";
import { renderPosePng, type StudioPose } from "@/lib/studio/poses";
import { quoteStackedEdit, stackedEditReady } from "../../../supabase/functions/_shared/stackedEdit";
import { CompareSlider } from "@/components/studio/CompareSlider";
import { MaskBrush } from "@/components/studio/MaskBrush";
import { PoseSheet } from "@/components/studio/PoseSheet";
import { StudioSheet } from "@/components/studio/Sheet";
import { StudioEditWand } from "@/components/studio/EditWand";

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
  lab: "Lab image · explicit edits OK",
  character: "Character · explicit edits OK",
  upload: "Upload · explicit edits stay off",
};

export function EditTab() {
  const preview = usePhonePreview();
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
  const [importOpen, setImportOpen] = useState(false);
  const [attest, setAttest] = useState(false);
  const [importFile, setImportFile] = useState<string | null>(null);
  const current = frames[index];
  const q = preview ? "?preview=1" : "";
  const quote = quoteStackedEdit({ admin: limits.catalogOwner, stacked: true });

  function pushFrames(next: Frame[]) {
    if (!next.length) return;
    setFrames((prev) => [...prev.slice(0, index + 1), ...next]);
    setIndex(index + 1);
  }

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

  async function runEdit() {
    const ready = stackedEditReady({
      hasImage: Boolean(current),
      instruction,
      outfitCount: outfits.length,
      poseId: pose?.id ?? null,
      mask: Boolean(mask),
      includeFix: fixOn,
      background: Boolean(background.trim()),
    });
    if (!ready.ok) {
      setNotice(ready.error);
      return;
    }
    if (preview) {
      setNotice("Preview only. Sign in to edit.");
      return;
    }
    setBusy("Starting the GPU…");
    setNotice(null);
    try {
      const outfitSheet = await stitchOutfitRefs(outfits);
      const poseDataUrl = pose ? await renderPosePng(pose) : null;
      const started = await studioEdit({
        subject: subjectPayload(current!),
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
      });
      const ids = (started.jobs ?? []).map((job) => job.id);
      if (!ids.length) throw new StudioError("No edit was started");
      const finished = await pollStudioJobs(ids, (label) => setBusy(label === "done" ? "Saving…" : label));
      const ok = finished.filter((job) => job.status === "COMPLETED" && job.imageUrl);
      if (!ok.length) throw new StudioError(finished.find((job) => job.error)?.error || "Edit failed");
      pushFrames(ok.map((job) => ({
        id: job.id,
        url: job.imageUrl!,
        storageUrl: job.storageUrl,
        assetId: job.assetId,
        tag: job.tag,
        source: job.source ?? started.source ?? current!.source,
        before: current!.url,
      })));
    } catch (err) {
      const code = err instanceof StudioError ? err.code : undefined;
      setNotice(err instanceof Error ? err.message : "Edit failed");
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
    setBusy("Checking the image…");
    try {
      const saved = await studioImport({ dataUrl: importFile, attestation: true });
      if (!saved.imageUrl || !saved.assetId) throw new StudioError("Import did not save");
      const frame: Frame = { id: saved.assetId, url: saved.imageUrl, assetId: saved.assetId, tag: saved.tag, source: "character" };
      setFrames([frame]);
      setIndex(0);
      setImportOpen(false);
      setNotice("Imported as a character. Explicit edits are allowed on this image.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Import failed");
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
          {current ? (
            <div className="relative">
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
          <button type="button" className="inline-flex h-10 items-center gap-2 text-sm text-primary" onClick={() => void studioEnhance(instruction, "edit").then((next) => next.prompt && setInstruction(next.prompt)).catch((err) => setNotice(err instanceof Error ? err.message : "Enhance failed"))}>
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
          <button type="button" onClick={() => setPoseOpen(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm">
            <ImageIcon className="h-4 w-4 text-primary" />
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
          {busy ? <p className="text-center text-xs text-primary" role="status">{busy}</p> : null}
          <p className="text-center text-xs text-muted-foreground">{quote.label}. Charged when it finishes. A failed edit comes back.</p>
          <button type="button" disabled={Boolean(busy)} onClick={() => void runEdit()} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
            {busy || "Apply"}
          </button>
        </aside>
      </div>

      <PoseSheet open={poseOpen} selected={pose?.id ?? null} onClose={() => setPoseOpen(false)} onPick={(next) => { setPose(next); setPoseOpen(false); }} />
      {current ? <MaskBrush src={current.url} open={brushOpen} onClose={() => setBrushOpen(false)} onDone={(url) => { setMask(url); setBrushOpen(false); }} /> : null}

      <StudioSheet open={importOpen} title="Import as character" onClose={() => setImportOpen(false)} footer={<button type="button" onClick={() => void runImport()} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground">Import</button>}>
        <p className="text-sm text-muted-foreground">Explicit edits stay off for uploads. Import is for a fictional adult character, not a real photo.</p>
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
