import { useMemo, useState } from "react";

import { Loader2 } from "lucide-react";

import { companionGalleryRowIsClip, type CompanionGalleryRow } from "@/components/companion/CompanionGalleryGrid";

import { prependCanonicalPortraitIfMissing } from "@/lib/companionGalleryWithCanonical";

import { portraitUrlsEquivalent, stablePortraitDisplayUrl } from "@/lib/companionMedia";

import { cn } from "@/lib/utils";

import type { AdminCompanionGalleryRow } from "@/hooks/useAdminCompanionGallery";



type Filter = "all" | "stills" | "clips";



export const X_MARKETING_GALLERY_MAX_STILLS = 4;



export type XMarketingGalleryPickerProps = {

  companionId: string;

  companionName: string;

  canonicalStillUrl: string | null | undefined;

  rows: AdminCompanionGalleryRow[];

  loading?: boolean;

  selectedIds: string[];

  onChangeSelectedIds: (ids: string[]) => void;

  pairedLoopUrl?: string | null;

  usePairedLoop?: boolean;

  onUsePairedLoopChange?: (next: boolean) => void;

};



function toGalleryRow(r: AdminCompanionGalleryRow): CompanionGalleryRow {

  return {

    id: r.id,

    image_url: r.image_url,

    prompt: r.prompt,

    created_at: r.created_at,

    saved_to_personal_gallery: null,

    is_video: r.is_video,

  };

}



