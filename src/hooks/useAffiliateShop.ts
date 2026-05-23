import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  AffiliateImageAspect,
  AffiliateImageFit,
  AffiliateMediaType,
} from "@/lib/affiliateProductMedia";

export type AffiliateShopSettings = Database["public"]["Tables"]["affiliate_shop_settings"]["Row"];
export type AffiliateShopProduct = Database["public"]["Tables"]["affiliate_shop_products"]["Row"];

export type { AffiliateImageAspect, AffiliateImageFit, AffiliateMediaType };

export const DEFAULT_AFFILIATE_SHOP_SETTINGS: Pick<
  AffiliateShopSettings,
  "hero_title" | "hero_subtitle" | "sync_section_body"
> = {
  hero_title: "Enhance Your Companion",
  hero_subtitle:
    "Prepare for launch with app-controlled toys that sync with your LustForge companion in chat.",
  sync_section_body:
    "Pair your Lovense toy through the Lovense app, then link it in LustForge chat. Your companion can respond in real time — vibration patterns, intensity, and rhythm matched to the moment.",
};

export async function fetchAffiliateShopSettings(): Promise<AffiliateShopSettings | null> {
  const { data, error } = await supabase
    .from("affiliate_shop_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAffiliateShopProducts(activeOnly = true): Promise<AffiliateShopProduct[]> {
  let query = supabase
    .from("affiliate_shop_products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function useAffiliateShopSettings() {
  return useQuery({
    queryKey: ["affiliate-shop-settings"],
    queryFn: fetchAffiliateShopSettings,
    staleTime: 60_000,
  });
}

export function useAffiliateShopProducts(activeOnly = true) {
  return useQuery({
    queryKey: ["affiliate-shop-products", activeOnly],
    queryFn: () => fetchAffiliateShopProducts(activeOnly),
    staleTime: 60_000,
  });
}

export function useAffiliateShop(activeOnly = true) {
  const settingsQuery = useAffiliateShopSettings();
  const productsQuery = useAffiliateShopProducts(activeOnly);
  return {
    settings: settingsQuery.data,
    products: productsQuery.data ?? [],
    isLoading: settingsQuery.isLoading || productsQuery.isLoading,
    error: settingsQuery.error ?? productsQuery.error,
    refetch: async () => {
      await Promise.all([settingsQuery.refetch(), productsQuery.refetch()]);
    },
  };
}

const AFFILIATE_SHOP_BUCKET = "affiliate-shop";

export async function uploadAffiliateProductImage(productId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `${productId}/${Date.now()}.${safeExt}`;
  const { error } = await supabase.storage.from(AFFILIATE_SHOP_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(AFFILIATE_SHOP_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
