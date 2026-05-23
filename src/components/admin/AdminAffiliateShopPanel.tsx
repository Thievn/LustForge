import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  ShoppingBag,
  Trash2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_AFFILIATE_SHOP_SETTINGS,
  uploadAffiliateProductImage,
  useAffiliateShop,
  type AffiliateShopProduct,
} from "@/hooks/useAffiliateShop";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const NEON = "#FF2D7B";

type ProductDraft = {
  id: string;
  sort_order: number;
  name: string;
  description: string;
  image_url: string;
  affiliate_url: string;
  badge: string;
  is_active: boolean;
  isNew?: boolean;
};

function toDraft(row: AffiliateShopProduct): ProductDraft {
  return {
    id: row.id,
    sort_order: row.sort_order,
    name: row.name,
    description: row.description ?? "",
    image_url: row.image_url ?? "",
    affiliate_url: row.affiliate_url,
    badge: row.badge ?? "",
    is_active: row.is_active,
  };
}

function emptyDraft(sortOrder: number): ProductDraft {
  return {
    id: crypto.randomUUID(),
    sort_order: sortOrder,
    name: "New product",
    description: "",
    image_url: "",
    affiliate_url: "#",
    badge: "",
    is_active: true,
    isNew: true,
  };
}

export default function AdminAffiliateShopPanel() {
  const queryClient = useQueryClient();
  const { settings, products, isLoading, refetch } = useAffiliateShop(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [heroTitle, setHeroTitle] = useState(DEFAULT_AFFILIATE_SHOP_SETTINGS.hero_title);
  const [heroSubtitle, setHeroSubtitle] = useState(DEFAULT_AFFILIATE_SHOP_SETTINGS.hero_subtitle);
  const [syncBody, setSyncBody] = useState(DEFAULT_AFFILIATE_SHOP_SETTINGS.sync_section_body);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [drafts, setDrafts] = useState<ProductDraft[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setHeroTitle(settings.hero_title);
      setHeroSubtitle(settings.hero_subtitle);
      setSyncBody(settings.sync_section_body);
    }
  }, [settings]);

  useEffect(() => {
    if (!isLoading) {
      setDrafts(products.map(toDraft));
    }
  }, [products, isLoading]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["affiliate-shop-settings"] });
    await queryClient.invalidateQueries({ queryKey: ["affiliate-shop-products"] });
    await refetch();
  }, [queryClient, refetch]);

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const { error } = await supabase
        .from("affiliate_shop_settings")
        .upsert({
          id: 1,
          hero_title: heroTitle.trim(),
          hero_subtitle: heroSubtitle.trim(),
          sync_section_body: syncBody.trim(),
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      toast.success("Page copy saved.");
      await invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateDraft = (id: string, patch: Partial<ProductDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const saveProduct = async (draft: ProductDraft) => {
    if (!draft.name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    setSavingId(draft.id);
    try {
      const payload = {
        sort_order: draft.sort_order,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        image_url: draft.image_url.trim() || null,
        affiliate_url: draft.affiliate_url.trim() || "#",
        badge: draft.badge.trim() || null,
        is_active: draft.is_active,
        updated_at: new Date().toISOString(),
      };

      if (draft.isNew) {
        const { data, error } = await supabase
          .from("affiliate_shop_products")
          .insert({ ...payload, id: draft.id })
          .select("*")
          .single();
        if (error) throw error;
        setDrafts((prev) => prev.map((d) => (d.id === draft.id ? toDraft(data) : d)));
        toast.success("Product added.");
      } else {
        const { error } = await supabase.from("affiliate_shop_products").update(payload).eq("id", draft.id);
        if (error) throw error;
        toast.success("Product saved.");
      }
      await invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save product.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteProduct = async (draft: ProductDraft) => {
    if (draft.isNew) {
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      return;
    }
    if (!window.confirm(`Delete "${draft.name}"?`)) return;
    setDeletingId(draft.id);
    try {
      const { error } = await supabase.from("affiliate_shop_products").delete().eq("id", draft.id);
      if (error) throw error;
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      toast.success("Product deleted.");
      await invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  const duplicateProduct = (draft: ProductDraft) => {
    const nextOrder = Math.max(0, ...drafts.map((d) => d.sort_order)) + 10;
    const copy: ProductDraft = {
      ...draft,
      id: crypto.randomUUID(),
      name: `${draft.name} (copy)`,
      sort_order: nextOrder,
      isNew: true,
    };
    setDrafts((prev) => [...prev, copy]);
  };

  const handleImageUpload = async (draft: ProductDraft, file: File) => {
    setUploadingId(draft.id);
    try {
      let productId = draft.id;
      if (draft.isNew) {
        if (!draft.name.trim()) {
          toast.error("Save the product name first, or save the product before uploading.");
          return;
        }
        const { data, error } = await supabase
          .from("affiliate_shop_products")
          .insert({
            id: draft.id,
            sort_order: draft.sort_order,
            name: draft.name.trim(),
            description: draft.description.trim() || null,
            image_url: null,
            affiliate_url: draft.affiliate_url.trim() || "#",
            badge: draft.badge.trim() || null,
            is_active: draft.is_active,
          })
          .select("*")
          .single();
        if (error) throw error;
        productId = data.id;
        setDrafts((prev) => prev.map((d) => (d.id === draft.id ? toDraft(data) : d)));
      }

      const publicUrl = await uploadAffiliateProductImage(productId, file);
      const { error: updateErr } = await supabase
        .from("affiliate_shop_products")
        .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", productId);
      if (updateErr) throw updateErr;

      setDrafts((prev) =>
        prev.map((d) => (d.id === draft.id || d.id === productId ? { ...d, image_url: publicUrl, isNew: false } : d)),
      );
      toast.success("Image uploaded.");
      await invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploadingId(null);
    }
  };

  const addProduct = () => {
    const nextOrder = drafts.length ? Math.max(...drafts.map((d) => d.sort_order)) + 10 : 10;
    setDrafts((prev) => [...prev, emptyDraft(nextOrder)]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-gothic text-2xl gradient-vice-text flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" style={{ color: NEON }} />
            Affiliate Shop
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the public <code className="text-xs">/toys</code> Lovense affiliate page — copy, images, and links.
          </p>
        </div>
        <Link
          to="/toys"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          Preview shop
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-[1.75rem] border border-border/80 bg-card/40 backdrop-blur-md p-4 md:p-6 space-y-4">
        <h3 className="font-gothic text-lg text-foreground/95">Page copy</h3>
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Hero title</label>
            <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Hero subtitle</label>
            <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sync section body</label>
            <Textarea value={syncBody} onChange={(e) => setSyncBody(e.target.value)} rows={3} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={settingsSaving}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white border border-white/10 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${NEON}, hsl(280 48% 40%))` }}
        >
          {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save page copy
        </button>
      </div>

      <div className="rounded-[1.75rem] border border-border/80 bg-card/40 backdrop-blur-md p-4 md:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-gothic text-lg text-foreground/95">Products</h3>
          <button
            type="button"
            onClick={addProduct}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading products…
          </div>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No products yet — add one to get started.</p>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={cn(
                  "rounded-2xl border border-white/[0.08] bg-black/20 p-4 md:p-5 space-y-4",
                  !draft.is_active && "opacity-70",
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="shrink-0">
                    <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                      {draft.image_url ? (
                        <img src={draft.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={uploadingId === draft.id}
                        onClick={() => fileInputRefs.current[draft.id]?.click()}
                        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/70 py-1.5 text-[10px] font-medium text-white hover:bg-black/85"
                      >
                        {uploadingId === draft.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <ImagePlus className="h-3 w-3" />
                            Upload
                          </>
                        )}
                      </button>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[draft.id] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleImageUpload(draft, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Name</label>
                      <Input value={draft.name} onChange={(e) => updateDraft(draft.id, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Badge (optional)</label>
                      <Input value={draft.badge} onChange={(e) => updateDraft(draft.id, { badge: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">Description</label>
                      <Textarea
                        value={draft.description}
                        onChange={(e) => updateDraft(draft.id, { description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">Affiliate URL</label>
                      <Input
                        value={draft.affiliate_url}
                        onChange={(e) => updateDraft(draft.id, { affiliate_url: e.target.value })}
                        placeholder="https://www.lovense.com/r/XXXXXX"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Sort order</label>
                      <Input
                        type="number"
                        value={draft.sort_order}
                        onChange={(e) => updateDraft(draft.id, { sort_order: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        checked={draft.is_active}
                        onCheckedChange={(checked) => updateDraft(draft.id, { is_active: checked })}
                      />
                      <span className="text-sm text-muted-foreground">Active on shop page</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void saveProduct(draft)}
                    disabled={savingId === draft.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                  >
                    {savingId === draft.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateProduct(draft)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/[0.04]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteProduct(draft)}
                    disabled={deletingId === draft.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    {deletingId === draft.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </button>
                  {draft.isNew ? (
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-amber-400/90 self-center">
                      Unsaved — click Save
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
