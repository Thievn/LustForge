import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { RosterCompanion } from "@/lib/phone/usePhoneRoster";
import { signDisplayUrl } from "@/lib/phone/signMedia";
import { customCompanionUuid } from "../../../supabase/functions/_shared/ownedCompanion";

export type CompanionShot = {
  id: string;
  url: string;
  storageUrl?: string;
};

type Props = {
  preview: boolean;
  userId: string | null;
  roster: RosterCompanion[];
  purchasedIds: Set<string> | null;
  purchasedReady: boolean;
  selectedId: string | null;
  onSelect: (companionId: string) => void;
  onUpload: (file: File) => void;
  onPickImage: (shot: CompanionShot) => void;
};

type Owned = { id: string; name: string; portraitUrl: string | null };

export function CompanionPick({
  preview,
  userId,
  roster,
  purchasedIds,
  purchasedReady,
  selectedId,
  onSelect,
  onUpload,
  onPickImage,
}: Props) {
  const [ownIds, setOwnIds] = useState<Set<string> | null>(preview ? new Set() : null);
  const [shots, setShots] = useState<CompanionShot[]>([]);
  const [loadingShots, setLoadingShots] = useState(false);

  useEffect(() => {
    if (preview || !userId) {
      setOwnIds(new Set());
      return;
    }
    let cancel = false;
    void supabase
      .from("custom_characters")
      .select("id")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (cancel) return;
        if (error) {
          setOwnIds(new Set());
          return;
        }
        setOwnIds(new Set((data ?? []).map((row) => String(row.id))));
      });
    return () => {
      cancel = true;
    };
  }, [preview, userId]);

  const owned: Owned[] = preview
    ? roster.map((companion) => ({ id: companion.id, name: companion.name, portraitUrl: companion.portraitUrl ?? null }))
    : roster.flatMap((companion) => {
        if (!ownIds || !purchasedReady) return [];
        const uuid = customCompanionUuid(companion.id);
        if (uuid) {
          return ownIds.has(uuid) ? [{ id: companion.id, name: companion.name, portraitUrl: companion.portraitUrl ?? null }] : [];
        }
        if (companion.id.startsWith("cc-")) return [];
        return purchasedIds?.has(companion.id)
          ? [{ id: companion.id, name: companion.name, portraitUrl: companion.portraitUrl ?? null }]
          : [];
      });

  const selected = owned.find((companion) => companion.id === selectedId) ?? null;
  const portrait = selected?.portraitUrl ?? null;

  useEffect(() => {
    if (!selectedId || !selected) {
      setShots([]);
      setLoadingShots(false);
      return;
    }
    const companion = selected;
    let cancel = false;
    setLoadingShots(true);
    void (async () => {
      const next = preview ? previewShots(companion) : await loadShots(userId, companion);
      if (!cancel) {
        setShots(next);
        setLoadingShots(false);
      }
    })();
    return () => {
      cancel = true;
    };
    // selected is derived each render; id + portrait identify the gallery.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, selectedId, portrait, userId, ownIds, purchasedReady]);

  return (
    <div className="mb-3">
      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-primary">Her pictures</p>
      {owned.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {owned.map((companion) => {
            const on = companion.id === selectedId;
            return (
              <button
                key={companion.id}
                type="button"
                onClick={() => onSelect(companion.id)}
                className={`flex h-12 shrink-0 items-center gap-2 rounded-full border pl-1 pr-3 ${on ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"}`}
              >
                {companion.portraitUrl ? (
                  <img src={companion.portraitUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-xs">{companion.name.slice(0, 1)}</span>
                )}
                <span className="text-xs">{companion.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{ownIds && purchasedReady ? "No companions unlocked yet." : "Looking up your companions…"}</p>
      )}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        <label className="grid h-24 w-16 shrink-0 cursor-pointer place-items-center rounded-xl border border-dashed border-primary/40 bg-card/70 text-center text-[10px] uppercase tracking-wide text-primary">
          <ImagePlus className="mb-1 h-4 w-4" />
          Phone
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onUpload(file);
            }}
          />
        </label>
        {selected ? (
          loadingShots ? (
            <div className="h-24 w-16 shrink-0 animate-pulse rounded-xl bg-card" />
          ) : shots.length ? (
            shots.map((shot) => (
              <button
                key={shot.id}
                type="button"
                onClick={() => onPickImage(shot)}
                className="h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10"
              >
                <img src={shot.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))
          ) : (
            <p className="self-center text-xs text-muted-foreground">No pictures yet. Upload one from your phone.</p>
          )
        ) : (
          <p className="self-center text-xs text-muted-foreground">Pick her, then choose a picture. Or bring one in from your phone.</p>
        )}
      </div>
    </div>
  );
}

function previewShots(companion: Owned): CompanionShot[] {
  const portrait = companion.portraitUrl?.trim() || "";
  const shots: CompanionShot[] = [];
  if (portrait) shots.push({ id: `${companion.id}-portrait`, url: portrait, storageUrl: portrait });
  if (portrait !== "/og-image.png") shots.push({ id: `${companion.id}-still`, url: "/og-image.png", storageUrl: "/og-image.png" });
  return shots;
}

async function loadShots(userId: string | null, companion: Owned): Promise<CompanionShot[]> {
  if (!userId) return [];
  const full = await supabase
    .from("generated_images")
    .select("id, image_url, is_video, created_at")
    .eq("user_id", userId)
    .eq("companion_id", companion.id)
    .order("created_at", { ascending: false })
    .limit(80);
  const rows = (full.data ?? []).filter((row) => !row.is_video && row.image_url);
  const shots: CompanionShot[] = [];
  const seen = new Set<string>();
  const push = async (id: string, raw: string) => {
    if (seen.has(raw)) return;
    seen.add(raw);
    const url = await signDisplayUrl(raw);
    if (!url) return;
    shots.push({ id, url, storageUrl: raw });
  };
  const portrait = companion.portraitUrl?.trim();
  if (portrait) await push(`portrait-${companion.id}`, portrait);
  for (const row of rows) await push(row.id, row.image_url);
  return shots;
}
