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
  type AffiliateImageAspect,
  type AffiliateImageFit,
  type AffiliateMediaType,
  type AffiliateShopProduct,
} from "@/hooks/useAffiliateShop";
import { AffiliateProductMedia } from "@/components/affiliate/AffiliateProductMedia";
import { affiliateUrlForStorage, isValidAffiliateUrlInput, normalizeAffiliateUrl } from "@/lib/affiliateUrl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NEON = "#D6336C";

type ProductDraft = {
  id: string;
  sort_order: number;
  name: string;
  description: string;
  image_url: string;
  affiliate_url: string;
  badge: string;
  is_active: boolean;
  image_fit: AffiliateImageFit;
  image_aspect: AffiliateImageAspect;
  media_type: AffiliateMediaType;
  media_html: string;
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
    image_fit: row.image_fit === "cover" ? "cover" : "contain",
    image_aspect:
      row.image_aspect === "portrait" || row.image_aspect === "landscape" || row.image_aspect === "square"
        ? row.image_aspect
        : "auto",
    media_type: row.media_type === "html" ? "html" : "image",
    media_html: row.media_html ?? "",
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
    image_fit: "contain",
    image_aspect: "auto",
    media_type: "image",
    media_html: "",
    isNew: true,
  };
}

function productPayloadFromDraft(draft: ProductDraft) {
  return {
    sort_order: draft.sort_order,
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    image_url: draft.image_url.trim() || null,
    affiliate_url: affiliateUrlForStorage(draft.affiliate_url),
    badge: draft.badge.trim() || null,
    is_active: draft.is_active,
    image_fit: draft.image_fit,
    image_aspect: draft.image_aspect,
    media_type: draft.media_type,
    media_html: draft.media_type === "html" ? draft.media_html.trim() || null : null,
    updated_at: new Date().toISOString(),
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
      const payload = productPayloadFromDraft(draft);

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
            ...productPayloadFromDraft(draft),
            id: draft.id,
            updated_at: new Date().toISOString(),
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
                  {draft.media_type === "image" ? (
                    <div className="shrink-0 space-y-3 w-full max-w-[220px]">
                      <p className="text-xs font-medium text-muted-foreground">Image preview</p>
                      <div className="overflow-hidden rounded-lg border border-white/10">
                        <AffiliateProductMedia
                          name={draft.name}
                          imageUrl={draft.image_url}
                          badge={draft.badge}
                          imageFit={draft.image_fit}
                          imageAspect={draft.image_aspect}
                          mediaType={draft.media_type}
                          mediaHtml={draft.media_html}
                          bare
                        />
                      </div>
                      <button
                          type="button"
                          disabled={uploadingId === draft.id}
                          onClick={() => fileInputRefs.current[draft.id]?.click()}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/35 bg-primary/5 py-2 text-xs font-medium text-primary hover:bg-primary/10"
                        >
                          {uploadingId === draft.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <ImagePlus className="h-3.5 w-3.5" />
                              Upload image
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
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          <strong className="text-foreground/70">Tip:</strong> Upload your Lovense banner — the shop
                          page sizes the frame to the image automatically.
                        </p>
                    </div>
                  ) : null}

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
                      {!isValidAffiliateUrlInput(draft.affiliate_url) ? (
                        <p className="mt-1 text-[10px] text-amber-400/90">
                          Add a valid affiliate link (https://… or www.lovense.com/…). Shop Now stays disabled until
                          saved with a real URL.
                        </p>
                      ) : (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Saves as {normalizeAffiliateUrl(draft.affiliate_url)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Media type</label>
                      <Select
                        value={draft.media_type}
                        onValueChange={(v) => updateDraft(draft.id, { media_type: v as AffiliateMediaType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="html">Custom HTML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Image fit</label>
                      <Select
                        value={draft.image_fit}
                        onValueChange={(v) => updateDraft(draft.id, { image_fit: v as AffiliateImageFit })}
                        disabled={draft.media_type === "html"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contain">Contain (show all)</SelectItem>
                          <SelectItem value="cover">Cover (crop to fill)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Aspect preset</label>
                      <Select
                        value={draft.image_aspect}
                        onValueChange={(v) => updateDraft(draft.id, { image_aspect: v as AffiliateImageAspect })}
                        disabled={draft.media_type === "html"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="portrait">Portrait (3:4)</SelectItem>
                          <SelectItem value="landscape">Landscape (4:3)</SelectItem>
                          <SelectItem value="square">Square (1:1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {draft.media_type === "html" ? (
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-muted-foreground">Custom HTML</label>
                        <Textarea
                          value={draft.media_html}
                          onChange={(e) => updateDraft(draft.id, { media_html: e.target.value })}
                          rows={4}
                          placeholder='<img src="https://..." alt="Product" />'
                          className="font-mono text-xs"
                        />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          For advanced embeds. Scripts are stripped for safety. HTTPS URLs only.
                        </p>
                      </div>
                    ) : null}
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
