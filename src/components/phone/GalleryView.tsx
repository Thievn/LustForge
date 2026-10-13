import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneEmpty, PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { StudioEditWand } from "@/components/studio/EditWand";
import { displayableMediaUrl, parseStorageRef } from "@/lib/phone/storageUrl";

type Source = "lab" | "character" | "upload";
type Tile = {
  id: string;
  src: string;
  storageUrl?: string;
  companionId: string | null;
  createdAt: string;
  source: Source;
};

const PREVIEW_TILES: Tile[] = [
  { id: "preview-1", src: "/og-image.png", companionId: "preview-ivy", createdAt: new Date().toISOString(), source: "character" },
  { id: "preview-2", src: "/og-image.png", companionId: "preview-luna", createdAt: new Date().toISOString(), source: "lab" },
];

export default function GalleryView() {
  const preview = usePhonePreview();
  const { user, companions } = usePhoneRoster(preview);
  const [tiles, setTiles] = useState<Tile[]>(preview ? PREVIEW_TILES : []);
  const [loading, setLoading] = useState(!preview);
  const [active, setActive] = useState<Tile | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const q = preview ? "?preview=1" : "";

  useEffect(() => {
    if (preview || !user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [generated, messages, portraits, overrides, loops, characters] = await Promise.all([
        supabase
          .from("generated_images")
          .select("id, image_url, companion_id, created_at, is_video")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("chat_messages")
          .select("id, image_url, companion_id, created_at")
          .eq("user_id", user.id)
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("companion_portraits")
          .select("id, image_url, created_at, name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("user_companion_portrait_overrides")
          .select("user_id, companion_id, portrait_url, animated_portrait_url, updated_at")
          .eq("user_id", user.id),
        supabase
          .from("profile_loop_video_jobs")
          .select("id, companion_id, public_url, created_at, status")
          .eq("user_id", user.id)
          .not("public_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("custom_characters")
          .select("id, image_url, static_image_url, avatar_url, created_at")
          .eq("user_id", user.id),
      ]);
      if (cancelled) return;
      const seen = new Set<string>();
      const next: Tile[] = [];
      const push = async (id: string, raw: string | null | undefined, companionId: string | null, createdAt: string, source: Source) => {
        const chosen = displayableMediaUrl(raw);
        const src = await resolveSrc(chosen);
        if (!src || seen.has(src)) return;
        seen.add(src);
        const storageUrl = raw && parseStorageRef(raw) ? raw : chosen && parseStorageRef(chosen) ? chosen : undefined;
        next.push({ id, src, storageUrl, companionId, createdAt, source });
      };
      for (const row of generated.data ?? []) {
        if (row.is_video) continue;
        await push(row.id, row.image_url, row.companion_id, row.created_at, "lab");
      }
      for (const row of portraits.data ?? []) {
        await push(row.id, row.image_url, null, row.created_at, "character");
      }
      for (const row of overrides.data ?? []) {
        await push(`${row.user_id}-${row.companion_id}-still`, row.portrait_url, row.companion_id, row.updated_at, "character");
        await push(`${row.user_id}-${row.companion_id}-loop`, row.animated_portrait_url, row.companion_id, row.updated_at, "character");
      }
      for (const row of loops.data ?? []) {
        await push(row.id, row.public_url, row.companion_id, row.created_at, "lab");
      }
      for (const row of characters.data ?? []) {
        const still = displayableMediaUrl(row.static_image_url, row.image_url, row.avatar_url);
        await push(`cc-${row.id}`, still, `cc-${row.id}`, row.created_at, "character");
      }
      for (const row of messages.data ?? []) {
        await push(row.id, row.image_url, row.companion_id, row.created_at, "upload");
      }
      setTiles(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [preview, user]);

  const visible = tiles.filter((tile) => {
    if (filter === "all") return true;
    const raw = filter.startsWith("cc-") ? filter.slice(3) : filter;
    return tile.companionId === filter || tile.companionId === raw || tile.companionId === `cc-${raw}`;
  });

  return (
    <PhoneStage layout="app">
      <header className="flex items-center gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={`/dashboard${q}`} className="inline-flex h-11 w-11 items-center justify-center text-primary" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-gothic text-2xl text-foreground">Gallery</h1>
      </header>
      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        <FilterChip label="All" on={filter === "all"} onClick={() => setFilter("all")} />
        {companions.slice(0, 12).map((companion) => (
          <FilterChip key={companion.id} label={companion.name} on={filter === companion.id} onClick={() => setFilter(companion.id)} />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-[max(6rem,env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <PhoneEmpty
            title="Nothing saved yet"
            body="Pictures she sends, and ones you generate, stay here. They are kept in Storage and tied to you and to her."
          />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {visible.map((tile) => (
              <div key={tile.id} className="relative overflow-hidden rounded-xl border border-border">
                <button type="button" onClick={() => setActive(tile)} className="block w-full">
                  <img src={tile.src} alt="" className="aspect-[3/4] w-full object-cover" />
                </button>
                <StudioEditWand imageUrl={tile.src} storageUrl={tile.storageUrl} companionId={tile.companionId} source={tile.source} />
              </div>
            ))}
          </div>
        )}
      </div>
      {active ? (
        <div className="absolute inset-0 z-20 flex items-center bg-black/70 p-4" onClick={() => setActive(null)}>
          <div className="relative mx-auto w-full" onClick={(event) => event.stopPropagation()}>
            <img src={active.src} alt="" className="max-h-[70vh] w-full rounded-2xl object-contain" />
            <StudioEditWand imageUrl={active.src} storageUrl={active.storageUrl} companionId={active.companionId} source={active.source} />
          </div>
        </div>
      ) : null}
    </PhoneStage>
  );
}

function FilterChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
    >
      {label}
    </button>
  );
}

async function resolveSrc(url: string | null) {
  if (!url) return null;
  const ref = parseStorageRef(url);
  if (!ref) return url;
  if (ref.bucket === "companion-images") return supabase.storage.from(ref.bucket).getPublicUrl(ref.path).data.publicUrl;
  const signed = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
  return signed.data?.signedUrl ?? null;
}
