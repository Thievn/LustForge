import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { CompanionGalleryRow } from "@/hooks/useCompanionGeneratedImages";
import { isVideoPortraitUrl, portraitUrlsEquivalent, stablePortraitDisplayUrl } from "@/lib/companionMedia";
import { CANONICAL_PORTRAIT_GALLERY_ID_PREFIX } from "@/lib/companionGalleryWithCanonical";
import { ZoomableImageViewport } from "@/components/ZoomableImageViewport";
import { loadImageNaturalSize } from "@/lib/chatImageSettings";
import { isAcceptableChatPortraitUpload } from "@/lib/portraitAspect";
import type { SetPortraitFromGalleryHandler } from "@/lib/setPortraitFromGalleryTypes";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  companionName: string;
  images: CompanionGalleryRow[];
  loading?: boolean;
  currentPortraitUrl: string | null | undefined;
  onSetAsPortrait: SetPortraitFromGalleryHandler;
  /** When set, this gallery row is the I2V source for “loop video” (optional). */
  selectedLoopSourceId?: string | null;
  onSelectForLoop?: (row: CompanionGalleryRow | null) => void;
  compact?: boolean;
  canDelete?: boolean;
  onDelete?: (row: CompanionGalleryRow) => Promise<void>;
};

type GalleryFilter = "all" | "stills" | "clips";

/** True when row is a motion clip (not a chat still mis-tagged in the UI). */
export function companionGalleryRowIsClip(r: CompanionGalleryRow): boolean {
  if (r.is_video === true) return true;
  if (r.is_video === false) return false;
  const u = stablePortraitDisplayUrl(r.image_url) ?? r.image_url;
  return isVideoPortraitUrl(u);
}

