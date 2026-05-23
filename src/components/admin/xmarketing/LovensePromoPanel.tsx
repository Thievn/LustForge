import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Sparkles, Wand2, Calendar, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionInvokeMessage } from "@/lib/edgeFunction";
import { invokeZernioSocial } from "@/lib/zernioSocial";
import {
  DEFAULT_AFFILIATE_SHOP_SETTINGS,
  useAffiliateShop,
} from "@/hooks/useAffiliateShop";
import type { DbCompanion } from "@/hooks/useCompanions";
import { isVideoPortraitUrl } from "@/lib/companionMedia";
import { resolveLovenseComboMediaUrls } from "@/lib/lovenseComboMedia";
import { LovenseCompanionPicker } from "@/components/admin/xmarketing/LovenseCompanionPicker";
import { bakeLovensePromoCardPngBlob, uploadLovensePromoCard } from "@/lib/bakeLovensePromoCard";
import {
  appendLovenseShopLinkToTweet,
  defaultShopUrl,
  LOVENSE_CAMPAIGN_TEMPLATES,
  LOVENSE_POST_FORMATS,
  type LovenseCampaignTemplate,
  type LovensePostFormat,
  type LovenseTweetVariation,
} from "@/lib/lovensePromoTweet";
import { MarketingTweetPreview } from "@/components/admin/xmarketing/MarketingTweetPreview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NEON = "#FF2D7B";

const TONES = ["Professional", "Teasing", "Elegant", "Aggressive Hype", "Mysterious"] as const;
const POST_STYLES = ["Punchy one-liner", "Drop / FOMO", "Quote-bait"] as const;
const IMAGE_MODES = [
  { id: "branded_product", label: "Branded product card" },
  { id: "companion_combo", label: "Companion video + banner (2 files)" },
  { id: "raw_product", label: "Product image as-is" },
] as const;

type ImageMode = (typeof IMAGE_MODES)[number]["id"];

type Props = {
  roster: DbCompanion[];
  rosterLoading: boolean;
  siteOrigin: string;
};

