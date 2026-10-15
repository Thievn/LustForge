import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isPlatformAdmin } from "@/config/auth";
import { dbToCompanion, mapSupabaseCustomCharacterRow, mapSupabaseStockCompanionRow } from "@/hooks/useCompanions";
import type { Companion } from "@/data/companions";
import { isLoopVideoStorageUrl } from "@/lib/companionMedia";
import { PREVIEW_COMPANIONS } from "@/lib/phone/previewData";
import { displayableMediaUrl, isTemporaryProviderUrl } from "@/lib/phone/storageUrl";

export type RosterCompanion = Companion & { loopVideoUrl?: string | null };

export type PhoneLimits = {
  plan: string;
  credits: number;
  textsLeft: number;
  picsLeft: number;
  slots: number;
  catalogOwner: boolean;
  displayName: string;
};

const DEFAULT_LIMITS: PhoneLimits = {
  plan: "free",
  credits: 0,
  textsLeft: 10,
  picsLeft: 0,
  slots: 1,
  catalogOwner: false,
  displayName: "Forgemaster",
};

export function usePhoneRoster(preview: boolean) {
  const [user, setUser] = useState<User | null>(null);
  const [limits, setLimits] = useState<PhoneLimits>(DEFAULT_LIMITS);
  const [companions, setCompanions] = useState<RosterCompanion[]>(preview ? PREVIEW_COMPANIONS : []);
  const [loading, setLoading] = useState(!preview);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [preview]);

  useEffect(() => {
    if (preview || !user) return;
    let cancelled = false;
    void (async () => {
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
            };
          };
        };
      };
      const extended = await client
        .from("profiles")
        .select("display_name, plan, credits, texts_left, pics_left, companion_slots, is_catalog_owner")
        .eq("user_id", user.id)
        .maybeSingle();
      const basic = extended.error
        ? await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
        : null;
      if (cancelled) return;
      const row = extended.data;
      const admin = isPlatformAdmin(user, {
        profileDisplayName: (row?.display_name as string | null) ?? basic?.data?.display_name ?? null,
      });
      setLimits({
        plan: String(row?.plan ?? "free"),
        credits: Number(row?.credits ?? 0),
        textsLeft: Number(row?.texts_left ?? 10),
        picsLeft: Number(row?.pics_left ?? 0),
        slots: Number(row?.companion_slots ?? (admin ? 99 : 1)),
        catalogOwner: Boolean(row?.is_catalog_owner) || admin,
        displayName:
          (typeof row?.display_name === "string" && row.display_name) ||
          basic?.data?.display_name ||
          user.email?.split("@")[0] ||
          "Forgemaster",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [preview, user]);

  useEffect(() => {
    if (preview || !user) return;
    let cancelled = false;
    void loadRoster(user.id, limits.catalogOwner).then((rows) => {
      if (!cancelled) {
        setCompanions(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [preview, user, limits.catalogOwner]);

  return {
    user,
    limits: preview
      ? { ...DEFAULT_LIMITS, catalogOwner: true, displayName: "Preview", slots: 99, plan: "inferno", credits: 1200 }
      : limits,
    companions,
    loading,
  };
}

function loopVideoFromRow(row: Record<string, unknown>): string | null {
  const raw = typeof row.animated_image_url === "string" ? row.animated_image_url : "";
  const url = displayableMediaUrl(raw);
  if (!url || isTemporaryProviderUrl(url)) return null;
  if (isLoopVideoStorageUrl(url)) return url;
  if (row.profile_loop_video_enabled === true && !/\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)) return url;
  return null;
}

/** Real companions live in custom_characters. The companions table is empty in production. */
async function loadRoster(userId: string, catalogOwner: boolean): Promise<RosterCompanion[]> {
  const own = await supabase
    .from("custom_characters")
    .select("*")
    .eq("user_id", userId)
    .eq("hidden_from_dashboard", false)
    .order("created_at", { ascending: false });

  let rows = (own.data ?? []) as Record<string, unknown>[];
  if (catalogOwner) {
    const all = await supabase
      .from("custom_characters")
      .select("*")
      .eq("hidden_from_dashboard", false)
      .order("created_at", { ascending: false });
    if (!all.error && all.data && all.data.length >= rows.length) {
      rows = all.data as Record<string, unknown>[];
    }
  }

  const mapped: RosterCompanion[] = rows.map((row) => ({
    ...dbToCompanion(mapSupabaseCustomCharacterRow(row)),
    loopVideoUrl: loopVideoFromRow(row),
  }));
  const seen = new Set(mapped.map((item) => item.id));
  const stock = await supabase.from("companions").select("*").eq("is_active", true).eq("hidden_from_dashboard", false);
  if (!stock.error && stock.data?.length) {
    for (const row of stock.data as Record<string, unknown>[]) {
      const companion = dbToCompanion(mapSupabaseStockCompanionRow(row));
      if (!seen.has(companion.id)) mapped.push({ ...companion, loopVideoUrl: loopVideoFromRow(row) });
    }
  }
  return mapped;
}

/**
 * Resolve one companion for an existing thread, bond, or gallery reference.
 * Does not apply `hidden_from_dashboard` — a hidden companion must still show name and avatar.
 */
export async function fetchRosterCompanionById(id: string): Promise<RosterCompanion | null> {
  if (!id) return null;
  if (id.startsWith("cc-")) {
    const { data, error } = await supabase.from("custom_characters").select("*").eq("id", id.slice(3)).maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return { ...dbToCompanion(mapSupabaseCustomCharacterRow(row)), loopVideoUrl: loopVideoFromRow(row) };
  }
  const { data, error } = await supabase.from("companions").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    ...dbToCompanion(mapSupabaseStockCompanionRow(row)),
    loopVideoUrl: loopVideoFromRow(row),
  };
}