export function CompanionGalleryGrid({
  companionName,
  images,
  loading,
  currentPortraitUrl,
  onSetAsPortrait,
  selectedLoopSourceId = null,
  onSelectForLoop,
  compact,
  canDelete = false,
  onDelete,
}: Props) {
  const [settingId, setSettingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CompanionGalleryRow | null>(null);
  const [lightbox, setLightbox] = useState<CompanionGalleryRow | null>(null);
  const [filter, setFilter] = useState<GalleryFilter>("all");

  const normalizedCurrent = currentPortraitUrl ? stablePortraitDisplayUrl(currentPortraitUrl) : null;

  const { stills, clips, showFilterTabs, filtered } = useMemo(() => {
    const st = images.filter((r) => !companionGalleryRowIsClip(r));
    const cl = images.filter((r) => companionGalleryRowIsClip(r));
    const tabs = Boolean(compact && images.length > 6 && (cl.length > 0 || images.length > 10));
    let list = images as CompanionGalleryRow[];
    if (filter === "stills") list = st;
    else if (filter === "clips") list = cl;
    return { stills: st, clips: cl, showFilterTabs: tabs, filtered: list };
  }, [images, compact, filter]);

  const deleteWarning = useMemo(() => {
    if (!pendingDelete || !onDelete) return null;
    const isPortrait =
      !companionGalleryRowIsClip(pendingDelete) &&
      Boolean(normalizedCurrent) &&
      portraitUrlsEquivalent(pendingDelete.image_url, normalizedCurrent ?? undefined);
    const isLoopSource = selectedLoopSourceId === pendingDelete.id;
    if (isPortrait && isLoopSource) {
      return "This image is your current portrait and the selected loop source frame. Deleting it cannot be undone.";
    }
    if (isPortrait) {
      return "This image is your current profile portrait. Deleting it cannot be undone.";
    }
    if (isLoopSource) {
      return "This still is selected as the frame for loop generation. Deleting it cannot be undone.";
    }
    if (companionGalleryRowIsClip(pendingDelete)) {
      return "Delete this loop clip from your gallery? The file will be removed from this companion's gallery.";
    }
    return "Delete this image from your gallery? This cannot be undone.";
  }, [pendingDelete, onDelete, normalizedCurrent, selectedLoopSourceId]);

  const confirmDelete = async () => {
    if (!pendingDelete || !onDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await onDelete(pendingDelete);
      if (lightbox?.id === pendingDelete.id) setLightbox(null);
      toast.success(companionGalleryRowIsClip(pendingDelete) ? "Clip removed" : "Image removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  const handleSetPortrait = async (row: CompanionGalleryRow) => {
    if (companionGalleryRowIsClip(row)) {
      toast.error("Videos can’t be used as profile portraits. Pick a still image.");
      return;
    }
    const url = stablePortraitDisplayUrl(row.image_url) ?? row.image_url;
    setSettingId(row.id);
    try {
      const { width, height } = await loadImageNaturalSize(url);
      if (width >= height) {
        toast.error("Landscape images can’t be used as profile portraits. Pick a vertical 9∶16 image.");
        return;
      }
      if (!isAcceptableChatPortraitUpload(width, height)) {
        toast.error(
          "Profile portraits need a vertical card look (2:3 preferred; 3:4 or 9:16 also work). This image’s ratio doesn’t match.",
        );
        return;
      }
      await onSetAsPortrait(url, {
        generatedImageId: row.id.startsWith(CANONICAL_PORTRAIT_GALLERY_ID_PREFIX) ? undefined : row.id,
        isCardArt: row.id.startsWith(CANONICAL_PORTRAIT_GALLERY_ID_PREFIX),
      });
      toast.success("Portrait updated for your account", {
        description:
          "Profile and chat use this still for you only. If you generated a loop from this image, it plays on your profile too.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update portrait.");
    } finally {
      setSettingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-black/35 backdrop-blur-xl px-6 py-14 text-center">
        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Nothing here yet. Chat generations and profile loop clips show up automatically once they&apos;re saved to this
          companion&apos;s gallery.
        </p>
      </div>
    );
  }

  const filterPill = (key: GalleryFilter, label: string, count: number) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter(key)}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors",
        filter === key
          ? "border-primary/55 bg-primary/25 text-primary-foreground"
          : "border-white/15 bg-black/40 text-muted-foreground hover:border-white/25 hover:text-foreground/90",
      )}
    >
      {label} <span className="tabular-nums opacity-80">({count})</span>
    </button>
  );

  const toolbar = showFilterTabs ? (
    <div className="sticky top-0 z-[1] -mx-1 mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-[#07060a]/95 px-1 pb-2 pt-0.5 backdrop-blur-md">
      <div className="flex flex-wrap gap-1.5">
        {filterPill("all", "All", images.length)}
        {filterPill("stills", "Stills", stills.length)}
        {clips.length ? filterPill("clips", "Clips", clips.length) : null}
      </div>
      <span className="text-[10px] text-muted-foreground/85 tabular-nums">{filtered.length} shown</span>
    </div>
  ) : compact ? (
    <p className="mb-2 text-[10px] text-muted-foreground/80 tabular-nums">
      {images.length} item{images.length === 1 ? "" : "s"} · newest first
    </p>
  ) : null;

  const grid = (
    <div
      className={cn(
        "grid",
        compact ? "grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2" : "grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4",
      )}
    >
      {filtered.map((row) => {
          const display = stablePortraitDisplayUrl(row.image_url) ?? row.image_url;
          const isVideo = companionGalleryRowIsClip(row);
          const isActive =
            !isVideo &&
            Boolean(normalizedCurrent) &&
            portraitUrlsEquivalent(row.image_url, normalizedCurrent ?? undefined);
          return (
            <motion.div
              key={row.id}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "group relative aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.08] bg-black/50 shadow-lg shadow-black/40 sm:rounded-2xl",
                compact && "rounded-lg",
              )}
            >
              <button
                type="button"
                onClick={() => setLightbox(row)}
                className="absolute inset-0 z-0 block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                {isVideo ? (
                  <video
                    src={display}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <img
                    src={display}
                    alt=""
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
              </button>
              {isActive ? (
                <span
                  className={cn(
                    "absolute left-1.5 top-1.5 z-[2] rounded-full border border-primary/50 bg-primary/20 font-semibold uppercase tracking-wider text-primary",
                    compact ? "px-1.5 py-0.5 text-[8px]" : "top-2 left-2 px-2 py-0.5 text-[10px]",
                  )}
                >
                  Portrait
                </span>
              ) : row.id.startsWith(CANONICAL_PORTRAIT_GALLERY_ID_PREFIX) ? (
                <span
                  className={cn(
                    "absolute left-1.5 top-1.5 z-[2] rounded-full border border-sky-400/45 bg-sky-950/70 font-semibold uppercase tracking-wider text-sky-100/95",
                    compact ? "px-1.5 py-0.5 text-[8px]" : "top-2 left-2 px-2 py-0.5 text-[10px]",
                  )}
                >
                  Card art
                </span>
              ) : null}
              {canDelete && onDelete && !row.id.startsWith(CANONICAL_PORTRAIT_GALLERY_ID_PREFIX) ? (
                <button
                  type="button"
                  title="Delete from gallery"
                  disabled={deletingId === row.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(row);
                  }}
                  className={cn(
                    "absolute right-1.5 top-1.5 z-[3] flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/90 hover:bg-red-950/80 hover:border-red-400/40 hover:text-red-100",
                    compact && "h-5 w-5",
                    isVideo && "top-8 sm:top-9",
                  )}
                >
                  {deletingId === row.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              ) : null}
              {isVideo ? (
                <span
                  className={cn(
                    "absolute right-1.5 top-1.5 z-[2] rounded-full border border-emerald-400/45 bg-emerald-500/15 font-semibold uppercase tracking-wider text-emerald-100/95",
                    compact ? "px-1.5 py-0.5 text-[8px]" : "top-2 right-2 px-2 py-0.5 text-[10px]",
                  )}
                  title="Loop / motion clip"
                >
                  Clip
                </span>
              ) : null}
              {!isVideo && selectedLoopSourceId === row.id ? (
                <span
                  className={cn(
                    "absolute right-1.5 top-1.5 z-[2] rounded-full border border-violet-400/45 bg-violet-950/70 font-semibold uppercase tracking-wider text-violet-100/95",
                    compact ? "px-1.5 py-0.5 text-[8px]" : "top-2 right-2 px-2 py-0.5 text-[10px]",
                  )}
                  title="This still is the source frame for generating a profile loop clip"
                >
                  Clip src
                </span>
              ) : null}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 z-[2] flex shadow-[0_-8px_24px_rgba(0,0,0,0.55)]",
                  compact ? "flex-row flex-wrap gap-1 p-1" : "flex-col gap-1.5 p-2",
                )}
              >
                {onSelectForLoop && !isVideo && !row.id.startsWith(CANONICAL_PORTRAIT_GALLERY_ID_PREFIX) ? (
                  <button
                    type="button"
                    title={
                      selectedLoopSourceId === row.id
                        ? "Clear profile clip source"
                        : "Use this still as the frame to generate a profile loop clip (separate from portrait)"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectForLoop(selectedLoopSourceId === row.id ? null : row);
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-lg border font-semibold shadow-md touch-manipulation transition-colors",
                      compact ? "min-h-[30px] px-1 py-1 text-[9px] sm:min-h-[32px] sm:text-[10px]" : "gap-1.5 rounded-xl py-2 text-xs",
                      selectedLoopSourceId === row.id
                        ? "border-violet-400/55 bg-violet-600/35 text-violet-50 hover:bg-violet-600/45"
                        : "border-violet-500/35 bg-black/55 text-violet-100/95 hover:bg-violet-950/40",
                    )}
                  >
                    {compact
                      ? selectedLoopSourceId === row.id
                        ? "Clear"
                        : "Clip src"
                      : selectedLoopSourceId === row.id
                        ? "Clear clip source"
                        : "Use for profile clip"}
                  </button>
                ) : null}
                <button
                  type="button"
                  title="Set as profile portrait"
                  disabled={settingId === row.id || isVideo}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleSetPortrait(row);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary/90 font-semibold text-primary-foreground shadow-md hover:bg-primary disabled:opacity-60 touch-manipulation",
                    compact ? "min-h-[30px] px-1 py-1 text-[9px] sm:min-h-[32px] sm:text-[10px]" : "gap-1.5 rounded-xl py-2 text-xs",
                  )}
                >
                  {settingId === row.id ? (
                    <Loader2 className={cn("animate-spin", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
                  ) : (
                    <Sparkles className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
                  )}
                  {compact ? "Portrait" : "Set as portrait"}
                </button>
              </div>
            </motion.div>
          );
        })}
    </div>
  );

  const mainBlock = (
    <>
      {toolbar}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Nothing in this filter — try another tab.</p>
      ) : (
        grid
      )}
    </>
  );

  /** Large compact galleries (e.g. profile loop-video picker): bounded scroll so the page doesn’t grow forever. */
  const useInnerScroll = Boolean(compact && images.length >= 10);

  const scrollShell = useInnerScroll ? (
    <div className="max-h-[min(46vh,400px)] overflow-y-auto overscroll-y-contain rounded-xl border border-white/[0.06] bg-black/30 px-2 py-2 sm:max-h-[min(52vh,480px)] [scrollbar-gutter:stable]">
      {mainBlock}
    </div>
  ) : (
    mainBlock
  );

  return (
    <>
      {scrollShell}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-[#0c0a10]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-gothic text-lg">Delete gallery item?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">{deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {lightbox ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="relative max-w-lg w-full max-h-[90vh] flex flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute -top-1 -right-1 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="w-full rounded-2xl border border-white/10 bg-black/30 overflow-hidden max-h-[min(78vh,800px)]">
                {companionGalleryRowIsClip(lightbox) ? (
                  <video
                    src={stablePortraitDisplayUrl(lightbox.image_url) ?? lightbox.image_url}
                    controls
                    playsInline
                    autoPlay
                    className="w-full max-h-[min(78vh,800px)] object-contain bg-black"
                  />
                ) : (
                  <ZoomableImageViewport
                    src={stablePortraitDisplayUrl(lightbox.image_url) ?? lightbox.image_url}
                    alt=""
                    className="min-h-[min(65vh,640px)]"
                  />
                )}
              </div>
              {companionGalleryRowIsClip(lightbox) ? (
                <p className="text-[10px] text-center text-muted-foreground/90">Native video controls</p>
              ) : (
                <p className="text-[10px] text-center text-muted-foreground/90">
                  Pinch or scroll to zoom · double-click to reset
                </p>
              )}
              <p className="text-xs text-muted-foreground italic line-clamp-3 text-center px-2">
                {lightbox.prompt}
              </p>
              <p className="text-[10px] text-center text-muted-foreground/80">
                {companionName} · {new Date(lightbox.created_at).toLocaleString()}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