export function LovensePromoPanel({ roster, rosterLoading, siteOrigin }: Props) {
  const queryClient = useQueryClient();
  const { settings, products, isLoading: productsLoading } = useAffiliateShop(false);

  const [campaignTemplate, setCampaignTemplate] = useState<LovenseCampaignTemplate>("sync_focus");
  const [postFormat, setPostFormat] = useState<LovensePostFormat>("product_only");
  const [productId, setProductId] = useState<string>("");
  const [companionId, setCompanionId] = useState<string>("");
  const [tone, setTone] = useState<string>("Elegant");
  const [tweetStyle, setTweetStyle] = useState<string>(POST_STYLES[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [imageMode, setImageMode] = useState<ImageMode>("branded_product");
  const [variations, setVariations] = useState<LovenseTweetVariation[] | null>(null);
  const [pickVar, setPickVar] = useState(0);
  const [editedText, setEditedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [baking, setBaking] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPrepWarning, setMediaPrepWarning] = useState<string | null>(null);
  const [scheduleLocal, setScheduleLocal] = useState("");
  const [postBusy, setPostBusy] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [products],
  );

  const selectedProduct = useMemo(
    () => activeProducts.find((p) => p.id === productId) ?? activeProducts[0] ?? null,
    [activeProducts, productId],
  );

  const selectedCompanion = useMemo(
    () => roster.find((c) => c.id === companionId) ?? null,
    [roster, companionId],
  );

  const shopUrl = defaultShopUrl(siteOrigin);

  useEffect(() => {
    if (activeProducts.length && !productId) {
      setProductId(activeProducts[0]!.id);
    }
  }, [activeProducts, productId]);

  useEffect(() => {
    const tpl = LOVENSE_CAMPAIGN_TEMPLATES.find((t) => t.id === campaignTemplate);
    if (tpl) setTone(tpl.defaultTone);
  }, [campaignTemplate]);

  useEffect(() => {
    if (postFormat === "companion_combo") {
      setImageMode("companion_combo");
    } else if (imageMode === "companion_combo") {
      setImageMode("branded_product");
    }
  }, [postFormat, imageMode]);

  const ctaLine = useMemo(() => {
    if (campaignTemplate === "sync_focus") return "Pair your toy — sync in LustForge chat";
    if (campaignTemplate === "fomo") return "Get sync-ready before we open";
    return selectedProduct ? `Shop ${selectedProduct.name} on LustForge` : "Shop syncable toys on LustForge";
  }, [campaignTemplate, selectedProduct]);

  const baseVariation = variations?.[pickVar] ?? null;

  const tweetWithTags = useMemo(() => {
    const body = editedText.trim();
    if (!body && !baseVariation) return "";
    if (baseVariation) {
      const tags = baseVariation.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
      const textOnly = body || baseVariation.text;
      if (body.includes("#Lovense") || body.includes("#GrokAI")) return body;
      return tags ? `${textOnly} ${tags}` : textOnly;
    }
    return body;
  }, [editedText, baseVariation]);

  const fullTweetForPreview = useMemo(() => {
    if (!tweetWithTags) return "";
    return appendLovenseShopLinkToTweet(tweetWithTags, shopUrl, ctaLine);
  }, [tweetWithTags, shopUrl, ctaLine]);

  useEffect(() => {
    if (baseVariation) {
      setEditedText(baseVariation.text);
    }
  }, [baseVariation?.text, pickVar]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateCopy = async () => {
    if (!selectedProduct) {
      toast.error("Select an active affiliate product first.");
      return;
    }
    if (postFormat === "companion_combo" && !selectedCompanion) {
      toast.error("Select a companion for combo posts.");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-x-marketing", {
        body: {
          mode: "generate_lovense",
          tone,
          tweetStyle,
          customPrompt,
          campaignTemplate,
          postFormat,
          shopUrl,
          heroTitle: settings?.hero_title ?? DEFAULT_AFFILIATE_SHOP_SETTINGS.hero_title,
          heroSubtitle: settings?.hero_subtitle ?? DEFAULT_AFFILIATE_SHOP_SETTINGS.hero_subtitle,
          syncSectionBody: settings?.sync_section_body ?? DEFAULT_AFFILIATE_SHOP_SETTINGS.sync_section_body,
          product: {
            name: selectedProduct.name,
            description: selectedProduct.description,
            badge: selectedProduct.badge,
          },
          companion: selectedCompanion
            ? {
                name: selectedCompanion.name,
                tagline: selectedCompanion.tagline,
                rarity: selectedCompanion.rarity,
                role: selectedCompanion.role,
              }
            : null,
        },
      });
      if (error) throw new Error(await getEdgeFunctionInvokeMessage(error, data));
      const vars = (data as { variations?: LovenseTweetVariation[] })?.variations;
      if (!Array.isArray(vars) || vars.length < 1) throw new Error("No variations returned");
      setVariations(vars);
      setPickVar(0);
      setEditedText(vars[0]!.text);
      toast.success("Grok copy ready — pick a variation or edit.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const prepareComboMedia = useCallback(() => {
    if (!selectedCompanion || !selectedProduct) {
      toast.error("Select a companion and product first.");
      return false;
    }
    const result = resolveLovenseComboMediaUrls(selectedCompanion, selectedProduct);
    setMediaUrls(result.mediaUrls);
    setMediaPrepWarning(result.warnings.length ? result.warnings.join(" ") : null);
    if (result.mediaUrls.length >= 2) {
      toast.success("Ready — companion + product banner will attach as 2 items on X.");
      return true;
    }
    toast.error(result.warnings[0] ?? "Could not prepare combo media.");
    return false;
  }, [selectedCompanion, selectedProduct]);

  const bakeMedia = useCallback(async () => {
    if (!selectedProduct) return;
    if (imageMode === "companion_combo" || postFormat === "companion_combo") {
      prepareComboMedia();
      return;
    }
    setBaking(true);
    setMediaPrepWarning(null);
    try {
      let blob: Blob;
      const slug = selectedProduct.id.slice(0, 8);
      if (imageMode === "raw_product" && selectedProduct.image_url) {
        setMediaUrls([selectedProduct.image_url.split("?")[0]!]);
        toast.success("Using product image URL.");
        return;
      }
      blob = await bakeLovensePromoCardPngBlob({
        productName: selectedProduct.name,
        productDescription: selectedProduct.description,
        productImageUrl: selectedProduct.image_url,
        badge: selectedProduct.badge,
      });
      const url = await uploadLovensePromoCard(supabase, blob, slug);
      setMediaUrls([url]);
      toast.success("X media baked and uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bake failed");
    } finally {
      setBaking(false);
    }
  }, [imageMode, postFormat, prepareComboMedia, selectedProduct]);

  useEffect(() => {
    if (postFormat !== "companion_combo" || !selectedCompanion || !selectedProduct) return;
    const result = resolveLovenseComboMediaUrls(selectedCompanion, selectedProduct);
    setMediaUrls(result.mediaUrls);
    setMediaPrepWarning(result.warnings.length ? result.warnings.join(" ") : null);
  }, [postFormat, selectedCompanion, selectedProduct]);

  const postToX = async (scheduled: boolean) => {
    if (!fullTweetForPreview.trim()) {
      toast.error("Generate or write tweet copy first.");
      return;
    }
    setPostBusy(true);
    try {
      const scheduledFor = scheduled && scheduleLocal ? new Date(scheduleLocal).toISOString() : undefined;
      if (scheduled && scheduleLocal && Number.isNaN(new Date(scheduleLocal).getTime())) {
        toast.error("Invalid schedule time.");
        return;
      }
      const body: Record<string, unknown> = {
        mode: "post",
        content: fullTweetForPreview,
        publishNow: !scheduledFor,
      };
      if (scheduledFor) body.scheduledFor = scheduledFor;
      if (mediaUrls.length) body.mediaUrls = mediaUrls.map((u) => u.split("?")[0]!);
      const { data, error } = await invokeZernioSocial(body);
      if (error) throw error;
      const z = data as { platformPostUrl?: string; publishWarning?: string };
      toast.success(scheduledFor ? "Scheduled on Zernio" : "Posted to X via Zernio", {
        description: z.platformPostUrl || z.publishWarning,
      });
      void queryClient.invalidateQueries({ queryKey: ["social-post-jobs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Post failed");
    } finally {
      setPostBusy(false);
    }
  };

  const previewMedia =
    mediaUrls.length > 0 ? (
      <div
        className={cn(
          "grid gap-2 w-full",
          mediaUrls.length > 1 ? "grid-cols-2 max-w-lg mx-auto" : "grid-cols-1 max-w-md mx-auto",
        )}
      >
        {mediaUrls.map((url, i) => {
          const isVideo = isVideoPortraitUrl(url);
          const label = i === 0 && postFormat === "companion_combo" ? "Companion" : i === 1 ? "Banner" : "Media";
          return (
            <div key={`${url}-${i}`} className="space-y-1">
              <p className="text-[9px] uppercase tracking-wider text-[#71767b] text-center">{label}</p>
              {isVideo ? (
                <video
                  src={url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-xl border border-white/10 object-contain bg-black max-h-[220px]"
                />
              ) : (
                <img
                  src={url}
                  alt=""
                  className="w-full rounded-xl border border-white/10 object-contain bg-black/40 max-h-[220px]"
                />
              )}
            </div>
          );
        })}
      </div>
    ) : selectedProduct?.image_url ? (
      <img
        src={selectedProduct.image_url}
        alt=""
        className="w-full rounded-xl border border-white/10 object-contain max-h-[280px] bg-black/40"
      />
    ) : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <div className="xl:col-span-7 space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: NEON }} />
            <h3 className="font-gothic text-lg text-white">Lovense Promo</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Grok copy + X media for{" "}
            <a href="/toys" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              /toys
            </a>
            . Combo posts attach the companion loop video and raw product banner as two separate files on X.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Campaign template
              </label>
              <Select value={campaignTemplate} onValueChange={(v) => setCampaignTemplate(v as LovenseCampaignTemplate)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOVENSE_CAMPAIGN_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Post format
              </label>
              <Select value={postFormat} onValueChange={(v) => setPostFormat(v as LovensePostFormat)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOVENSE_POST_FORMATS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Product
              </label>
              <Select
                value={selectedProduct?.id ?? ""}
                onValueChange={setProductId}
                disabled={productsLoading || activeProducts.length === 0}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No active products" />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {postFormat === "companion_combo" ? (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Companion
                </label>
                <LovenseCompanionPicker
                  roster={roster}
                  loading={rosterLoading}
                  value={companionId}
                  onChange={setCompanionId}
                  siteOrigin={siteOrigin}
                  selected={selectedCompanion}
                />
              </div>
            ) : null}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/60 border border-border px-3 py-2 text-sm"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Post shape
              </label>
              <select
                value={tweetStyle}
                onChange={(e) => setTweetStyle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/60 border border-border px-3 py-2 text-sm"
              >
                {POST_STYLES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                X image
              </label>
              <select
                value={imageMode}
                onChange={(e) => setImageMode(e.target.value as ImageMode)}
                className="mt-1 w-full rounded-xl bg-black/60 border border-border px-3 py-2 text-sm"
                disabled={postFormat === "companion_combo"}
              >
                {IMAGE_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Operator prompt
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
              placeholder="e.g. Focus on Lush 4 sync, tease pre-launch…"
              className="mt-1"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void generateCopy()}
              disabled={generating || !selectedProduct}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white border border-white/10 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${NEON}, hsl(280 48% 40%))` }}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate with Grok
            </button>
            <button
              type="button"
              onClick={() => void bakeMedia()}
              disabled={baking || !selectedProduct}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
            >
              {baking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {postFormat === "companion_combo" || imageMode === "companion_combo"
                ? "Prepare X media"
                : "Rebake X image"}
            </button>
          </div>

          {mediaPrepWarning ? (
            <p className="text-[11px] text-amber-200/90 border border-amber-500/25 rounded-lg px-3 py-2 bg-amber-500/10 leading-snug">
              {mediaPrepWarning}
            </p>
          ) : null}

          {postFormat === "companion_combo" && mediaUrls.length >= 2 ? (
            <p className="text-[11px] text-muted-foreground leading-snug">
              X will show {mediaUrls.length} attachments side by side — companion loop + Lovense banner (not a baked
              screenshot).
            </p>
          ) : null}

          {variations && variations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {variations.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPickVar(i);
                    setEditedText(v.text);
                  }}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border",
                    pickVar === i ? "border-primary/50 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground",
                  )}
                >
                  Variation {i + 1}
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Tweet body (hashtags appended on post)
            </label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
              className="mt-1 font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Shop link auto-appended: {shopUrl}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-white/[0.06]">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Schedule (optional)
              </label>
              <Input
                type="datetime-local"
                value={scheduleLocal}
                onChange={(e) => setScheduleLocal(e.target.value)}
                className="mt-1"
              />
            </div>
            <button
              type="button"
              disabled={postBusy}
              onClick={() => void postToX(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
            >
              {postBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post now
            </button>
            <button
              type="button"
              disabled={postBusy || !scheduleLocal}
              onClick={() => void postToX(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <Calendar className="h-4 w-4" />
              Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="xl:col-span-5 xl:sticky xl:top-4 space-y-4">
        {postFormat === "companion_combo" && selectedCompanion ? (
          <p className="text-xs text-muted-foreground px-1">
            Combo: {selectedCompanion.name} + {selectedProduct?.name ?? "product"}
            {mediaUrls.length >= 2 ? " · 2 attachments ready" : " · preparing media…"}
          </p>
        ) : null}
        <MarketingTweetPreview
          fullText={fullTweetForPreview || "Generate copy to preview…"}
          charCount={fullTweetForPreview.length}
          maxChars={280}
          media={previewMedia}
          mediaBlockedReason={mediaPrepWarning}
        />
      </div>
    </div>
  );
}