export function XMarketingGalleryPicker({

  companionId,

  companionName,

  canonicalStillUrl,

  rows,

  loading,

  selectedIds,

  onChangeSelectedIds,

  pairedLoopUrl,

  usePairedLoop,

  onUsePairedLoopChange,

}: XMarketingGalleryPickerProps) {

  const [filter, setFilter] = useState<Filter>("all");



  const images = useMemo(

    () =>

      prependCanonicalPortraitIfMissing(

        rows.map(toGalleryRow),

        { companionId, canonicalStillUrl },

      ),

    [rows, companionId, canonicalStillUrl],

  );



  const { stills, clips, filtered } = useMemo(() => {

    const st = images.filter((r) => !companionGalleryRowIsClip(r));

    const cl = images.filter((r) => companionGalleryRowIsClip(r));

    let list = images;

    if (filter === "stills") list = st;

    else if (filter === "clips") list = cl;

    return { stills: st, clips: cl, filtered: list };

  }, [images, filter]);



  const selectedStillCount = useMemo(

    () =>

      selectedIds.filter((id) => {

        const row = images.find((r) => r.id === id);

        return row && !companionGalleryRowIsClip(row);

      }).length,

    [selectedIds, images],

  );



  const toggleRow = (row: CompanionGalleryRow) => {

    const isClip = companionGalleryRowIsClip(row);

    if (isClip) {

      onChangeSelectedIds([row.id]);

      onUsePairedLoopChange?.(false);

      return;

    }

    const already = selectedIds.includes(row.id);

    if (already) {

      onChangeSelectedIds(selectedIds.filter((id) => id !== row.id));

      return;

    }

    const stillIds = selectedIds.filter((id) => {

      const r = images.find((x) => x.id === id);

      return r && !companionGalleryRowIsClip(r);

    });

    const clipIds = selectedIds.filter((id) => clips.some((c) => c.id === id));

    if (stillIds.length >= X_MARKETING_GALLERY_MAX_STILLS) {

      onChangeSelectedIds([...stillIds.slice(1), row.id]);

    } else {

      onChangeSelectedIds([...stillIds, ...clipIds, row.id]);

    }

    onUsePairedLoopChange?.(false);

  };



  if (loading) {

    return (

      <div className="flex items-center justify-center py-10 text-muted-foreground">

        <Loader2 className="h-6 w-6 animate-spin text-primary" />

      </div>

    );

  }



  if (!images.length) {

    return (

      <p className="text-[11px] text-muted-foreground leading-relaxed py-4 text-center">

        No chat or loop media saved for {companionName} yet — use profile portrait or generate a marketing still.

      </p>

    );

  }



  const pill = (key: Filter, label: string, count: number) => (

    <button

      key={key}

      type="button"

      onClick={() => setFilter(key)}

      className={cn(

        "rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-colors",

        filter === key

          ? "border-primary/45 bg-primary/15 text-primary"

          : "border-white/10 bg-black/40 text-muted-foreground hover:border-white/20",

      )}

    >

      {label} ({count})

    </button>

  );



  return (

    <div className="space-y-2">

      <div className="flex flex-wrap items-center gap-1.5">

        {pill("all", "All", images.length)}

        {pill("stills", "Stills", stills.length)}

        {pill("clips", "Clips", clips.length)}

        {selectedStillCount > 0 ? (

          <span className="ml-auto text-[9px] font-semibold text-emerald-200/90 tabular-nums">

            {selectedStillCount}/{X_MARKETING_GALLERY_MAX_STILLS} for tweet

          </span>

        ) : null}

      </div>

      <div className="max-h-[min(42vh,360px)] overflow-y-auto overscroll-y-contain rounded-xl border border-white/[0.06] bg-black/30 p-2 [scrollbar-gutter:stable]">

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">

          {filtered.map((row) => {

            const display = stablePortraitDisplayUrl(row.image_url) ?? row.image_url;

            const isClip = companionGalleryRowIsClip(row);

            const isSelected = selectedIds.includes(row.id);

            const order = isSelected ? selectedIds.indexOf(row.id) + 1 : 0;

            return (

              <button

                key={row.id}

                type="button"

                title={row.prompt?.slice(0, 120) || companionName}

                onClick={() => toggleRow(row)}

                className={cn(

                  "group relative aspect-[2/3] overflow-hidden rounded-lg border text-left transition-all",

                  isSelected

                    ? "border-primary ring-2 ring-primary/40 shadow-[0_0_16px_rgba(214,51,108,0.25)]"

                    : "border-white/10 hover:border-primary/35",

                )}

              >

                {isClip ? (

                  <video

                    src={display}

                    muted

                    playsInline

                    preload="metadata"

                    className="h-full w-full object-cover object-top"

                  />

                ) : (

                  <img src={display} alt="" className="h-full w-full object-cover object-top" />

                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 py-1">

                  <p className="text-[8px] font-semibold uppercase tracking-wide text-white/90 truncate">

                    {isClip ? "Clip" : "Still"}

                  </p>

                </div>

                {isSelected ? (

                  <span className="absolute left-1 top-1 rounded-full border border-primary/50 bg-primary/25 px-1.5 py-0.5 text-[8px] font-bold uppercase text-primary">

                    {isClip ? "Video" : order > 0 ? `#${order}` : "X"}

                  </span>

                ) : null}

              </button>

            );

          })}

        </div>

        {filtered.length === 0 ? (

          <p className="py-6 text-center text-[11px] text-muted-foreground">Nothing in this filter.</p>

        ) : null}

      </div>

      {selectedIds.length ? (

        <p className="text-[9px] text-muted-foreground leading-snug">

          Tap stills to add up to {X_MARKETING_GALLERY_MAX_STILLS} images per tweet. Clips replace selection (one video per post).

        </p>

      ) : null}

      {pairedLoopUrl && selectedStillCount === 1 && onUsePairedLoopChange ? (

        <label className="flex items-start gap-2 rounded-lg border border-violet-500/30 bg-violet-950/20 px-2.5 py-2 cursor-pointer">

          <input

            type="checkbox"

            className="mt-0.5 accent-violet-400"

            checked={Boolean(usePairedLoop)}

            onChange={(e) => onUsePairedLoopChange(e.target.checked)}

          />

          <span className="text-[10px] text-violet-100/95 leading-snug">

            Use paired profile loop MP4 for this still instead of the image (when looping video for X is on).

          </span>

        </label>

      ) : null}

    </div>

  );

}



/** Resolve selected gallery row URL for hero preview / Zernio. */

export function adminGalleryRowMediaUrl(row: AdminCompanionGalleryRow | CompanionGalleryRow | null | undefined): string | null {

  if (!row?.image_url?.trim()) return null;

  return stablePortraitDisplayUrl(row.image_url) ?? row.image_url.trim();

}



export function adminGalleryRowsEquivalent(

  a: AdminCompanionGalleryRow | CompanionGalleryRow | null | undefined,

  b: AdminCompanionGalleryRow | CompanionGalleryRow | null | undefined,

): boolean {

  if (!a || !b) return false;

  return portraitUrlsEquivalent(a.image_url, b.image_url);

}



/** Resolve public https URLs for selected gallery rows (stills only, max 4). */

export function adminGalleryStillMediaUrlsForX(

  syntheticRows: CompanionGalleryRow[],

  selectedIds: string[],

  canonicalStillUrl: string | null | undefined,

): string[] {

  const urls: string[] = [];

  for (const id of selectedIds) {

    const row = syntheticRows.find((r) => r.id === id);

    if (!row || companionGalleryRowIsClip(row)) continue;

    const url = adminGalleryRowMediaUrl(row);

    if (!url || !/^https?:\/\//i.test(url)) continue;

    if (urls.some((u) => portraitUrlsEquivalent(u, url))) continue;

    urls.push(url.split("?")[0] ?? url);

    if (urls.length >= X_MARKETING_GALLERY_MAX_STILLS) break;

  }

  if (!urls.length && canonicalStillUrl && selectedIds.some((id) => id.startsWith("canonical-card-portrait::"))) {

    const u = stablePortraitDisplayUrl(canonicalStillUrl) ?? canonicalStillUrl;

    if (/^https?:\/\//i.test(u)) urls.push(u.split("?")[0] ?? u);

  }

  return urls;

}


