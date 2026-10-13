import { useState } from "react";
import { Link } from "react-router-dom";
import { Brush, Image as ImageIcon, Redo2, Shirt, Smile, Sparkles, Undo2 } from "lucide-react";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { parseStorageRef } from "@/lib/phone/storageUrl";
import { pollStudioJobs, readFileAsJpeg, readStudioEdit, stitchOutfitRefs, studioEdit, studioEnhance, studioImport, StudioError } from "@/lib/studio/api";
import { renderPosePng, type StudioPose } from "@/lib/studio/poses";
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

const TOOLS = [
  { id: "prompt", label: "Prompt", icon: Sparkles },
  { id: "outfit", label: "Outfit", icon: Shirt },
  { id: "pose", label: "Pose", icon: ImageIcon },
  { id: "brush", label: "Brush", icon: Brush },
  { id: "background", label: "Background", icon: ImageIcon },
  { id: "fix", label: "Fix", icon: Smile },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

const SOURCE_COPY: Record<Source, string> = {
  lab: "Lab image · explicit edits OK",
  character: "Character · explicit edits OK",
  upload: "Upload · explicit edits stay off",
};

export function EditTab() {
  const preview = usePhonePreview();
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
  const [tool, setTool] = useState<ToolId | null>(null);
  const [instruction, setInstruction] = useState("");
  const [strength, setStrength] = useState(1);
  const [variations, setVariations] = useState(1);
  const [pose, setPose] = useState<StudioPose | null>(null);
  const [poseOpen, setPoseOpen] = useState(false);
  const [outfits, setOutfits] = useState<string[]>([]);
  const [mask, setMask] = useState<string | null>(null);
  const [fix, setFix] = useState<"face" | "hands" | "touch">("face");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [attest, setAttest] = useState(false);
  const [importFile, setImportFile] = useState<string | null>(null);
  const current = frames[index];
  const q = preview ? "?preview=1" : "";

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
    if (!current) {
      setNotice("Upload a photo or open one from the gallery.");
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
        subject: subjectPayload(current),
        companionId: stashed?.companionId ?? null,
        tool,
        instruction,
        fix,
        strength,
        variations,
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
        source: job.source ?? started.source ?? current.source,
        before: current.url,
      })));
      setTool(null);
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
      <div className="flex items-center justify-between px-4 pb-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-primary">{current ? SOURCE_COPY[current.source] : "No image yet"}</p>
        <div className="flex gap-1">
          <button type="button" aria-label="Undo" disabled={index <= 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
          <button type="button" aria-label="Redo" disabled={index >= frames.length - 1} onClick={() => setIndex((value) => Math.min(frames.length - 1, value + 1))} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {current ? (
          <div className="relative">
            <CompareSlider before={current.before} after={current.url} />
            <StudioEditWand imageUrl={current.url} storageUrl={current.storageUrl} assetId={current.assetId} tag={current.tag} source={current.source} companionId={stashed?.companionId} />
          </div>
        ) : (
          <label className="grid h-64 cursor-pointer place-items-center rounded-[1.4rem] border border-dashed border-primary/40 bg-card/70 text-center text-sm text-muted-foreground">
            Upload a picture
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => void onUpload(event.target.files?.[0], "subject")} />
          </label>
        )}
        {notice ? <p className="mt-3 text-center text-xs text-foreground">{notice} {notice.includes("credit") || notice.includes("Upgrade") ? <Link className="text-primary underline" to={`/plans${q}`}>Plans</Link> : null}</p> : null}
        {current ? (
          <label className="mt-3 block text-center text-xs text-primary">
            Replace image
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => void onUpload(event.target.files?.[0], "subject")} />
          </label>
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/85 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        {busy ? <p className="pb-1 text-center text-[11px] text-primary">{busy}</p> : null}
        <div className="grid grid-cols-6 gap-1">
          {TOOLS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => setTool(item.id)} className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] text-foreground">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.2)]">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <StudioSheet
        open={tool != null && tool !== "brush" && tool !== "pose"}
        title={TOOLS.find((item) => item.id === tool)?.label ?? "Edit"}
        onClose={() => setTool(null)}
        footer={
          <button type="button" disabled={Boolean(busy)} onClick={() => void runEdit()} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
            {busy || `Apply · ${variations}`}
          </button>
        }
      >
        {tool === "fix" ? (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {(["face", "hands", "touch"] as const).map((item) => (
              <button key={item} type="button" onClick={() => setFix(item)} className={`h-12 rounded-xl border capitalize ${fix === item ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{item === "touch" ? "Touch-up" : item}</button>
            ))}
          </div>
        ) : null}
        {tool === "outfit" ? (
          <div className="mb-3">
            <div className="mb-2 flex gap-2">
              {outfits.map((url) => (
                <img key={url.slice(-24)} src={url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ))}
            </div>
            <label className="block text-center text-sm text-primary">
              Add a reference ({outfits.length}/3)
              <input type="file" accept="image/*" className="sr-only" disabled={outfits.length >= 3} onChange={(event) => void onUpload(event.target.files?.[0], "outfit")} />
            </label>
          </div>
        ) : null}
        <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={3} placeholder={tool === "background" ? "Rainy alley, neon pink" : "What should change?"} className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm" />
        <button type="button" className="mt-2 h-11 text-sm text-primary" onClick={() => void studioEnhance(instruction, "edit").then((next) => next.prompt && setInstruction(next.prompt)).catch((err) => setNotice(err instanceof Error ? err.message : "Enhance failed"))}>
          Grok Enhance
        </button>
        <label className="mt-3 block text-xs text-muted-foreground">
          Strength {Math.round(strength * 100)}
          <input type="range" min={0.2} max={1} step={0.05} value={strength} onChange={(event) => setStrength(Number(event.target.value))} className="mt-1 w-full" />
        </label>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4].map((count) => (
            <button key={count} type="button" onClick={() => setVariations(count)} className={`h-11 flex-1 rounded-xl border ${variations === count ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{count}</button>
          ))}
        </div>
      </StudioSheet>

      <PoseSheet open={poseOpen || tool === "pose"} selected={pose?.id ?? null} onClose={() => { setPoseOpen(false); if (tool === "pose") setTool(null); }} onPick={(next) => { setPose(next); setPoseOpen(false); if (next) setTool("pose"); }} />
      {tool === "pose" && pose ? (
        <div className="absolute inset-x-0 bottom-24 z-40 px-4">
          <button type="button" onClick={() => void runEdit()} className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground">Apply this pose</button>
        </div>
      ) : null}
      {current ? <MaskBrush src={current.url} open={tool === "brush"} onClose={() => setTool(null)} onDone={(url) => { setMask(url); setTool("brush"); void runEdit(); }} /> : null}

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
